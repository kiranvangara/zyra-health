import { supabase } from '../utils/supabase';

// ─────────────────────────────────────────────
// Analytics Data Actions — Supabase Queries
// ─────────────────────────────────────────────

export async function getAnalyticsData(days: number | 'all' = 30, specialty: string = 'all') {
    try {
        const now = new Date();
        const cutoffDate = days === 'all' ? null : new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        // Parallel fetch all data
        let appointmentsQuery = supabase.from('appointments').select('id, status, scheduled_at, doctor_id, patient_id, created_at');
        let doctorsQuery = supabase.from('doctors').select('id, display_name, specialization, is_verified, consultation_fee, experience_years, created_at');
        let patientsQuery = supabase.from('patients').select('id, created_at, age, consent_withdrawn');
        let reviewsQuery = supabase.from('reviews').select('id, rating, is_approved, created_at, doctor_id');
        let prescriptionsQuery = supabase.from('prescriptions').select('id, appointment_id, created_at');

        if (cutoffDate) {
            appointmentsQuery = appointmentsQuery.gte('created_at', cutoffDate);
            patientsQuery = patientsQuery.gte('created_at', cutoffDate);
            reviewsQuery = reviewsQuery.gte('created_at', cutoffDate);
            prescriptionsQuery = prescriptionsQuery.gte('created_at', cutoffDate);
        }

        if (specialty !== 'all') {
            doctorsQuery = doctorsQuery.eq('specialization', specialty);
        }

        const [
            appointmentsRes,
            doctorsRes,
            patientsRes,
            reviewsRes,
            responsesRes, // review_responses fetched in full, filtered locally below if needed
            prescriptionsRes,
        ] = await Promise.all([
            appointmentsQuery,
            doctorsQuery,
            patientsQuery,
            reviewsQuery,
            supabase.from('review_responses').select('id, review_id, question_key, score'),
            prescriptionsQuery,
        ]);

        let appointments = appointmentsRes.data || [];
        const doctors = doctorsRes.data || [];
        const patients = patientsRes.data || [];
        let reviews = reviewsRes.data || [];
        let responses = responsesRes.data || [];
        let prescriptions = prescriptionsRes.data || [];

        // Apply specialty filter locally to relations if needed
        if (specialty !== 'all') {
            const docIds = new Set(doctors.map(d => d.id));
            appointments = appointments.filter(a => docIds.has(a.doctor_id));
            reviews = reviews.filter(r => docIds.has(r.doctor_id));

            const reviewIds = new Set(reviews.map(r => r.id));
            responses = responses.filter(r => reviewIds.has(r.review_id));

            const apptIds = new Set(appointments.map(a => a.id));
            prescriptions = prescriptions.filter(p => apptIds.has(p.appointment_id));
        }

        // Fetch all specialties for the filter dropdown
        const { data: allDocs } = await supabase.from('doctors').select('specialization');
        const availableSpecialties = Array.from(new Set((allDocs || []).map(d => d.specialization).filter(Boolean)));

        // ─── KPI Cards ───
        const completed = appointments.filter(a => a.status === 'completed');
        const cancelled = appointments.filter(a => a.status === 'cancelled');
        const confirmed = appointments.filter(a => a.status === 'confirmed');
        const totalRevenue = completed.reduce((sum, a) => {
            const doc = doctors.find(d => d.id === a.doctor_id);
            return sum + (doc?.consultation_fee || 0);
        }, 0);

        const kpis = {
            totalPatients: patients.length,
            totalDoctors: doctors.length,
            verifiedDoctors: doctors.filter(d => d.is_verified).length,
            totalAppointments: appointments.length,
            completedConsultations: completed.length,
            cancelledAppointments: cancelled.length,
            upcomingAppointments: confirmed.length,
            totalRevenue,
            totalPrescriptions: prescriptions.length,
            totalReviews: reviews.length,
            approvedReviews: reviews.filter(r => r.is_approved).length,
        };

        // ─── Daily Trends ───
        const trendDays = days === 'all' ? 30 : days; // default to 30 days chart if "all"
        const trendCutoff = new Date(now.getTime() - trendDays * 24 * 60 * 60 * 1000);
        const dailyTrends: Record<string, { signups: number; bookings: number; completions: number }> = {};

        for (let i = 0; i < trendDays; i++) {
            const d = new Date(trendCutoff.getTime() + i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            dailyTrends[key] = { signups: 0, bookings: 0, completions: 0 };
        }

        patients.forEach(p => {
            if (!p.created_at) return;
            const key = new Date(p.created_at).toISOString().split('T')[0];
            if (dailyTrends[key]) dailyTrends[key].signups++;
        });

        appointments.forEach(a => {
            const createdKey = new Date(a.created_at).toISOString().split('T')[0];
            if (dailyTrends[createdKey]) dailyTrends[createdKey].bookings++;

            if (a.status === 'completed') {
                const schedKey = new Date(a.scheduled_at).toISOString().split('T')[0];
                if (dailyTrends[schedKey]) dailyTrends[schedKey].completions++;
            }
        });

        // ─── Booking Funnel ───
        const uniqueBookers = new Set(appointments.map(a => a.patient_id)).size;
        const uniqueCompleters = new Set(completed.map(a => a.patient_id)).size;
        const uniqueReviewers = new Set(reviews.map(r => r.doctor_id)).size; // approximate

        const funnel = {
            signedUp: patients.length,
            booked: uniqueBookers,
            completed: uniqueCompleters,
            reviewed: reviews.length,
            prescribed: prescriptions.length,
        };

        // ─── Doctor Performance ───
        const doctorPerformance = doctors
            .filter(d => d.is_verified)
            .map(doc => {
                const docAppts = appointments.filter(a => a.doctor_id === doc.id);
                const docCompleted = docAppts.filter(a => a.status === 'completed').length;
                const docCancelled = docAppts.filter(a => a.status === 'cancelled').length;
                const docReviews = reviews.filter(r => r.doctor_id === doc.id);
                const avgRating = docReviews.length > 0
                    ? docReviews.reduce((s, r) => s + (r.rating || 0), 0) / docReviews.length
                    : 0;
                const docRx = prescriptions.filter(p =>
                    docAppts.some(a => a.id === p.appointment_id)
                ).length;
                const rxRate = docCompleted > 0 ? Math.round((docRx / docCompleted) * 100) : 0;

                return {
                    id: doc.id,
                    name: doc.display_name,
                    specialization: doc.specialization,
                    totalBookings: docAppts.length,
                    completed: docCompleted,
                    cancelled: docCancelled,
                    avgRating: Math.round(avgRating * 10) / 10,
                    reviewCount: docReviews.length,
                    rxRate,
                    fee: doc.consultation_fee,
                    revenue: docCompleted * (doc.consultation_fee || 0),
                };
            })
            .sort((a, b) => b.completed - a.completed);

        // ─── Specialty Demand ───
        const specialtyCounts: Record<string, { doctors: number; bookings: number; completed: number }> = {};
        doctors.forEach(d => {
            if (!d.specialization) return;
            if (!specialtyCounts[d.specialization]) {
                specialtyCounts[d.specialization] = { doctors: 0, bookings: 0, completed: 0 };
            }
            specialtyCounts[d.specialization].doctors++;
        });
        appointments.forEach(a => {
            const doc = doctors.find(d => d.id === a.doctor_id);
            if (!doc?.specialization) return;
            if (!specialtyCounts[doc.specialization]) {
                specialtyCounts[doc.specialization] = { doctors: 0, bookings: 0, completed: 0 };
            }
            specialtyCounts[doc.specialization].bookings++;
            if (a.status === 'completed') specialtyCounts[doc.specialization].completed++;
        });

        const specialtyDemand = Object.entries(specialtyCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.bookings - a.bookings);

        // ─── Review Sentiment by Dimension ───
        const dimensionScores: Record<string, { total: number; count: number }> = {};
        responses.forEach(r => {
            if (!dimensionScores[r.question_key]) {
                dimensionScores[r.question_key] = { total: 0, count: 0 };
            }
            dimensionScores[r.question_key].total += r.score;
            dimensionScores[r.question_key].count++;
        });

        const reviewSentiment = Object.entries(dimensionScores)
            .map(([key, data]) => ({
                dimension: key,
                avgScore: Math.round((data.total / data.count) * 10) / 10,
                responseCount: data.count,
            }))
            .sort((a, b) => b.responseCount - a.responseCount);

        // ─── Observability / Failure Modes ───
        const pastAppointments = appointments.filter(a => new Date(a.scheduled_at) < now);
        const noShows = pastAppointments.filter(a => a.status === 'confirmed').length; // confirmed but past = no-show
        const cancellationRate = appointments.length > 0
            ? Math.round((cancelled.length / appointments.length) * 100)
            : 0;
        const completionRate = pastAppointments.length > 0
            ? Math.round((completed.length / pastAppointments.length) * 100)
            : 0;
        const rxCompletionRate = completed.length > 0
            ? Math.round((prescriptions.length / completed.length) * 100)
            : 0;
        const reviewRate = completed.length > 0
            ? Math.round((reviews.length / completed.length) * 100)
            : 0;

        // Patients who signed up but never booked
        const bookedPatientIds = new Set(appointments.map(a => a.patient_id));
        const windowShoppers = patients.filter(p => !bookedPatientIds.has(p.id)).length;

        // One-and-done: patients with exactly 1 completed consultation
        const patientCompletionCounts: Record<string, number> = {};
        completed.forEach(a => {
            patientCompletionCounts[a.patient_id] = (patientCompletionCounts[a.patient_id] || 0) + 1;
        });
        const oneAndDone = Object.values(patientCompletionCounts).filter(c => c === 1).length;
        const powerUsers = Object.values(patientCompletionCounts).filter(c => c >= 3).length;

        const observability = {
            noShows,
            cancellationRate,
            completionRate,
            rxCompletionRate,
            reviewRate,
            windowShoppers,
            windowShopperRate: patients.length > 0 ? Math.round((windowShoppers / patients.length) * 100) : 0,
            oneAndDone,
            powerUsers,
            pendingDoctorApprovals: doctors.filter(d => !d.is_verified).length,
            pendingReviews: reviews.filter(r => !r.is_approved).length,
            consentWithdrawn: patients.filter(p => p.consent_withdrawn).length,
        };

        return {
            availableSpecialties,
            kpis,
            dailyTrends,
            funnel,
            doctorPerformance,
            specialtyDemand,
            reviewSentiment,
            observability,
            error: null,
        };
    } catch (error: any) {
        console.error('Analytics error:', error);
        return { error: error.message };
    }
}

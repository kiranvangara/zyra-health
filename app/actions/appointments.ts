'use server';

import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone } from 'date-fns-tz';

// Admin client for fetching user metadata (Patient Names)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function getDoctorAppointments(doctorId: string, timeZone: string) {
    try {
        const today = new Date();
        // Fetch upcoming confirmed appointments
        const { data: appts, error } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('status', 'confirmed')
            .gte('scheduled_at', today.toISOString())
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            return { data: [] };
        }

        // Enrich with Patient Details
        const enriched = await Promise.all(appts.map(async (a: any) => {
            let patientName = 'Unknown Patient';

            // 1. Try fetching from public 'patients' table first (most reliable if profile exists)
            const { data: patientProfile } = await supabaseAdmin
                .from('patients')
                .select('full_name')
                .eq('id', a.patient_id)
                .single();

            if (patientProfile?.full_name) {
                patientName = patientProfile.full_name;
            } else {
                // 2. Fallback to Auth Metadata
                const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(a.patient_id);
                if (user?.user_metadata?.full_name) {
                    patientName = user.user_metadata.full_name;
                } else if (user?.email) {
                    patientName = user.email;
                }
            }

            // Generate Display Time explicitly in Doctor's Timezone
            // This ensures "10:00 AM" in DB is displayed as "10:00 AM" to the doctor, regardless of browser
            const displayTime = formatInTimeZone(new Date(a.scheduled_at), timeZone, 'h:mm a');

            return {
                ...a,
                type: 'appointment',
                patient_name: patientName,
                dateRaw: a.scheduled_at, // Send original UTC for sorting
                displayTime: displayTime
            };
        }));

        return { data: enriched };

    } catch (err: any) {
        console.error('Server Action Error:', err);
        return { data: [], error: err.message };
    }
}

export async function getPatientHistory(doctorId: string) {
    try {
        const { data: appts, error } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('scheduled_at', { ascending: false });

        if (error) throw error;

        const enriched = await Promise.all(appts.map(async (a: any) => {
            let patientName = 'Patient';
            // 1. Try 'patients' table
            const { data: patientProfile } = await supabaseAdmin
                .from('patients')
                .select('full_name')
                .eq('id', a.patient_id)
                .single();

            if (patientProfile?.full_name) {
                patientName = patientProfile.full_name;
            } else {
                // 2. Fallback to Auth
                const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(a.patient_id);
                patientName = user?.user_metadata?.full_name || 'Patient';
            }

            const { count } = await supabaseAdmin
                .from('prescriptions')
                .select('*', { count: 'exact', head: true })
                .eq('appointment_id', a.id);

            return {
                ...a,
                patient_name: patientName,
                hasPrescription: count && count > 0
            };
        }));

        return { data: enriched };
    } catch (err: any) {
        return { data: [], error: err.message };
    }
}

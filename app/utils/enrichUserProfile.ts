// PostHog User Enrichment — Churn Signals & Behavioral Properties
// Called on every authenticated page load to keep user profile current

import posthog from 'posthog-js';
import { supabase } from './supabase';

const ENRICHMENT_KEY = 'medivera_last_enrichment';
const ENRICHMENT_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Enriches the PostHog user profile with behavioral signals.
 * Debounced to run at most once every 6 hours to avoid excessive DB queries.
 */
export async function enrichUserProfile() {
    // Debounce — skip if enriched recently
    const lastRun = parseInt(localStorage.getItem(ENRICHMENT_KEY) || '0');
    if (Date.now() - lastRun < ENRICHMENT_INTERVAL) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get appointment stats
    const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status, scheduled_at, doctor_id')
        .eq('patient_id', user.id)
        .order('scheduled_at', { ascending: false });

    if (!appointments) return;

    const completed = appointments.filter(a => a.status === 'completed');
    const totalBookings = appointments.length;
    const completedCount = completed.length;
    const uniqueDoctors = new Set(appointments.map(a => a.doctor_id)).size;

    // Days since last booking
    const lastAppt = appointments[0];
    const daysSinceLastBooking = lastAppt
        ? Math.round((Date.now() - new Date(lastAppt.scheduled_at).getTime()) / (1000 * 60 * 60 * 24))
        : -1;

    // Days since signup
    const daysSinceSignup = Math.round(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if same doctor booked more than once (loyalty signal)
    const doctorCounts: Record<string, number> = {};
    appointments.forEach(a => {
        doctorCounts[a.doctor_id] = (doctorCounts[a.doctor_id] || 0) + 1;
    });
    const hasLoyalDoctor = Object.values(doctorCounts).some(c => c >= 2);

    // Determine user segment
    let segment = 'new_user';
    if (completedCount === 0 && totalBookings === 0) {
        segment = 'window_shopper';
    } else if (completedCount === 1) {
        segment = 'one_and_done';
    } else if (completedCount >= 3) {
        segment = 'power_user';
    } else if (completedCount >= 2) {
        segment = 'returning';
    }

    // Set PostHog person properties
    posthog.people.set({
        total_bookings: totalBookings,
        completed_consultations: completedCount,
        unique_doctors_seen: uniqueDoctors,
        days_since_last_booking: daysSinceLastBooking,
        days_since_signup: daysSinceSignup,
        has_loyal_doctor: hasLoyalDoctor,
        user_segment: segment,
        signup_date: user.created_at,
        last_enriched: new Date().toISOString(),
    });

    localStorage.setItem(ENRICHMENT_KEY, Date.now().toString());
}

'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

console.warn('Warning: ADMIN_KEY (SUPABASE_SECRET_KEY) is missing or empty.');

// Initialize Supabase Admin client with Secret Key
// providing access to all data (bypassing RLS)
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

// --- Auth Actions ---

export async function loginAdmin(password: string) {
    // Use the Secret Key (or a specific ADMIN_PASSWORD) as the login password
    const validPassword = process.env.ADMIN_PASSWORD || process.env.SUPABASE_SECRET_KEY;

    if (password === validPassword) {
        const cookieStore = await cookies();
        // Set HTTP-only cookie
        cookieStore.set('admin_token', 'valid_session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });
        return { success: true };
    }
    return { success: false, error: 'Invalid password' };
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
    return { success: true };
}

export async function verifyAdminSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    return token?.value === 'valid_session';
}

// --- Protected Data Actions ---

export async function getAdminStats() {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        // 1. Count Patients
        const { count: patientCount, error: patientError } = await supabaseAdmin
            .from('patients')
            .select('*', { count: 'exact', head: true });

        if (patientError) throw patientError;

        // 2. Count Doctors (Verified vs Pending)
        const { data: doctors, error: doctorError } = await supabaseAdmin
            .from('doctors')
            .select('is_verified');

        if (doctorError) throw doctorError;

        const docCount = doctors?.length || 0;
        const verifiedDocCount = doctors?.filter(d => d.is_verified).length || 0;

        // 3. Count Appointments (& Estimate Revenue)
        const { data: appointments, error: apptError } = await supabaseAdmin
            .from('appointments')
            .select('id, status, created_at');

        if (apptError) throw apptError;

        const apptCount = appointments?.length || 0;
        const finishedAppts = appointments?.filter(a => a.status === 'completed').length || 0;

        // Hardcoded estimation: $30 per completed appointment
        const totalRevenue = finishedAppts * 30;

        return {
            totalPatients: patientCount || 0,
            totalDoctors: docCount,
            verifiedDoctors: verifiedDocCount,
            totalAppointments: apptCount,
            totalRevenue: totalRevenue,
            error: null
        };
    } catch (error: any) {
        console.error('Admin Stats Error:', error);
        return {
            totalPatients: 0,
            totalDoctors: 0,
            verifiedDoctors: 0,
            totalAppointments: 0,
            totalRevenue: 0,
            error: error.message
        };
    }
}

export async function getAllDoctors() {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        const { data, error } = await supabaseAdmin
            .from('doctors')
            .select('*')
            .order('display_name', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

export async function updateDoctorVerification(doctorId: string, isVerified: boolean) {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        const { error } = await supabaseAdmin
            .from('doctors')
            .update({ is_verified: isVerified })
            .eq('id', doctorId);

        if (error) throw error;
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateDoctorFee(doctorId: string, fee: number) {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        const { error } = await supabaseAdmin
            .from('doctors')
            .update({ consultation_fee: fee })
            .eq('id', doctorId);

        if (error) throw error;
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Review Actions ---

export async function getAllReviews() {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        // 1. Fetch pending reviews with doctors joined (doctors table is public and has foreign key)
        const { data: reviews, error } = await supabaseAdmin
            .from('reviews')
            .select(`
                *,
                doctors:doctor_id (display_name)
            `)
            .eq('is_approved', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Manual Join for Patients (since they are in auth.users or potentially unlinked public table)
        // We'll try to fetch from 'patients' table if it exists, otherwise just show ID

        const patientIds = Array.from(new Set((reviews || []).map((r: any) => r.patient_id)));

        let patientsMap: Record<string, any> = {};

        if (patientIds.length > 0) {
            const { data: patientsData } = await supabaseAdmin
                .from('patients')
                .select('id, email, full_name') // Assuming these fields exist
                .in('id', patientIds);

            (patientsData || []).forEach((p: any) => {
                patientsMap[p.id] = p;
            });
        }

        // 3. Merge data
        const enrichedReviews = (reviews || []).map((r: any) => ({
            ...r,
            patients: patientsMap[r.patient_id] || { email: 'Unknown (ID: ' + r.patient_id.substring(0, 6) + '...)' }
        }));

        return { data: enrichedReviews, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

export async function moderateReview(reviewId: string, approve: boolean) {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        if (approve) {
            const { error } = await supabaseAdmin
                .from('reviews')
                .update({ is_approved: true })
                .eq('id', reviewId);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('reviews')
                .delete()
                .eq('id', reviewId);
            if (error) throw error;
        }

        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Create Doctor Action ---

export async function createDoctor(doctorData: any) {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        // 1. Create Auth User
        const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: doctorData.email,
            password: doctorData.password,
            email_confirm: true,
            user_metadata: { role: 'doctor', full_name: doctorData.display_name }
        });

        if (authError) throw authError;

        if (!userData.user) throw new Error('Failed to create user');

        // 2. Create Public Profile in 'doctors' table
        const { error: dbError } = await supabaseAdmin
            .from('doctors')
            .insert({
                id: userData.user.id,
                display_name: doctorData.display_name,
                specialization: doctorData.specialization,
                consultation_fee: doctorData.consultation_fee,
                consultation_fee_usd: doctorData.consultation_fee_usd || null,
                experience_years: doctorData.experience_years,

                // New Fields
                about_me: doctorData.about_me || '',
                education: doctorData.education || '',
                languages_spoken: doctorData.languages_spoken || [],
                registration_number: doctorData.registration_number || '',
                profile_photo_url: doctorData.profile_photo_url || null,

                is_verified: true, // Auto-verify since admin created
                availability_schedule: {} // Default empty schedule
            });

        if (dbError) {
            // Ideally rollback auth user creation here if DB fails
            await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
            throw dbError;
        }

        revalidateTag('doctor-specializations');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateDoctorProfile(doctorId: string, updates: any) {
    try {
        if (!await verifyAdminSession()) throw new Error('Unauthorized');

        const { error } = await supabaseAdmin
            .from('doctors')
            .update({
                display_name: updates.display_name,
                specialization: updates.specialization,
                consultation_fee: updates.consultation_fee,
                consultation_fee_usd: updates.consultation_fee_usd,
                experience_years: updates.experience_years,
                about_me: updates.about_me,
                education: updates.education,
                languages_spoken: updates.languages_spoken,
                registration_number: updates.registration_number,
                profile_photo_url: updates.profile_photo_url
            })
            .eq('id', doctorId);

        if (error) throw error;

        revalidateTag('doctor-specializations');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

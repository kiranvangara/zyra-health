
import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone } from 'date-fns-tz';

const SUPABASE_URL = 'https://isforydcyxhppjyxdlpi.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_pKbw29-qcfm3e7bpRJPrSg_z3ZcYzt1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("--- Debugging Appointments ---");

    // 1. Fetch 5 Recent Appointments
    const { data: appts, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching appointments:", error);
        return;
    }

    if (!appts.length) {
        console.log("No appointments found.");
        return;
    }

    console.log(`Found ${appts.length} appointments.`);

    for (const appt of appts) {
        console.log(`\n[Appointment ID: ${appt.id}]`);
        console.log(`- Scheduled At (UTC Raw): ${appt.scheduled_at}`);
        console.log(`- Patient ID: ${appt.patient_id}`);
        console.log(`- Doctor ID: ${appt.doctor_id}`);

        // 2. Fetch Doctor Settings (Timezone)
        const { data: doc } = await supabase.from('doctors').select('time_zone').eq('id', appt.doctor_id).single();
        const timeZone = doc?.time_zone || 'UTC';
        console.log(`- Doctor Timezone: ${timeZone}`);

        // 3. Simulated Display Time
        const displayTime = formatInTimeZone(new Date(appt.scheduled_at), timeZone, 'yyyy-MM-dd h:mm a zzz');
        console.log(`- Calculated Display Time: ${displayTime}`);

        // 4. Check Patient Name (Public)
        const { data: publicProfile } = await supabase.from('patients').select('full_name').eq('id', appt.patient_id).single();
        console.log(`- Public Profile Name: ${publicProfile?.full_name || 'NULL'}`);

        // 5. Check Auth Metadata
        const { data: { user } } = await supabase.auth.admin.getUserById(appt.patient_id);
        console.log(`- Auth Metadata Name: ${user?.user_metadata?.full_name || 'NULL'}`);
        console.log(`- Auth Email: ${user?.email}`);
    }
}

main();

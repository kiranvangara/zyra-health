import { addDays, format, isBefore, set } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { supabase } from '../utils/supabase';

interface Shift {
    start: string; // "09:00"
    end: string;   // "17:00"
}

interface WeeklySchedule {
    mon?: Shift[];
    tue?: Shift[];
    wed?: Shift[];
    thu?: Shift[];
    fri?: Shift[];
    sat?: Shift[];
    sun?: Shift[];
}

export async function getDoctorSlots(doctorId: string) {
    try {
        // 1. Fetch Doctor Config & Data
        const { data: doctor, error: docError } = await supabase
            .from('doctors')
            .select('weekly_schedule, time_zone, consultation_fee')
            .eq('id', doctorId)
            .single();

        if (docError || !doctor) throw new Error('Doctor not found');

        const timeZone = doctor.time_zone || 'UTC';
        const weeklySchedule = doctor.weekly_schedule as WeeklySchedule;

        // 2. Define Time Range (Now to Now + 7 Days)
        const nowUTC = new Date();
        const endDateUTC = addDays(nowUTC, 7);

        // 3. Fetch Overrides & Appointments
        const { data: overrides } = await supabase
            .from('doctor_overrides')
            .select('*')
            .eq('doctor_id', doctorId)
            .or(`start_time.lte.${endDateUTC.toISOString()},end_time.gte.${nowUTC.toISOString()}`);

        const { data: appointments } = await supabase
            .from('appointments')
            .select('scheduled_at, status')
            .eq('doctor_id', doctorId)
            .eq('status', 'confirmed')
            .gte('scheduled_at', nowUTC.toISOString())
            .lte('scheduled_at', endDateUTC.toISOString());

        // 4. Generate Slots
        const availableSlots: string[] = [];
        const SLOT_DURATION_MINS = 30;

        // Loop through next 7 days
        for (let i = 0; i < 7; i++) {
            const currentDateUTC = addDays(nowUTC, i);

            // Convert UTC "Now" to Doctor's Local Time
            const doctorZonedDate = toZonedTime(currentDateUTC, timeZone);
            const dayOfWeek = format(doctorZonedDate, 'EEE').toLowerCase() as keyof WeeklySchedule;

            const shifts = weeklySchedule?.[dayOfWeek] || [];

            for (const shift of shifts) {
                const [startHour, startMin] = shift.start.split(':').map(Number);
                const [endHour, endMin] = shift.end.split(':').map(Number);

                // Create Start Time in Doctor's Zone
                let slotZonedTime = set(doctorZonedDate, {
                    hours: startHour,
                    minutes: startMin,
                    seconds: 0,
                    milliseconds: 0
                });

                const shiftEndZonedTime = set(doctorZonedDate, {
                    hours: endHour,
                    minutes: endMin,
                    seconds: 0,
                    milliseconds: 0
                });

                // Generate 30m slots until Shift End
                while (isBefore(slotZonedTime, shiftEndZonedTime)) {
                    // Convert back to UTC for availability checking
                    const slotUTC = fromZonedTime(slotZonedTime, timeZone);

                    // 1. Check if in Past (with 10 min buffer)
                    if (slotUTC.getTime() < Date.now() + 10 * 60 * 1000) {
                        // Increment loop
                        slotZonedTime = new Date(slotZonedTime.getTime() + SLOT_DURATION_MINS * 60000);
                        continue;
                    }

                    // 2. Check Overrides (Vacations/Blocks)
                    const isBlocked = overrides?.some(ov => {
                        const start = new Date(ov.start_time);
                        const end = new Date(ov.end_time);
                        return slotUTC >= start && slotUTC < end;
                    });

                    // 3. Check Appointments
                    const slotEndUTC = new Date(slotUTC.getTime() + SLOT_DURATION_MINS * 60000);

                    const isBooked = appointments?.some(appt => {
                        const apptStart = new Date(appt.scheduled_at);
                        const apptEnd = new Date(apptStart.getTime() + 30 * 60000);
                        return slotUTC < apptEnd && slotEndUTC > apptStart;
                    });

                    if (!isBlocked && !isBooked) {
                        availableSlots.push(slotUTC.toISOString());
                    }

                    // Next Slot
                    slotZonedTime = new Date(slotZonedTime.getTime() + SLOT_DURATION_MINS * 60000);
                }
            }
        }

        return { slots: availableSlots, error: null };

    } catch (error: any) {
        console.error('Error generating slots:', error);
        return { slots: [], error: error.message };
    }
}

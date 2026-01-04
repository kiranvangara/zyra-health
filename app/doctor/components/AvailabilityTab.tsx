'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Clock, Plus, Trash2, Save } from 'lucide-react';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function AvailabilityTab() {
    const [schedule, setSchedule] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('doctors')
            .select('weekly_schedule')
            .eq('id', user.id)
            .single();

        if (data && data.weekly_schedule) {
            setSchedule(data.weekly_schedule);
        } else {
            // Default Init
            setSchedule({
                mon: [{ start: '09:00', end: '17:00' }],
                tue: [{ start: '09:00', end: '17:00' }],
                wed: [{ start: '09:00', end: '17:00' }],
                thu: [{ start: '09:00', end: '17:00' }],
                fri: [{ start: '09:00', end: '17:00' }],
            });
        }
        setLoading(false);
    };

    const addShift = (day: string) => {
        const currentShifts = schedule[day] || [];
        setSchedule({
            ...schedule,
            [day]: [...currentShifts, { start: '09:00', end: '17:00' }]
        });
    };

    const removeShift = (day: string, index: number) => {
        const currentShifts = [...(schedule[day] || [])];
        currentShifts.splice(index, 1);
        setSchedule({ ...schedule, [day]: currentShifts });
    };

    const updateShift = (day: string, index: number, field: 'start' | 'end', value: string) => {
        const currentShifts = [...(schedule[day] || [])];
        currentShifts[index][field] = value;
        setSchedule({ ...schedule, [day]: currentShifts });
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('doctors')
            .update({
                weekly_schedule: schedule
            })
            .eq('id', user.id);

        if (!error) {
            alert('Schedule updated successfully! ✅');
        } else {
            alert('Failed to update: ' + error.message);
        }
        setSaving(false);
    };

    const handleAddTimeOff = async () => {
        const start = (document.getElementById('timeOffStart') as HTMLInputElement).value;
        const end = (document.getElementById('timeOffEnd') as HTMLInputElement).value;
        const startTime = (document.getElementById('timeOffStartTime') as HTMLInputElement).value;
        const endTime = (document.getElementById('timeOffEndTime') as HTMLInputElement).value;
        const reason = (document.getElementById('timeOffReason') as HTMLInputElement).value;

        if (!start || !end) return alert('Select dates');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startTime) {
            const [hours, minutes] = startTime.split(':');
            startDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
            startDate.setHours(0, 0, 0);
        }

        if (endTime) {
            const [hours, minutes] = endTime.split(':');
            endDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
            endDate.setHours(23, 59, 59);
        }

        const { error } = await supabase
            .from('doctor_overrides')
            .insert({
                doctor_id: user.id,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                reason: reason || 'Time Off',
                override_type: 'vacation'
            });

        if (!error) {
            alert('Time off added! Refreshing...');
            window.location.reload();
        } else {
            alert('Error: ' + error.message);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading settings...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

            {/* Time Zone Moved to Profile Settings */}
            <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#666', border: '1px solid #c7d2fe' }}>
                ℹ️ Schedules are based on your profile's timezone.
            </div>

            {/* Days Config */}
            {DAYS.map(day => {
                const shifts = schedule[day] || [];
                const isOff = shifts.length === 0;

                return (
                    <div key={day} className="card" style={{ padding: '15px', marginBottom: '15px', opacity: isOff ? 0.7 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--primary)' }}>
                                {day}
                            </div>
                            <div>
                                {isOff ? (
                                    <button
                                        onClick={() => addShift(day)}
                                        style={{ fontSize: '12px', padding: '5px 10px', background: '#eef', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Set Available
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setSchedule({ ...schedule, [day]: [] })}
                                        style={{ fontSize: '12px', padding: '5px 10px', color: '#666', background: 'none', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Mark as Off
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isOff && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {shifts.map((shift: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8f9fa', padding: '5px', borderRadius: '6px', border: '1px solid #eee' }}>
                                            <Clock size={14} color="#666" />
                                            <input
                                                type="time"
                                                value={shift.start}
                                                onChange={(e) => updateShift(day, idx, 'start', e.target.value)}
                                                style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' }}
                                            />
                                            <span style={{ color: '#999' }}>-</span>
                                            <input
                                                type="time"
                                                value={shift.end}
                                                onChange={(e) => updateShift(day, idx, 'end', e.target.value)}
                                                style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeShift(day, idx)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addShift(day)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px' }}
                                >
                                    <Plus size={14} /> Add Split Shift
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>My Time Off / Vacations 🏖️</h4>

                {/* Add Time Off Form */}
                <div className="card" style={{ padding: '15px', marginBottom: '15px', background: '#fff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Start Date</label>
                            <input type="date" className="input-box" id="timeOffStart" style={{ padding: '8px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>End Date</label>
                            <input type="date" className="input-box" id="timeOffEnd" style={{ padding: '8px' }} />
                        </div>
                    </div>

                    {/* Optional Time Range for Adhoc Off */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>From Time (Optional)</label>
                            <input type="time" className="input-box" id="timeOffStartTime" style={{ padding: '8px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>To Time (Optional)</label>
                            <input type="time" className="input-box" id="timeOffEndTime" style={{ padding: '8px' }} />
                        </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '10px', fontStyle: 'italic' }}>
                        * Leave times empty to block the entire day(s).
                    </div>

                    <input type="text" className="input-box" id="timeOffReason" placeholder="Reason (e.g. Vacation, Dentist)" style={{ padding: '8px', marginBottom: '10px' }} />

                    <button
                        className="btn secondary"
                        style={{ fontSize: '13px' }}
                        onClick={handleAddTimeOff}
                    >
                        <Plus size={14} style={{ marginRight: '5px' }} /> Add Time Off
                    </button>
                </div>

                {/* List Existing Time Offs would go here - for MVP we just allow adding */}
                <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                    * Existing time-offs are applied to your schedule automatically.
                </div>
            </div>

            <button
                className="btn primary"
                onClick={handleSave}
                disabled={saving}
                style={{ position: 'sticky', bottom: '90px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', marginTop: '20px' }}
            >
                <Save size={18} style={{ marginRight: '8px' }} />
                {saving ? 'Saving...' : 'Save Weekly Schedule'}
            </button>
        </div>
    );
}

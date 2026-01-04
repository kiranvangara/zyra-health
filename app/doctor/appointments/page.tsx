'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import { getDoctorSlots } from '../../actions/availability';
import { getDoctorAppointments, getPatientHistory } from '../../actions/appointments'; // Import Server Actions
import DoctorBottomNav from '../../components/DoctorBottomNav';
import { Calendar, Clock, Video, FileText, ChevronRight, History, Plus } from 'lucide-react';
import { addDays, format, parseISO, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

type Tab = 'upcoming' | 'history';

export default function DoctorSchedule() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('upcoming');

    // Data States
    const [scheduleDays, setScheduleDays] = useState<any[]>([]); // For Weekly View
    const [historyAppts, setHistoryAppts] = useState<any[]>([]); // For History
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'upcoming') {
            fetchUpcomingSchedule();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchUpcomingSchedule = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Doctor's Timezone preferences
        const { data: docSettings } = await supabase
            .from('doctors')
            .select('time_zone')
            .eq('id', user.id)
            .single();

        const timeZone = docSettings?.time_zone || 'UTC';
        const today = new Date();

        // 1. Fetch Confirmed Appointments via Server Action (Secure)
        const { data: enrichedAppts } = await getDoctorAppointments(user.id, timeZone);

        // 2. Fetch Available Slots (Free)
        const { slots } = await getDoctorSlots(user.id);
        const freeSlots = (slots || []).map(iso => {
            const dateZoned = toZonedTime(new Date(iso), timeZone);
            return {
                id: 'slot-' + iso,
                type: 'free',
                scheduled_at: iso,
                dateObj: dateZoned,
                displayTime: format(dateZoned, 'h:mm a')
            };
        });

        // 3. Merge & Group by Day
        const days = [];
        const todayZoned = toZonedTime(today, timeZone);

        for (let i = 0; i < 7; i++) {
            const currentDayZoned = addDays(todayZoned, i);

            // Filter appointments based on Day equality in the specific timezone
            const dayAppts = (enrichedAppts || []).filter((a: any) => {
                // dateRaw is UTC ISO. We map it to Doctor's Wall Clock Time to check "Is this today?"
                const apptZoned = toZonedTime(new Date(a.dateRaw), timeZone);
                return isSameDay(apptZoned, currentDayZoned);
            }).map((a: any) => ({
                ...a,
                dateObj: toZonedTime(new Date(a.dateRaw), timeZone) // Re-hydrate date object for sorting
            }));

            const daySlots = freeSlots.filter(s => isSameDay(s.dateObj, currentDayZoned));

            const dayItems = [...dayAppts, ...daySlots].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

            days.push({
                date: currentDayZoned,
                label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(currentDayZoned, 'EEEE'),
                fullDate: format(currentDayZoned, 'MMM d'),
                items: dayItems
            });
        }

        setScheduleDays(days);
        setLoading(false);
    };

    const fetchHistory = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await getPatientHistory(user.id);
        setHistoryAppts(data || []);
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
            {/* Header */}
            <div className="glass-header" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>My Schedule</h2>

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#eef2ff', padding: '4px', borderRadius: '12px', width: '100%' }}>
                    <div
                        onClick={() => setActiveTab('upcoming')}
                        style={{
                            flex: 1, textAlign: 'center', padding: '8px', fontSize: '13px', fontWeight: '600',
                            borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            background: activeTab === 'upcoming' ? 'white' : 'transparent',
                            color: activeTab === 'upcoming' ? 'var(--primary)' : '#666',
                            boxShadow: activeTab === 'upcoming' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        Upcoming
                    </div>
                    <div
                        onClick={() => setActiveTab('history')}
                        style={{
                            flex: 1, textAlign: 'center', padding: '8px', fontSize: '13px', fontWeight: '600',
                            borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                            background: activeTab === 'history' ? 'white' : 'transparent',
                            color: activeTab === 'history' ? 'var(--primary)' : '#666',
                            boxShadow: activeTab === 'history' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        History
                    </div>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '13px' }}>Loading...</div>
                ) : (
                    <>
                        {/* --- UPCOMING VIEW --- */}
                        {activeTab === 'upcoming' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {scheduleDays.map((day, idx) => (
                                    <div key={idx}>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{day.label}</span>
                                            <span style={{ color: '#999', fontWeight: 'normal' }}>{day.fullDate}</span>
                                        </div>

                                        {day.items.length === 0 ? (
                                            <div style={{ padding: '15px', background: 'white', borderRadius: '12px', color: '#999', fontSize: '12px', border: '1px dashed #ddd', textAlign: 'center' }}>
                                                No availability set
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '10px' }}>
                                                {day.items.map((item: any) => {
                                                    // Display Time is pre-calculated for slots, or formatted for appointments
                                                    const timeStr = item.displayTime || format(item.dateObj, 'h:mm a');

                                                    if (item.type === 'appointment') {
                                                        // BOOKED SLOT
                                                        return (
                                                            <div key={item.id} className="card"
                                                                style={{
                                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                    borderLeft: '4px solid var(--primary)', padding: '12px'
                                                                }}
                                                            >
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                                        <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'text-top' }} />
                                                                        {timeStr}
                                                                    </div>
                                                                    <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '2px' }}>{item.patient_name}</div>
                                                                </div>
                                                                <button
                                                                    className="btn primary"
                                                                    style={{ width: 'auto', padding: '8px 12px', fontSize: '12px', borderRadius: '20px' }}
                                                                    onClick={() => router.push(`/call/${item.id}`)}
                                                                >
                                                                    <Video size={14} style={{ marginRight: '5px' }} /> Join
                                                                </button>
                                                            </div>
                                                        );
                                                    } else {
                                                        // FREE SLOT
                                                        return (
                                                            <div key={item.id}
                                                                style={{
                                                                    padding: '10px 15px', background: 'white', borderRadius: '8px',
                                                                    border: '1px solid #e0e7ff', color: '#666', fontSize: '13px',
                                                                    display: 'flex', alignItems: 'center', gap: '10px'
                                                                }}
                                                            >
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></div>
                                                                <div style={{ fontWeight: '500' }}>{timeStr}</div>
                                                                <div style={{ color: '#999', fontSize: '11px', marginLeft: 'auto' }}>Available</div>
                                                            </div>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- HISTORY VIEW --- */}
                        {activeTab === 'history' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {historyAppts.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>No past appointments found.</div>
                                ) : historyAppts.map(appt => (
                                    <div key={appt.id} className="card" style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{appt.patient_name}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {format(new Date(appt.scheduled_at), 'MMM d, yyyy • h:mm a')}
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '11px', padding: '2px 8px', borderRadius: '10px', height: 'fit-content',
                                                background: appt.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                                                color: appt.status === 'completed' ? '#166534' : '#666'
                                            }}>
                                                {appt.status}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', gap: '10px' }}>
                                            {appt.hasPrescription ? (
                                                <button
                                                    style={{
                                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                                        padding: '8px', borderRadius: '6px', border: '1px solid var(--primary)',
                                                        color: 'var(--primary)', background: '#eef2ff', fontSize: '12px', cursor: 'pointer'
                                                    }}
                                                    onClick={() => router.push(`/doctor/rx-writer/${appt.id}`)} // Re-using writer for viewing/editing for now
                                                >
                                                    <FileText size={14} /> View Rx
                                                </button>
                                            ) : (
                                                <button
                                                    style={{
                                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                                        padding: '8px', borderRadius: '6px', border: '1px solid #ddd',
                                                        color: '#666', background: 'white', fontSize: '12px', cursor: 'pointer'
                                                    }}
                                                    onClick={() => router.push(`/doctor/rx-writer/${appt.id}`)}
                                                >
                                                    <Plus size={14} /> Write Rx
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <DoctorBottomNav />
        </div>
    );
}

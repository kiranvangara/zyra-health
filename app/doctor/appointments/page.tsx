'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import DoctorBottomNav from '../../components/DoctorBottomNav';
import { Calendar, Clock, Video } from 'lucide-react';

export default function DoctorSchedule() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all confirmed appointments
        const { data: appts } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', user.id)
            .eq('status', 'confirmed')
            .order('scheduled_at', { ascending: true });

        if (appts) {
            // Enrich with patient names
            const enriched = await Promise.all(appts.map(async (a) => {
                const { data: userData } = await supabase.auth.admin.getUserById(a.patient_id);
                return {
                    ...a,
                    patient_name: userData?.user?.user_metadata?.full_name || 'Patient'
                };
            }));
            setAppointments(enriched);
        }
        setLoading(false);
    };

    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return {
            date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
            {/* Header */}
            <div className="glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600' }}>My Schedule</h2>
            </div>

            <div style={{ padding: '20px' }}>
                {loading ? (
                    <div>Loading...</div>
                ) : appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
                        <Calendar size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>No upcoming appointments</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {appointments.map(appt => {
                            const { date, time } = formatDateTime(appt.scheduled_at);
                            return (
                                <div key={appt.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{
                                            background: '#e0f2fe', color: '#0284c7',
                                            padding: '10px', borderRadius: '12px', textAlign: 'center', minWidth: '60px'
                                        }}>
                                            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{date.split(',')[0]}</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{date.split(' ')[2]}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '15px' }}>{appt.patient_name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                                <Clock size={12} /> {time}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="btn primary"
                                        style={{ width: 'auto', padding: '8px', borderRadius: '50%' }}
                                        onClick={() => router.push(`/call/${appt.id}`)}
                                    >
                                        <Video size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DoctorBottomNav />
        </div>
    );
}

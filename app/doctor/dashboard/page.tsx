'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { formatPrice } from '../../../utils/formatPrice';
import { Users, DollarSign, Clock } from 'lucide-react';
import DoctorBottomNav from '../../components/DoctorBottomNav';

interface Appointment {
    id: string;
    scheduled_at: string;
    status: string;
    meeting_link: string;
    patient: {
        name: string;
    };
}

export default function DoctorDashboard() {
    const router = useRouter();
    const [doctor, setDoctor] = useState<any>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState({ patients: 0, earnings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/doctor/login');
            return;
        }

        // Fetch doctor profile
        const { data: doctorData } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', user.id)
            .single();

        setDoctor({
            name: user.user_metadata?.full_name || 'Dr. Anonymous',
            ...doctorData
        });

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { data: appts } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', user.id)
            .gte('scheduled_at', `${today}T00:00:00`)
            .lte('scheduled_at', `${today}T23:59:59`)
            .order('scheduled_at', { ascending: true });

        if (appts) {
            // Fetch patient names
            const appointmentsWithPatients = await Promise.all(
                appts.map(async (appt) => {
                    const { data: userData } = await supabase.auth.admin.getUserById(appt.patient_id);
                    return {
                        ...appt,
                        patient: {
                            name: userData?.user?.user_metadata?.full_name || 'Patient'
                        }
                    };
                })
            );

            setAppointments(appointmentsWithPatients);

            // Calculate stats
            const { data: allAppts } = await supabase
                .from('appointments')
                .select('*')
                .eq('doctor_id', user.id)
                .eq('status', 'completed');

            const uniquePatients = new Set(allAppts?.map(a => a.patient_id) || []);
            const totalEarnings = (allAppts?.length || 0) * (doctorData?.consultation_fee || 0);

            setStats({
                patients: uniquePatients.size,
                earnings: totalEarnings
            });
        }

        setLoading(false);
    };

    const getAppointmentStatus = (appt: Appointment) => {
        const now = new Date();
        const apptTime = new Date(appt.scheduled_at);
        const diff = apptTime.getTime() - now.getTime();
        const minutesDiff = diff / (1000 * 60);

        if (appt.status === 'completed') return 'completed';
        if (minutesDiff < -30) return 'missed';
        if (minutesDiff < 15 && minutesDiff > -15) return 'active';
        return 'upcoming';
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const completedAppts = appointments.filter(a => getAppointmentStatus(a) === 'completed');
    const activeAppts = appointments.filter(a => getAppointmentStatus(a) === 'active');
    const upcomingAppts = appointments.filter(a => getAppointmentStatus(a) === 'upcoming');

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ padding: '20px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{doctor?.name} 👨‍⚕️</h2>
                    <div style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>● Online</div>
                </div>
                <div style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => router.push('/doctor/settings')}>⚙️</div>
            </div>

            <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>TODAY'S APPOINTMENTS</div>

                {/* Stats Grid */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '15px' }}>
                        <div style={{ margin: '0 auto', width: '40px', height: '40px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                            <Users size={20} />
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>{stats.patients}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Patients</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '15px' }}>
                        <div style={{ margin: '0 auto', width: '40px', height: '40px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                            <DollarSign size={20} />
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatPrice(stats.earnings)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>Earnings</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card"
                    onClick={() => router.push('/doctor/settings?tab=availability')}
                    style={{
                        padding: '16px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        cursor: 'pointer',
                        border: '1px solid #e0e7ff',
                        background: '#f5f7ff'
                    }}
                >
                    <div style={{ background: '#fff', padding: '8px', borderRadius: '50%', color: 'var(--primary)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>Manage Availability</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Set weekly schedule & time off</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#999', fontSize: '18px' }}>›</div>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>TODAY'S APPOINTMENTS</div>

                {appointments.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📅</div>
                        <div>No appointments today</div>
                    </div>
                ) : (
                    <>
                        {/* Completed */}
                        {completedAppts.map(appt => (
                            <div key={appt.id} className="card" style={{ opacity: 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{appt.patient.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Consultation • {formatTime(appt.scheduled_at)}</div>
                                </div>
                                <div style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#666' }}>Done</div>
                            </div>
                        ))}

                        {/* Active */}
                        {activeAppts.map(appt => (
                            <div key={appt.id} className="card" style={{ borderLeft: '5px solid #28a745', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{appt.patient.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Consultation • {formatTime(appt.scheduled_at)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn primary"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', margin: 0, background: '#28a745' }}
                                        onClick={() => router.push(`/call/${appt.id}`)}
                                    >
                                        Join Call
                                    </button>
                                    <button
                                        className="btn secondary"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', margin: 0 }}
                                        onClick={() => router.push(`/doctor/rx-writer?appointmentId=${appt.id}`)}
                                    >
                                        Write Rx
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Upcoming */}
                        {upcomingAppts.map(appt => (
                            <div key={appt.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{appt.patient.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Consultation • {formatTime(appt.scheduled_at)}</div>
                                </div>
                                <div style={{ fontSize: '20px', color: '#ccc' }}>📞</div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Doctor Nav */}
            <DoctorBottomNav />
        </div>
    );
}

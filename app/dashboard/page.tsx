'use client';
import posthog from 'posthog-js';

import BottomNav from '../components/BottomNav';
import { Search, FileText, TestTube } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        // use getSession() for faster local check, getUser() triggers network call which might fail on weak connection or timeout
        // Add minimal delay to allow storage adapter to initialize if race condition exists
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[Dashboard] Session check:', session ? 'Active' : 'Missing', error);

        if (!session) {
            console.log('[Dashboard] No session, redirecting to login');
            router.push('/login');
            return;
        }

        const user = session.user;

        setUser(user);

        // Check if patient profile exists
        const { data: patientProfile } = await supabase
            .from('patients')
            .select('*')
            .eq('id', user.id)
            .single();
        // If no profile, redirect to setup
        if (!patientProfile) {
            router.push('/profile-setup');
            return;
        }

        await fetchUpcomingAppointment(user.id);
        setLoading(false);
    };

    const fetchUpcomingAppointment = async (userId: string) => {
        const now = new Date().toISOString();

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', userId)
            .gt('scheduled_at', now)
            .eq('status', 'confirmed')
            .order('scheduled_at', { ascending: true })
            .limit(1);

        if (error) {
            console.error('Error fetching appointment:', error);
            return;
        }

        if (appointments && appointments.length > 0) {
            const appt = appointments[0];

            // Fetch doctor details
            const { data: doctorData } = await supabase
                .from('doctors')
                .select('display_name, specialization, profile_photo_url')
                .eq('id', appt.doctor_id)
                .single();

            setUpcomingAppointment({
                ...appt,
                doctor: doctorData
            });
        }
    };

    const isJoinable = (scheduledAt: string) => {
        const now = new Date();
        const apptTime = new Date(scheduledAt);
        const tenMinsBefore = new Date(apptTime.getTime() - 10 * 60000);
        return now >= tenMinsBefore;
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading...</div>;
    }

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' }}>
            {/* Header */}
            <div className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Hello, {userName} 👋</h2>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#eef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '1px solid #ddd' }}>
                    {userName.charAt(0).toUpperCase()}
                </div>
            </div>

            <div style={{ padding: '20px' }}>

                {upcomingAppointment ? (
                    // Upcoming Appointment Card
                    <div>
                        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Next Appointment</h3>
                        <div className="card" style={{ borderLeft: '4px solid var(--primary)', cursor: 'pointer' }} onClick={() => router.push('/appointments')}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                <div style={{
                                    width: '50px', height: '50px',
                                    background: '#eef', borderRadius: '50px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary)', overflow: 'hidden', flexShrink: 0
                                }}>
                                    {upcomingAppointment.doctor?.profile_photo_url ? (
                                        <img src={upcomingAppointment.doctor.profile_photo_url} alt="Doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '24px' }}>👨‍⚕️</span>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{upcomingAppointment.doctor?.display_name || 'Doctor'}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{upcomingAppointment.doctor?.specialization}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Date & Time</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                                        {new Date(upcomingAppointment.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {new Date(upcomingAppointment.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                {isJoinable(upcomingAppointment.scheduled_at) ? (
                                    <button
                                        className="btn primary"
                                        style={{ width: 'auto', padding: '8px 15px', fontSize: '12px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            posthog.capture('call_joined', { appointment_id: upcomingAppointment.id });
                                            router.push(`/call/${upcomingAppointment.id}`);
                                        }}
                                    >
                                        Join Now
                                    </button>
                                ) : (
                                    <button
                                        className="btn secondary"
                                        disabled
                                        style={{ width: 'auto', padding: '8px 15px', fontSize: '12px', opacity: 0.5, cursor: 'not-allowed' }}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Available 10 mins before time"
                                    >
                                        Join Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Promo Card (Empty State)
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
                        color: 'white',
                        cursor: 'pointer'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ fontWeight: 'bold' }}>Special Offer</span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>PROMO</span>
                        </div>
                        <h3 style={{ margin: '0 0 5px 0' }}>Full Body Checkup</h3>
                        <div style={{ opacity: 0.9, fontSize: '13px' }}>Get 50% Off Today</div>
                        <div style={{ fontSize: '12px', marginTop: '15px', textDecoration: 'underline' }}>Book Now</div>
                    </div>
                )}

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '20px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }} onClick={() => router.push('/search')}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                            <Search size={24} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Find Doctor</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '20px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }} onClick={() => router.push('/records')}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                            <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Records</div>
                    </div>
                    <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '20px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }} onClick={() => alert('Lab tests coming soon!')}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                            <TestTube size={24} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Lab Tests</div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

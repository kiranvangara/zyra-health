'use client';
import posthog from 'posthog-js';

import BottomNav from '../components/BottomNav';
import {
    Search, FileText, TestTube, Bell, Stethoscope, Thermometer, Calendar, Clock, Activity, Zap, Heart, User,
    Brain, Bone, Eye, Ear, Smile, Baby, Sparkles, Wind, Apple, Droplet, CloudRain, Frown, AlertCircle, Scissors, Pill, Syringe, Microscope, HandHeart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { SPECIALIZATIONS, COMMON_SYMPTOMS } from '../constants/medical';
import { getSpecializationForSymptom } from '../../utils/symptomMappings';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);

    const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setUser(session.user);
                fetchPatientProfile(session.user.id);
                fetchUpcomingAppointment(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                router.replace('/login');
            }
            setLoading(false);
        });

        checkUser();
        fetchSpecializations();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchSpecializations = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('specialization')
                .eq('is_verified', true);

            if (error) {
                console.error('Error fetching specializations:', error);
                return;
            }

            if (data) {
                const uniqueSpecs = Array.from(new Set(data.map(d => d.specialization).filter(Boolean))).sort();
                setAvailableSpecializations(uniqueSpecs);
            }
        } catch (error) {
            console.error('Error fetching specializations:', error);
        }
    };

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            fetchPatientProfile(session.user.id);
            setLoading(false);
        }
    };

    const fetchPatientProfile = async (userId: string) => {
        const { data } = await supabase.from('patients').select('*').eq('id', userId).single();
        if (!data) router.push('/profile-setup');
        setUserData(data);
    };

    const fetchUpcomingAppointment = async (userId: string) => {
        const now = new Date().toISOString();
        const { data: appointments } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', userId)
            .gt('scheduled_at', now)
            .eq('status', 'confirmed')
            .order('scheduled_at', { ascending: true })
            .limit(1);

        if (appointments && appointments.length > 0) {
            const appt = appointments[0];
            const { data: doctorData } = await supabase
                .from('doctors')
                .select('display_name, specialization, profile_photo_url')
                .eq('id', appt.doctor_id)
                .single();

            setUpcomingAppointment({ ...appt, doctor: doctorData });
        }
    };

    const formatDateRelative = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    if (loading) return <div style={{ minHeight: '100vh', background: '#f8fafc' }}></div>;

    const userName = (user?.user_metadata?.full_name || 'User').split(' ')[0];

    // Comprehensive Icon Mapping
    const getSpecIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('dentist') || n.includes('orthodontist')) return <Smile size={24} />;
        if (n.includes('cardio')) return <Heart size={24} />;
        if (n.includes('eye') || n.includes('ophthalm')) return <Eye size={24} />;
        if (n.includes('brain') || n.includes('neuro') || n.includes('psych')) return <Brain size={24} />;
        if (n.includes('ortho') || n.includes('bone') || n.includes('spine')) return <Bone size={24} />;
        if (n.includes('derma') || n.includes('hair') || n.includes('cosmet')) return <Sparkles size={24} />;
        if (n.includes('pediat') || n.includes('baby')) return <Baby size={24} />;
        if (n.includes('ent') || n.includes('ear')) return <Ear size={24} />;
        if (n.includes('lung') || n.includes('pulmo') || n.includes('breath')) return <Wind size={24} />;
        if (n.includes('diet') || n.includes('nutri')) return <Apple size={24} />;
        if (n.includes('kidney') || n.includes('nephro')) return <Activity size={24} />;
        if (n.includes('onco') || n.includes('cancer')) return <Microscope size={24} />;
        if (n.includes('surg')) return <Scissors size={24} />;
        if (n.includes('gyno') || n.includes('obste')) return <Baby size={24} />;
        if (n.includes('general') || n.includes('physician')) return <Stethoscope size={24} />;
        return <Stethoscope size={24} />;
    };

    const getSymptomIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('fever') || n.includes('hot')) return <Thermometer size={16} />;
        if (n.includes('cough') || n.includes('cold') || n.includes('flu')) return <Wind size={16} />;
        if (n.includes('headache') || n.includes('migraine')) return <Zap size={16} />;
        if (n.includes('stomach') || n.includes('acid')) return <Frown size={16} />;
        if (n.includes('pain') || n.includes('joint')) return <Bone size={16} />;
        if (n.includes('skin') || n.includes('rash') || n.includes('acne')) return <Sparkles size={16} />;
        if (n.includes('hair')) return <Scissors size={16} />;
        if (n.includes('anxiety') || n.includes('depress')) return <CloudRain size={16} />;
        if (n.includes('diabet')) return <Droplet size={16} />;
        if (n.includes('heart')) return <Heart size={16} />;
        return <Activity size={16} />;
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '90px' }}>
            {/* Header */}
            <div className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'transparent', backdropFilter: 'none', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%', background: '#E0F2FE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden'
                    }}>
                        {userData?.profile_photo_url ? (
                            <img src={userData.profile_photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>{userName.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Hi, {userName}</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>How is your health?</div>
                    </div>
                </div>
                <div
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                    onClick={() => alert('Notifications coming soon!')}
                >
                    <Bell size={20} color="#64748B" />
                </div>
            </div>

            <div style={{ padding: '0 24px' }}>

                {/* Upcoming Appointment */}
                {upcomingAppointment && (
                    <div style={{ marginTop: '10px', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>Upcoming Appointment</h3>
                            <span
                                onClick={() => router.push('/appointments')}
                                style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                            >
                                See All
                            </span>
                        </div>

                        <div
                            className="card"
                            onClick={() => router.push(`/call/${upcomingAppointment.id}`)}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                padding: '24px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
                            }}
                        >
                            {/* Background Pattern */}
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{upcomingAppointment.doctor?.display_name}</div>
                                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px' }}>{upcomingAppointment.doctor?.specialization}</div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '8px', width: 'fit-content' }}>
                                        <Calendar size={16} color="white" />
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                                            {formatDateRelative(upcomingAppointment.scheduled_at)}, {new Date(upcomingAppointment.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%', background: 'white',
                                    overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0
                                }}>
                                    {upcomingAppointment.doctor?.profile_photo_url ? (
                                        <img src={upcomingAppointment.doctor.profile_photo_url} alt="Doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <User size={30} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Specializations Grid */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>Specializations</h3>
                        <span onClick={() => router.push('/search')} style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>View All</span>
                    </div>

                    <div style={{
                        display: availableSpecializations.length > 8 ? 'grid' : 'flex',
                        ...(availableSpecializations.length > 8 ? {
                            gridTemplateRows: 'repeat(2, 1fr)',
                            gridAutoFlow: 'column',
                            gridAutoColumns: '110px',
                            overflowX: 'auto',
                        } : {
                            flexWrap: 'wrap',
                        }),
                        gap: '12px',
                        paddingBottom: '10px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}>
                        {availableSpecializations.length > 0 ? availableSpecializations.map((spec, i) => (
                            <div
                                key={spec}
                                onClick={() => {
                                    posthog.capture('search_specialization_tapped', {
                                        specialization: spec,
                                        source: 'dashboard_tile',
                                    });
                                    router.push(`/search?specialization=${encodeURIComponent(spec)}`);
                                }}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    width: availableSpecializations.length > 8 ? '110px' : 'calc(25% - 9px)',
                                    minWidth: '80px'
                                }}
                            >
                                <div style={{
                                    width: '100%', aspectRatio: '1/1', maxWidth: '80px', borderRadius: '20px', background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: i % 2 === 0 ? 'var(--primary)' : '#10B981',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9'
                                }}>
                                    {getSpecIcon(spec)}
                                </div>
                                <div style={{
                                    fontSize: '12px', textAlign: 'center', color: '#475569',
                                    lineHeight: '1.2', fontWeight: '500',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4em'
                                }}>
                                    {spec}
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '20px', color: '#94A3B8', fontSize: '13px' }}>Loading specializations...</div>
                        )}
                    </div>
                </div>

                {/* Concerns Grid */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>Common Symptoms</h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateRows: 'repeat(2, 1fr)',
                        gridAutoFlow: 'column',
                        gridAutoColumns: '140px',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '10px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}>
                        {COMMON_SYMPTOMS.map((symptom, i) => (
                            <div
                                key={symptom}
                                onClick={() => {
                                    posthog.capture('search_symptom_tapped', {
                                        symptom,
                                        mapped_specialization: getSpecializationForSymptom(symptom.toLowerCase()) || 'unknown',
                                        source: 'dashboard_symptom',
                                    });
                                    router.push(`/search?q=${encodeURIComponent(symptom)}`);
                                }}
                                style={{
                                    background: 'white', padding: '10px', borderRadius: '12px',
                                    border: '1px solid #F1F5F9', boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                                    height: '50px'
                                }}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', background: i % 2 === 0 ? '#FEF2F2' : '#EFF6FF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: i % 2 === 0 ? '#EF4444' : '#3B82F6', flexShrink: 0
                                }}>
                                    {getSymptomIcon(symptom)}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{symptom}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <BottomNav />
        </div>
    );
}

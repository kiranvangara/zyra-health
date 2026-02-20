'use client';

import posthog from 'posthog-js';
import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Calendar, Clock, Video, User, Star, FileText, X, AlertCircle } from 'lucide-react';

interface Appointment {
    id: string;
    scheduled_at: string;
    status: string;
    meeting_link: string;
    doctor: {
        display_name: string;
        specialization: string;
        profile_photo_url?: string;
    };
    hasReviewed?: boolean;
    hasSummary?: boolean;
}

export default function Appointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedApptForReview, setSelectedApptForReview] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                reviews(id),
                prescriptions(id)
            `)
            .eq('patient_id', user.id)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            setLoading(false);
            return;
        }

        const appointmentsWithDetails = await Promise.all(
            (data || []).map(async (appt: any) => {
                const { data: doctorData } = await supabase
                    .from('doctors')
                    .select('display_name, specialization, profile_photo_url')
                    .eq('id', appt.doctor_id)
                    .single();

                return {
                    ...appt,
                    doctor: {
                        display_name: doctorData?.display_name || 'Dr. Anonymous',
                        specialization: doctorData?.specialization || 'General',
                        profile_photo_url: doctorData?.profile_photo_url
                    },
                    hasReviewed: appt.reviews && appt.reviews.length > 0,
                    hasSummary: appt.prescriptions && appt.prescriptions.length > 0
                };
            })
        );

        console.log('Appointments fetched:', appointmentsWithDetails); // DEBUG: Check photo URLs
        setAppointments(appointmentsWithDetails);
        setLoading(false);
    };

    const openReviewModal = (appt: any) => {
        setSelectedApptForReview(appt);
        setRating(5);
        setComment('');
        setReviewModalOpen(true);

        const daysSince = Math.round(
            (Date.now() - new Date(appt.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        posthog.capture('review_modal_opened', {
            doctor_id: appt.doctor_id,
            appointment_id: appt.id,
            days_since_appointment: daysSince,
        });
    };

    const submitReview = async () => {
        if (!selectedApptForReview) return;

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('reviews').insert({
            doctor_id: selectedApptForReview.doctor_id,
            patient_id: user?.id,
            appointment_id: selectedApptForReview.id,
            rating,
            comment,
            is_approved: false
        });

        if (error) {
            alert('Error submitting review: ' + error.message);
        } else {
            posthog.capture('review_submitted', {
                doctor_id: selectedApptForReview.doctor_id,
                appointment_id: selectedApptForReview.id,
                rating,
                has_comment: comment.trim().length > 0,
                comment_length: comment.trim().length,
            });
            alert('Review submitted for moderation!');
            setReviewModalOpen(false);
            // Optimistically update UI
            const newAppts = appointments.map(a =>
                a.id === selectedApptForReview.id ? { ...a, hasReviewed: true } : a
            );
            setAppointments(newAppts as Appointment[]);
        }
    };

    const formatDateRelative = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const formatDateTimeCombined = (dateString: string) => {
        const date = new Date(dateString);
        const relativeDay = formatDateRelative(dateString);
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${relativeDay}, ${time}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isUpcoming = (dateString: string) => {
        return new Date(dateString) > new Date();
    };

    const isJoinable = (scheduledAt: string) => {
        const now = new Date();
        const apptTime = new Date(scheduledAt);
        const tenMinsBefore = new Date(apptTime.getTime() - 10 * 60000);
        return now >= tenMinsBefore;
    };

    const upcomingAppointments = appointments.filter(a => isUpcoming(a.scheduled_at) && a.status !== 'cancelled');
    const pastAppointments = appointments
        .filter(a => !isUpcoming(a.scheduled_at) || a.status === 'cancelled')
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    if (loading) return <div style={{ minHeight: '100vh', background: '#F8FAFC' }}></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '90px' }}>
            {/* Glass Header */}
            <div className="glass-header" style={{ padding: '16px 24px', background: 'transparent', border: 'none' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0F172A' }}>My Appointments</h2>
            </div>

            {appointments.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', marginTop: '40px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                        color: '#94A3B8'
                    }}>
                        <Calendar size={40} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0F172A', margin: '0 0 8px 0' }}>No appointments yet</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                        Book consultation with top doctors and keep track of your health journey.
                    </p>
                    <button
                        className="btn primary"
                        style={{ padding: '14px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: '600', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.3)' }}
                        onClick={() => router.push('/search')}
                    >
                        Find a Doctor
                    </button>
                </div>
            ) : (
                <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Upcoming Section */}
                    {upcomingAppointments.length > 0 && (
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '16px', letterSpacing: '0.5px' }}>UPCOMING</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {upcomingAppointments.map((appt) => (
                                    <div
                                        key={appt.id}
                                        className="card"
                                        style={{
                                            background: 'var(--primary)', // Primary Color
                                            borderRadius: '24px', padding: '24px',
                                            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.4)',
                                            border: 'none', color: 'white',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        {/* Background Pattern */}
                                        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)',
                                                    overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)',
                                                    flexShrink: 0 // Crucial for responsive behavior
                                                }}>
                                                    {appt.doctor.profile_photo_url ? (
                                                        <img src={appt.doctor.profile_photo_url} alt="Doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                            <User size={28} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.doctor.display_name}</div>
                                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>{appt.doctor.specialization}</div>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: 'white',
                                                fontSize: '11px', fontWeight: '700', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.3)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                CONFIRMED
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                                            background: 'rgba(255,255,255,0.15)', padding: '12px 16px', borderRadius: '16px',
                                            marginBottom: '24px', position: 'relative', zIndex: 1,
                                            width: 'fit-content' // FIX: Background size limit
                                        }}>
                                            <Calendar size={18} color="white" />
                                            <span style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>
                                                {formatDateTimeCombined(appt.scheduled_at)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                                            <button
                                                onClick={() => alert('Please contact support to reschedule.')}
                                                style={{
                                                    flex: 1, padding: '14px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '14px', background: 'rgba(0,0,0,0.1)',
                                                    fontSize: '14px', fontWeight: '600', color: 'white', cursor: 'pointer'
                                                }}
                                            >
                                                Reschedule
                                            </button>

                                            {isJoinable(appt.scheduled_at) ? (
                                                <button
                                                    onClick={() => router.push(`/call/${appt.id}`)}
                                                    style={{
                                                        flex: 1, padding: '14px', background: 'white', borderRadius: '14px', border: 'none',
                                                        fontSize: '14px', fontWeight: '700', color: 'var(--primary)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    <Video size={18} /> Join Call
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    style={{
                                                        flex: 1, padding: '14px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', border: 'none',
                                                        fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                    }}
                                                >
                                                    <Video size={18} /> Join Call
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Section */}
                    {pastAppointments.length > 0 && (
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '16px', marginTop: upcomingAppointments.length ? '20px' : 0, letterSpacing: '0.5px' }}>PAST APPOINTMENTS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pastAppointments.map((appt) => (
                                    <div
                                        key={appt.id}
                                        style={{
                                            background: 'white', borderRadius: '16px', padding: '16px',
                                            border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '12px', background: '#F8FAFC',
                                                    overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0
                                                }}>
                                                    {appt.doctor.profile_photo_url ? (
                                                        <img src={appt.doctor.profile_photo_url} alt="Doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                            <User size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>{appt.doctor.display_name}</div>
                                                    <div style={{ fontSize: '13px', color: '#94A3B8' }}>{formatDateRelative(appt.scheduled_at)}</div>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '4px 8px', background: appt.status === 'cancelled' ? '#FEF2F2' : '#F1F5F9',
                                                color: appt.status === 'cancelled' ? '#EF4444' : '#64748B',
                                                fontSize: '11px', fontWeight: '700', borderRadius: '6px'
                                            }}>
                                                {appt.status === 'cancelled' ? 'CANCELLED' : 'COMPLETED'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {appt.hasSummary ? (
                                                <button
                                                    onClick={() => router.push('/records')}
                                                    style={{
                                                        flex: 1, padding: '8px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white',
                                                        fontSize: '12px', fontWeight: '600', color: 'var(--primary)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                                    }}
                                                >
                                                    <FileText size={14} /> Summary
                                                </button>
                                            ) : <div style={{ flex: 1 }}></div>}

                                            {!appt.hasReviewed && appt.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => openReviewModal(appt)}
                                                    style={{
                                                        flex: 1, padding: '8px', border: '1px solid var(--primary)', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.05)',
                                                        fontSize: '12px', fontWeight: '600', color: 'var(--primary)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                                    }}
                                                >
                                                    <Star size={14} /> Rate Doctor
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <BottomNav />
            {/* Review Modal code remains same */}
            {reviewModalOpen && selectedApptForReview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="card" style={{
                        width: '90%', maxWidth: '350px', padding: '30px',
                        borderRadius: '24px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: '#F1F5F9', marginBottom: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                        }}>
                            {selectedApptForReview.doctor.profile_photo_url ? (
                                <img src={selectedApptForReview.doctor.profile_photo_url} alt="Doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={30} color="#94A3B8" />
                            )}
                        </div>

                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                            Rate Experience
                        </h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748B', textAlign: 'center' }}>
                            How was your consultation with<br />Dr. {selectedApptForReview.doctor.display_name}?
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <div
                                    key={star}
                                    onClick={() => setRating(star)}
                                    style={{
                                        cursor: 'pointer',
                                        transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <Star
                                        size={32}
                                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                                        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                                        strokeWidth={1.5}
                                    />
                                </div>
                            ))}
                        </div>

                        <textarea
                            className="input-box"
                            placeholder="Write your review here..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            style={{ width: '100%', marginBottom: '24px', resize: 'none', background: '#F8FAFC', padding: '16px' }}
                        />

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                onClick={() => setReviewModalOpen(false)}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#F1F5F9',
                                    fontSize: '14px', fontWeight: '600', color: '#64748B', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn primary"
                                onClick={submitReview}
                                style={{ flex: 1, borderRadius: '14px', fontSize: '14px' }}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

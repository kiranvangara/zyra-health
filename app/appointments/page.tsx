'use client';

import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Calendar } from 'lucide-react';

interface Appointment {
    id: string;
    scheduled_at: string;
    status: string;
    meeting_link: string;
    doctor: {
        display_name: string;
        specialization: string;
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
                    .select('display_name, specialization')
                    .eq('id', appt.doctor_id)
                    .single();

                return {
                    ...appt,
                    doctor: {
                        display_name: doctorData?.display_name || 'Dr. Anonymous',
                        specialization: doctorData?.specialization || 'General'
                    },
                    hasReviewed: appt.reviews && appt.reviews.length > 0,
                    hasSummary: appt.prescriptions && appt.prescriptions.length > 0
                };
            })
        );

        setAppointments(appointmentsWithDetails);
        setLoading(false);
    };

    const openReviewModal = (appt: any) => {
        setSelectedApptForReview(appt);
        setRating(5);
        setComment('');
        setReviewModalOpen(true);
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
            alert('Review submitted for moderation!');
            setReviewModalOpen(false);
            // Optimistically update UI
            const newAppts = appointments.map(a =>
                a.id === selectedApptForReview.id ? { ...a, hasReviewed: true } : a
            );
            setAppointments(newAppts as Appointment[]);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

    const upcomingAppointments = appointments.filter(a => isUpcoming(a.scheduled_at));
    const pastAppointments = appointments.filter(a => !isUpcoming(a.scheduled_at));

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' }}>
            <div className="glass-header">
                <h2 style={{ margin: 0 }}>My Appointments</h2>
            </div>

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading...</div>
            ) : appointments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px', color: '#999' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <Calendar size={48} strokeWidth={1.5} />
                    </div>
                    <div>No appointments yet</div>
                    <div style={{ fontSize: '12px', marginTop: '10px' }}>Book a consultation to see it here.</div>
                    <button className="btn primary" style={{ marginTop: '20px', width: 'auto', padding: '10px 30px' }} onClick={() => router.push('/search')}>
                        Find a Doctor
                    </button>
                </div>
            ) : (
                <div style={{ padding: '20px' }}>
                    {upcomingAppointments.length > 0 && (
                        <>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#666' }}>UPCOMING</div>
                            {upcomingAppointments.map((appt) => (
                                <div key={appt.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{appt.doctor.display_name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{formatDate(appt.scheduled_at)}</div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                                        {appt.doctor.specialization} • {formatTime(appt.scheduled_at)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            className="btn secondary"
                                            style={{ fontSize: '12px', padding: '8px', flex: 1 }}
                                            onClick={() => alert('Please contact support to reschedule.')}
                                        >
                                            Reschedule
                                        </button>

                                        {isJoinable(appt.scheduled_at) ? (
                                            <button
                                                className="btn primary"
                                                style={{ fontSize: '12px', padding: '8px', flex: 1 }}
                                                onClick={() => router.push(`/call/${appt.id}`)}
                                            >
                                                Join Call
                                            </button>
                                        ) : (
                                            <button
                                                className="btn secondary"
                                                disabled
                                                style={{ fontSize: '12px', padding: '8px', flex: 1, opacity: 0.5, cursor: 'not-allowed' }}
                                                title="Available 10 mins before time"
                                            >
                                                Join Call
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {pastAppointments.length > 0 && (
                        <>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', color: '#666' }}>PAST</div>
                            {pastAppointments.map((appt) => (
                                <div key={appt.id} className="card" style={{ opacity: 0.7 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{appt.doctor.display_name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{formatDate(appt.scheduled_at)}</div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                                        {appt.doctor.specialization} • {formatTime(appt.scheduled_at)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        {appt.hasSummary ? (
                                            <button className="btn secondary" style={{ fontSize: '12px', padding: '8px', flex: 1 }} onClick={() => router.push('/records')}>View Summary</button>
                                        ) : (
                                            <div style={{ flex: 1 }}></div>
                                        )}
                                        {!appt.hasReviewed && (
                                            <button
                                                className="btn primary"
                                                style={{ fontSize: '12px', padding: '8px', flex: 1 }}
                                                onClick={() => openReviewModal(appt)}
                                            >
                                                Rate Doctor
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            <BottomNav />

            {/* Review Modal */}
            {reviewModalOpen && selectedApptForReview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '350px', padding: '20px' }}>
                        <h3 style={{ marginTop: 0 }}>Rate Dr. {selectedApptForReview.doctor.display_name}</h3>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0', fontSize: '24px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    onClick={() => setRating(star)}
                                    style={{ cursor: 'pointer', opacity: star <= rating ? 1 : 0.3 }}
                                >
                                    ⭐
                                </span>
                            ))}
                        </div>

                        <textarea
                            className="input-box"
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn secondary" onClick={() => setReviewModalOpen(false)}>Cancel</button>
                            <button className="btn primary" onClick={submitReview}>Submit Review</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

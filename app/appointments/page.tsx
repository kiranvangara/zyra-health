'use client';

import posthog from 'posthog-js';
import BottomNav from '../components/BottomNav';
import MicroSurvey from '../components/MicroSurvey';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Calendar, Clock, Video, User, Star, FileText, X, AlertCircle } from 'lucide-react';
import { REVIEW_QUESTIONS, EMOJI_SCALE, selectQuestions } from '../utils/reviewConstants';
import type { QuestionKey } from '../utils/reviewConstants';

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
    const [comment, setComment] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState<typeof REVIEW_QUESTIONS[number][]>([]);
    const [emojiScores, setEmojiScores] = useState<Record<string, number>>({});

    // Micro-survey state
    const [activeSurvey, setActiveSurvey] = useState<'worth_fee' | 'sean_ellis' | null>(null);

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

        // Determine which survey to show based on completed consultations
        const completedCount = appointmentsWithDetails.filter(
            (a: any) => a.status === 'completed'
        ).length;

        const shownSurveys = JSON.parse(localStorage.getItem('medivera_surveys_shown') || '{}');

        if (completedCount >= 2 && !shownSurveys['sean_ellis']) {
            // Show Sean Ellis after 2nd consultation
            setTimeout(() => setActiveSurvey('sean_ellis'), 2000);
        } else if (completedCount >= 1 && !shownSurveys['worth_fee']) {
            // Show "worth the fee" after 1st consultation
            setTimeout(() => setActiveSurvey('worth_fee'), 2000);
        }
    };

    const openReviewModal = async (appt: any) => {
        setSelectedApptForReview(appt);
        setComment('');
        setEmojiScores({});

        // Fetch question counts for this doctor to pick least-answered
        const { data: existingResponses } = await supabase
            .from('review_responses')
            .select('question_key, review_id!inner(doctor_id)')
            .eq('review_id.doctor_id', appt.doctor_id);

        const counts: Record<string, number> = {};
        (existingResponses || []).forEach((r: any) => {
            counts[r.question_key] = (counts[r.question_key] || 0) + 1;
        });

        const questions = selectQuestions(counts);
        setSelectedQuestions(questions);
        setReviewModalOpen(true);

        const daysSince = Math.round(
            (Date.now() - new Date(appt.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        posthog.capture('review_modal_opened', {
            doctor_id: appt.doctor_id,
            appointment_id: appt.id,
            days_since_appointment: daysSince,
            questions_shown: questions.map(q => q.key),
        });
    };

    const submitReview = async () => {
        if (!selectedApptForReview) return;

        // Require all 3 questions answered
        const answeredKeys = Object.keys(emojiScores);
        if (answeredKeys.length < selectedQuestions.length) {
            alert('Please answer all questions before submitting.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        // Compute overall rating as average of emoji scores
        const scores = Object.values(emojiScores);
        const overallRating = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        // Insert review
        const { data: review, error } = await supabase.from('reviews').insert({
            doctor_id: selectedApptForReview.doctor_id,
            patient_id: user?.id,
            appointment_id: selectedApptForReview.id,
            rating: overallRating,
            comment,
            is_approved: false
        }).select().single();

        if (error || !review) {
            alert('Error submitting review: ' + (error?.message || 'Unknown error'));
            return;
        }

        // Insert individual question responses
        const responses = selectedQuestions.map(q => ({
            review_id: review.id,
            question_key: q.key,
            score: emojiScores[q.key],
        }));

        const { error: respError } = await supabase.from('review_responses').insert(responses);
        if (respError) {
            console.error('Error inserting review responses:', respError);
        }

        posthog.capture('review_submitted', {
            doctor_id: selectedApptForReview.doctor_id,
            appointment_id: selectedApptForReview.id,
            overall_rating: overallRating,
            questions_answered: answeredKeys,
            scores: emojiScores,
            has_comment: comment.trim().length > 0,
        });

        alert('Review submitted for moderation!');
        setReviewModalOpen(false);
        const newAppts = appointments.map(a =>
            a.id === selectedApptForReview.id ? { ...a, hasReviewed: true } : a
        );
        setAppointments(newAppts as Appointment[]);
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

            {/* Micro-Surveys */}
            {activeSurvey === 'worth_fee' && (
                <MicroSurvey
                    surveyId="worth_fee"
                    question="Was your last consultation worth the fee?"
                    options={[
                        { value: 'yes', emoji: '✅', label: 'Yes, definitely' },
                        { value: 'somewhat', emoji: '😐', label: 'Somewhat' },
                        { value: 'no', emoji: '❌', label: 'Not really' },
                    ]}
                    onDismiss={() => {
                        setActiveSurvey(null);
                        const shown = JSON.parse(localStorage.getItem('medivera_surveys_shown') || '{}');
                        shown['worth_fee'] = Date.now();
                        localStorage.setItem('medivera_surveys_shown', JSON.stringify(shown));
                    }}
                />
            )}

            {activeSurvey === 'sean_ellis' && (
                <MicroSurvey
                    surveyId="sean_ellis"
                    question="How would you feel if you could no longer use Medivera?"
                    options={[
                        { value: 'very_disappointed', emoji: '😢', label: 'Very disappointed' },
                        { value: 'somewhat_disappointed', emoji: '😕', label: 'Somewhat disappointed' },
                        { value: 'not_disappointed', emoji: '😐', label: 'Not disappointed' },
                    ]}
                    onDismiss={() => {
                        setActiveSurvey(null);
                        const shown = JSON.parse(localStorage.getItem('medivera_surveys_shown') || '{}');
                        shown['sean_ellis'] = Date.now();
                        localStorage.setItem('medivera_surveys_shown', JSON.stringify(shown));
                    }}
                />
            )}

            <BottomNav />
            {reviewModalOpen && selectedApptForReview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="card" style={{
                        width: '90%', maxWidth: '380px', padding: '30px',
                        borderRadius: '24px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        maxHeight: '90vh', overflowY: 'auto'
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
                            Rate Your Experience
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748B', textAlign: 'center' }}>
                            How was your consultation with<br />Dr. {selectedApptForReview.doctor.display_name}?
                        </p>

                        {/* Emoji Questions */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                            {selectedQuestions.map((q) => (
                                <div key={q.key}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '10px' }}>
                                        {q.question}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        {EMOJI_SCALE.map((level) => (
                                            <div
                                                key={level.value}
                                                onClick={() => setEmojiScores(prev => ({ ...prev, [q.key]: level.value }))}
                                                style={{
                                                    flex: 1,
                                                    textAlign: 'center',
                                                    padding: '8px 4px',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    background: emojiScores[q.key] === level.value ? '#EEF2FF' : 'transparent',
                                                    border: emojiScores[q.key] === level.value ? '2px solid var(--primary)' : '2px solid transparent',
                                                    transition: 'all 0.15s ease',
                                                    transform: emojiScores[q.key] === level.value ? 'scale(1.1)' : 'scale(1)',
                                                }}
                                            >
                                                <div style={{ fontSize: '24px' }}>{level.emoji}</div>
                                                <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px', fontWeight: '500' }}>{level.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <textarea
                            className="input-box"
                            placeholder="Any additional comments? (optional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                            style={{ width: '100%', marginBottom: '20px', resize: 'none', background: '#F8FAFC', padding: '14px', fontSize: '13px' }}
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
                                disabled={Object.keys(emojiScores).length < selectedQuestions.length}
                                style={{
                                    flex: 1, borderRadius: '14px', fontSize: '14px',
                                    opacity: Object.keys(emojiScores).length < selectedQuestions.length ? 0.5 : 1
                                }}
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

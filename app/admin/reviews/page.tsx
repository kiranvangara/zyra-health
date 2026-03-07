'use client';

import { useEffect, useState } from 'react';
import { getAllReviews, moderateReview } from '../actions';
import { supabase } from '../../utils/supabase';
import { REVIEW_QUESTIONS, EMOJI_SCALE } from '../../utils/reviewConstants';

export default function AdminReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        const { data, error } = await getAllReviews();
        if (error) console.error(error);

        // Fetch responses for each review
        const reviewsWithResponses = await Promise.all(
            (data || []).map(async (review: any) => {
                const { data: responses } = await supabase
                    .from('review_responses')
                    .select('question_key, score')
                    .eq('review_id', review.id);
                return { ...review, responses: responses || [] };
            })
        );

        setReviews(reviewsWithResponses);
        setLoading(false);
    };

    const handleModeration = async (id: string, approve: boolean) => {
        setReviews(reviews.filter(r => r.id !== id));
        const { success, error } = await moderateReview(id, approve);
        if (!success) {
            alert('Error updating review: ' + error);
            fetchReviews();
        }
    };

    const getEmoji = (score: number) => EMOJI_SCALE.find(e => e.value === score)?.emoji || '❓';
    const getQuestionLabel = (key: string) => REVIEW_QUESTIONS.find(q => q.key === key)?.question || key;

    return (
        <div style={{ padding: '30px' }}>
            <h2>Review Moderation</h2>
            {loading ? <p>Loading...</p> : reviews.length === 0 ? <p>No pending reviews.</p> : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {reviews.map(review => (
                        <div key={review.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <b>For: {review.doctors?.display_name}</b>
                                    <br />
                                    <span style={{ fontSize: '12px', color: '#666' }}>By: {review.patients?.email || 'Patient'}</span>
                                </div>
                                <div style={{ fontSize: '14px', color: '#666' }}>Overall: {review.rating}/5</div>
                            </div>

                            {/* Dimension Scores */}
                            {review.responses.length > 0 && (
                                <div style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {review.responses.map((r: any) => (
                                        <div key={r.question_key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                            <span style={{ fontSize: '18px' }}>{getEmoji(r.score)}</span>
                                            <span style={{ color: '#555' }}>{getQuestionLabel(r.question_key)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {review.comment && (
                                <p style={{ margin: '10px 0', background: '#f9f9f9', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>
                                    &quot;{review.comment}&quot;
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn primary" onClick={() => handleModeration(review.id, true)}>Approve</button>
                                <button className="btn" style={{ background: '#fee', color: 'red' }} onClick={() => handleModeration(review.id, false)}>Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


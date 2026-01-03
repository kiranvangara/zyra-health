'use client';

import { useEffect, useState } from 'react';
import { getAllReviews, moderateReview } from '../actions';

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
        setReviews(data || []);
        setLoading(false);
    };

    const handleModeration = async (id: string, approve: boolean) => {
        // Optimistic update
        setReviews(reviews.filter(r => r.id !== id));

        const { success, error } = await moderateReview(id, approve);

        if (!success) {
            alert('Error updating review: ' + error);
            // Ideally revert state here, but for simple admin panel, refetching is safer or just alerting
            fetchReviews();
        }
    };

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
                                <div style={{ fontSize: '20px' }}>{'⭐'.repeat(review.rating)}</div>
                            </div>
                            <p style={{ margin: '15px 0', background: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
                                {review.comment}
                            </p>
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

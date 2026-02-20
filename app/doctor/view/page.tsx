'use client';

import posthog from 'posthog-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../utils/supabase';
import { ArrowLeft, User } from 'lucide-react';
import { formatPrice } from '../../../utils/formatPrice';
import { useCurrency } from '../../context/CurrencyContext';

interface DoctorProfile {
    id: string;
    display_name: string;
    specialization: string;
    experience_years: number;
    consultation_fee: number;
    consultation_fee_usd?: number;
    availability_schedule: any;
    // Extended fields
    about_me?: string;
    education?: string;
    languages_spoken?: string[];
    registration_number?: string;
    profile_photo_url?: string;
}

function DoctorProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { currency } = useCurrency();
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            fetchDoctor(id);
        } else {
            // Handle missing ID if needed, or let loading state persist/error
            setLoading(false);
        }
    }, [searchParams]);

    const fetchDoctor = async (id: string) => {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', id) // Use passed id
            .single();

        if (error || !data) {
            alert('Doctor not found');
            router.back();
            return;
        }

        setDoctor(data);
        setLoading(false);

        posthog.capture('doctor_profile_viewed', {
            doctor_id: data.id,
            doctor_name: data.display_name,
            specialization: data.specialization,
            consultation_fee: data.consultation_fee,
            experience_years: data.experience_years,
        });
    };

    const getDisplayPrice = () => {
        if (!doctor) return '';
        if (currency === 'USD') {
            const fee = doctor.consultation_fee_usd || Math.ceil(doctor.consultation_fee / 83);
            return `$${fee}`;
        }
        return formatPrice(doctor.consultation_fee);
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading...</div>;
    }

    if (!doctor) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Header */}
            <div className="glass-header">
                <div onClick={() => router.back()} style={{ fontSize: '24px', marginBottom: '15px', cursor: 'pointer', display: 'inline-block' }}>
                    <ArrowLeft size={24} />
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: '#eef', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', overflow: 'hidden', flexShrink: 0,
                        border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        {doctor.profile_photo_url ? (
                            <img src={doctor.profile_photo_url} alt={doctor.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={40} />
                        )}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>{doctor.display_name || 'Dr. Anonymous'}</h2>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>{doctor.specialization}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '3px' }}>{doctor.education}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '3px' }}>{doctor.experience_years} years experience</div>
                        {doctor.languages_spoken && doctor.languages_spoken.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', display: 'flex', gap: '5px' }}>
                                🗣️ {doctor.languages_spoken.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                {/* Stats */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>500+</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>Patients</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{doctor.experience_years}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>Years Exp</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>4.8★</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>Rating</div>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="card">
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>About Me</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                        {doctor.about_me || `Experienced ${doctor.specialization} specialist providing comprehensive care. Available for online consultations regarding ${doctor.specialization} related issues.`}
                    </p>
                    {doctor.registration_number && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#999', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                            Reg. No: {doctor.registration_number}
                        </div>
                    )}
                </div>

                {/* Fee */}
                <div style={{ marginBottom: '30px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>Consultation Fee</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {getDisplayPrice()} <span style={{ fontSize: '10px', color: '#999' }}>per session</span>
                    </div>
                </div>

                {/* Reviews List Removed per user request */}

                {/* Book Button */}
                <button
                    className="btn primary"
                    style={{ marginTop: '20px', position: 'sticky', bottom: '20px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    onClick={() => {
                        posthog.capture('doctor_book_cta_clicked', {
                            doctor_id: doctor.id,
                            doctor_name: doctor.display_name,
                            specialization: doctor.specialization,
                            consultation_fee: doctor.consultation_fee,
                        });
                        router.push(`/booking?doctorId=${doctor.id}`);
                    }}
                >
                    Book Appointment
                </button>
            </div>
        </div>
    );
}

export default function DoctorProfile() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DoctorProfileContent />
        </Suspense>
    );
}

function ReviewsList({ doctorId }: { doctorId: string }) {
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        supabase
            .from('reviews')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('is_approved', true) // Only approved reviews
            .order('created_at', { ascending: false })
            .then(({ data }) => setReviews(data || []));
    }, [doctorId]);

    if (reviews.length === 0) return <div style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>No reviews yet.</div>;

    return (
        <div style={{ display: 'grid', gap: '15px' }}>
            {reviews.map(review => (
                <div key={review.id} className="card" style={{ padding: '15px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <div style={{ color: '#f59e0b', letterSpacing: '2px' }}>{'⭐'.repeat(review.rating)}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>{new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#444', lineHeight: '1.4' }}>"{review.comment}"</p>
                </div>
            ))}
        </div>
    );
}

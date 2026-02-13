'use client';
import posthog from 'posthog-js';

import { Search as SearchIcon, User, MapPin, Star, Filter, ArrowRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../utils/supabase';
import { formatPrice } from '../../utils/formatPrice';
import { getSpecializationForSymptom } from '../../utils/symptomMappings';
import { useCurrency } from '../context/CurrencyContext';

import { getAvailableSpecializations } from '../actions/medical-data';

interface Doctor {
    id: string;
    display_name: string;
    specialization: string;
    experience_years: number;
    consultation_fee: number;
    consultation_fee_usd?: number;
    profile_photo_url?: string;
    is_verified?: boolean;
    availability?: string;
    languages_spoken?: string[];
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currency } = useCurrency();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize state from URL params
    const initialSpec = searchParams.get('specialization');
    const initialQuery = searchParams.get('q');

    const [filter, setFilter] = useState(initialSpec || 'All');
    const [searchTerm, setSearchTerm] = useState(initialQuery || '');
    const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);

    useEffect(() => {
        const loadSpecs = async () => {
            const specs = await getAvailableSpecializations();
            setAvailableSpecializations(specs);
        };
        loadSpecs();
    }, []);

    // Sync state with URL params
    useEffect(() => {
        const specParam = searchParams.get('specialization');
        const queryParam = searchParams.get('q');

        if (specParam && specParam !== filter) setFilter(specParam);
        if (queryParam && queryParam !== searchTerm) setSearchTerm(queryParam);
    }, [searchParams]);

    useEffect(() => {
        fetchDoctors();
    }, [filter]);

    useEffect(() => {
        handleSearch();
    }, [searchTerm, doctors]);

    const fetchDoctors = async () => {
        setLoading(true);

        let query = supabase
            .from('doctors')
            .select('*')
            .eq('is_verified', true);

        if (filter !== 'All') {
            query = query.eq('specialization', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching doctors:', error);
            setLoading(false);
            return;
        }

        const doctorsData = data || [];

        // Fetch valid appointments for these doctors to calculate availability
        const doctorIds = doctorsData.map(d => d.id);
        const { data: appointments } = await supabase
            .from('appointments')
            .select('doctor_id, scheduled_at')
            .in('doctor_id', doctorIds)
            .eq('status', 'confirmed')
            .gt('scheduled_at', new Date().toISOString());

        // Calculate availability for each doctor
        const doctorsWithAvailability = doctorsData.map(doc => {
            const docAppts = appointments?.filter(a => a.doctor_id === doc.id) || [];
            const availability = calculateAvailability(docAppts);
            return { ...doc, availability };
        });

        setDoctors(doctorsWithAvailability);

        if (!searchTerm) {
            setFilteredDoctors(doctorsWithAvailability);
        }
        setLoading(false);
    };

    const calculateAvailability = (appointments: any[]) => {
        // Use a wider range of slots to ensure availability is found if present
        const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
        const today = new Date();

        // Check next 3 days
        for (let i = 0; i < 3; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);

            for (const slot of slots) {
                // Check if slot is in the future
                const [hours, minutes] = slot.split(':');
                const slotTime = new Date(checkDate);
                slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                if (slotTime <= new Date()) continue; // Skip past slots

                // Check if slot is booked (Simple check for MVP)
                const isBooked = appointments.some(appt => {
                    const apptTime = new Date(appt.scheduled_at);
                    return Math.abs(apptTime.getTime() - slotTime.getTime()) < 5 * 60 * 1000;
                });

                if (!isBooked) {
                    const timeString = slotTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                    if (i === 0) return `Available Today at ${timeString}`;
                    if (i === 1) return 'Available Tomorrow';
                    return `Available ${checkDate.toLocaleDateString('en-US', { weekday: 'short' })}`;
                }
            }
        }
        return 'Fully Booked';
    };

    // Inside component
    const handleSearch = () => {
        if (!searchTerm.trim() && filter === 'All') {
            setFilteredDoctors(doctors);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();

        // Check for symptom match
        const symptomSpecialization = getSpecializationForSymptom(lowerTerm);

        const filtered = doctors.filter(doc => {
            // Backup: Ensure specialization matches filter if set (handles race conditions)
            if (filter !== 'All' && doc.specialization !== filter) return false;

            const nameMatch = doc.display_name?.toLowerCase().includes(lowerTerm);
            const specMatch = doc.specialization?.toLowerCase().includes(lowerTerm);
            const symptomMatch = symptomSpecialization && doc.specialization === symptomSpecialization;
            return nameMatch || specMatch || symptomMatch;
        });

        // Track Search Event
        if (searchTerm.trim()) {
            posthog.capture('search_performed', {
                query: searchTerm,
                result_count: filtered.length,
                filter_specialization: filter
            });
        }

        setFilteredDoctors(filtered);
    };

    const getDisplayPrice = (doc: Doctor) => {
        if (currency === 'USD') {
            // Use explicit USD fee or fallback to INR/83 approx
            const fee = doc.consultation_fee_usd || Math.ceil(doc.consultation_fee / 83);
            return `$${fee}`;
        }
        return formatPrice(doc.consultation_fee);
    };

    const specializations = ['All', ...availableSpecializations];

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '90px' }}>
            {/* Glass Header */}
            <div className="glass-header" style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700', color: '#0F172A' }}>Find a Doctor</h2>

                {/* Search Box */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '16px', pointerEvents: 'none' }}>
                        <SearchIcon size={20} color="#94A3B8" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search doctors, specializations..."
                        className="input-box"
                        style={{
                            margin: 0,
                            padding: '16px 16px 16px 48px',
                            background: '#F1F5F9',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#0F172A',
                            width: '100%',
                            boxShadow: 'none',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => e.target.style.background = 'white'}
                        onBlur={(e) => e.target.style.background = '#F1F5F9'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {specializations.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setFilter(spec)}
                            style={{
                                padding: '8px 16px',
                                background: spec === filter ? 'var(--primary)' : 'white',
                                color: spec === filter ? 'white' : '#64748B',
                                border: spec === filter ? '1px solid var(--primary)' : '1px solid #E2E8F0',
                                borderRadius: '100px',
                                fontSize: '13px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: spec === filter ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                            }}>
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="pulsing-dot" style={{ width: '40px', height: '40px', background: 'var(--primary)', margin: '0 auto 20px', opacity: 0.2 }}></div>
                        <div style={{ color: '#94A3B8', fontWeight: '500' }}>Finding best doctors...</div>
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.8 }}>
                        <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <SearchIcon size={32} color="#CBD5E1" />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>No doctors found</h3>
                        <p style={{ color: '#64748B', fontSize: '14px' }}>Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredDoctors.map(doc => (
                            <div
                                key={doc.id}
                                className="card"
                                onClick={() => router.push(`/doctor/view?id=${doc.id}`)}
                                style={{
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: 'white',
                                    boxShadow: '0 2px 8px -1px rgba(0,0,0,0.05)',
                                    borderRadius: '16px',
                                    padding: '12px', // Ultra Compact padding
                                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{
                                        width: '64px', height: '64px',
                                        background: '#F8FAFC', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#CBD5E1', overflow: 'hidden', flexShrink: 0,
                                        border: '1px solid #F1F5F9'
                                    }}>
                                        {doc.profile_photo_url ? (
                                            <img src={doc.profile_photo_url} alt={doc.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={32} />
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}> {/* Included gap for vertical spacing */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{
                                                fontSize: '16px', // Reduced from 17px
                                                fontWeight: '600',
                                                color: '#0F172A',
                                                margin: 0,
                                                lineHeight: '1.3',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {doc.display_name || 'Dr. Anonymous'}
                                            </h3>

                                            {/* Removed Rating Section as requested */}
                                        </div>

                                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--primary)' }}>
                                            {doc.specialization}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontWeight: '600', color: '#334155' }}>{doc.experience_years}+</span> Years Exp.
                                            </div>

                                            {doc.languages_spoken && doc.languages_spoken.length > 0 && (
                                                <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                                                    • {doc.languages_spoken[0]}{doc.languages_spoken.length > 1 && ` +${doc.languages_spoken.length - 1}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F8FAFC',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        {doc.availability && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '12px', fontWeight: '600',
                                                color: doc.availability.includes('Available') ? '#059669' : '#DC2626',
                                                background: doc.availability.includes('Available') ? '#ECFDF5' : '#FEF2F2',
                                                padding: '6px 10px', borderRadius: '8px'
                                            }}>
                                                {doc.availability.includes('Today') && <div className="pulsing-dot" style={{ width: '6px', height: '6px', background: '#059669' }}></div>}
                                                {doc.availability}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>FEE</div>
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>{getDisplayPrice(doc)}</div>
                                        </div>
                                        <button className="btn primary" style={{
                                            padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '600',
                                            height: 'auto', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            Book <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default function Search() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}

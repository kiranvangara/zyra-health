'use client';
import posthog from 'posthog-js';

import { Search as SearchIcon, User } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { formatPrice } from '../../utils/formatPrice';
import { getSpecializationForSymptom } from '../../utils/symptomMappings';
import { useCurrency } from '../context/CurrencyContext';

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
}

export default function Search() {
    const router = useRouter();
    const { currency } = useCurrency();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

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
        const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        const today = new Date();

        // Check next 3 days
        for (let i = 0; i < 3; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);
            const dateStr = checkDate.toISOString().split('T')[0];

            for (const slot of slots) {
                // Check if slot is in the future
                const [hours, minutes] = slot.split(':');
                const slotTime = new Date(checkDate);
                slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                if (slotTime <= new Date()) continue; // Skip past slots

                // Check if slot is booked (Note: naive check, assumes exact match on API stored time which is usually UTC or offset. 
                // For this MVP, assuming appts store standard format we can string match roughly or use standard date comparison)

                // In booking page we store as: `${selectedDate}T${selectedTime}:00+05:30`
                // Let's compare timestamps for robustness
                const isBooked = appointments.some(appt => {
                    const apptTime = new Date(appt.scheduled_at);
                    return Math.abs(apptTime.getTime() - slotTime.getTime()) < 5 * 60 * 1000; // Within 5 mins matching
                });

                if (!isBooked) {
                    if (i === 0) return 'Available Today';
                    if (i === 1) return 'Available Tomorrow';
                    return `Available ${checkDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
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

    const specializations = ['All', 'Cardiology', 'Dermatology', 'General Physician', 'Pediatrics', 'Orthopedics'];

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' }}>
            <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.8)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
                <h2 style={{ margin: '0 0 15px 0' }}>Find a Doctor</h2>
                <div style={{ position: 'relative' }}>
                    <SearchIcon size={20} color="#999" style={{ position: 'absolute', left: '15px', top: '14px' }} />
                    <input
                        type="text"
                        placeholder="Search specialist, symptoms..."
                        className="input-box"
                        style={{
                            margin: 0,
                            padding: '14px 14px 14px 45px',
                            background: '#f4f6f8',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {specializations.map(spec => (
                        <div
                            key={spec}
                            onClick={() => setFilter(spec)}
                            style={{
                                padding: '8px 16px',
                                background: spec === filter ? 'var(--primary)' : 'white',
                                color: spec === filter ? 'white' : '#333',
                                border: '1px solid #ddd',
                                borderRadius: '20px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                            }}>
                            {spec}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading doctors...</div>
                ) : filteredDoctors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No doctors found</div>
                ) : (
                    filteredDoctors.map(doc => (
                        <div key={doc.id} className="card" onClick={() => router.push(`/doctor/${doc.id}`)} style={{
                            cursor: 'pointer',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            borderRadius: '16px',
                            padding: '16px',
                            marginBottom: '12px',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '60px', height: '60px',
                                    background: '#eef', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--primary)', overflow: 'hidden', flexShrink: 0,
                                    border: '1px solid #eee'
                                }}>
                                    {doc.profile_photo_url ? (
                                        <img src={doc.profile_photo_url} alt={doc.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        color: '#1a202c',
                                        marginBottom: '2px',
                                        lineHeight: '1.3'
                                    }}>
                                        {doc.display_name || 'Dr. Anonymous'}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#718096' }}>
                                        {doc.specialization}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '1px' }}>
                                        {doc.experience_years} Years Exp.
                                    </div>

                                    {/* Availability Badge moved here */}
                                    {doc.availability && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: doc.availability.includes('Available') ? '#155724' : '#721c24',
                                            background: doc.availability.includes('Available') ? '#d4edda' : '#f8d7da',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            marginTop: '6px'
                                        }}>
                                            {doc.availability === 'Available Today' && <span className="pulsing-dot" style={{ width: '6px', height: '6px', marginRight: '4px' }}></span>}
                                            {doc.availability}
                                        </div>
                                    )}
                                </div>

                                {/* Book Button */}
                                <div>
                                    <button className="btn primary" style={{
                                        width: 'auto',
                                        padding: '8px 16px',
                                        fontSize: '12px',
                                        height: '36px',
                                        background: 'var(--primary)'
                                    }}>
                                        Book
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
}

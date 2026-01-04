'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import posthog from 'posthog-js';
import { getDoctorSlots } from '../../actions/availability';
import { formatPrice } from '../../../utils/formatPrice';
import { useCurrency } from '../../context/CurrencyContext';
import { format, parseISO } from 'date-fns';

export default function Booking() {
    const params = useParams();
    const router = useRouter();
    const { currency } = useCurrency();
    const [doctor, setDoctor] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    // Slots State
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [slotsError, setSlotsError] = useState<string | null>(null);

    // Selection State
    const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
    const [selectedSlotISO, setSelectedSlotISO] = useState(''); // Full ISO string
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);

        // Fetch doctor
        const { data } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', params.doctorId)
            .single();

        if (data) {
            setDoctor(data);
            posthog.capture('booking_view_doctor', {
                doctor_id: data.id,
                doctor_name: data.display_name,
                specialization: data.specialization
            });

            // Fetch Slots
            fetchSlots(data.id);
        }
    };

    const fetchSlots = async (doctorId: string) => {
        setSlotsLoading(true);
        const { slots, error } = await getDoctorSlots(doctorId);
        if (error) {
            setSlotsError(error);
        } else {
            setAvailableSlots(slots);
            // Auto-select first date if available
            if (slots.length > 0) {
                const firstDate = slots[0].split('T')[0];
                setSelectedDate(firstDate);
            }
        }
        setSlotsLoading(false);
    };

    // Group slots by Date: { "2024-01-20": ["10:00", "10:30"] }
    const slotsByDate = availableSlots.reduce((acc: any, isoString) => {
        const date = isoString.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(isoString);
        return acc;
    }, {});

    const availableDates = Object.keys(slotsByDate).sort();

    const getDisplayPrice = () => {
        if (!doctor) return '';
        if (currency === 'USD') {
            const fee = doctor.consultation_fee_usd || Math.ceil(doctor.consultation_fee / 83);
            return `$${fee}`;
        }
        return formatPrice(doctor.consultation_fee);
    };

    const handleBookAppointment = async () => {
        if (!selectedSlotISO) {
            alert('Please select a time slot');
            return;
        }

        setBookingLoading(true);

        try {
            posthog.capture('booking_start', {
                doctor_id: doctor.id
            });

            const { data: appointment, error: apptError } = await supabase
                .from('appointments')
                .insert({
                    patient_id: user.id,
                    doctor_id: doctor.id,
                    scheduled_at: selectedSlotISO, // Use the exact ISO from backend
                    status: 'confirmed',
                })
                .select()
                .single();

            if (apptError) {
                throw new Error(apptError.message);
            }

            posthog.capture('booking_complete', {
                appointment_id: appointment.id,
                doctor_id: doctor.id,
                amount: doctor.consultation_fee
            });

            // Create Daily.co room
            const roomResponse = await fetch('/api/create-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId: appointment.id }),
            });

            const roomData = await roomResponse.json();

            if (!roomResponse.ok) {
                console.error('Daily.co API error:', roomData);
                throw new Error(roomData.error || 'Failed to create video room');
            }

            const { url, roomName } = roomData;

            if (!url) {
                throw new Error('No video room URL returned');
            }

            // Update appointment with room details
            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    meeting_link: url,
                    room_name: roomName,
                })
                .eq('id', appointment.id);

            if (updateError) {
                throw new Error(updateError.message);
            }

            alert('Appointment booked successfully!');
            router.push('/appointments');
        } catch (error: any) {
            alert('Error creating appointment: ' + error.message);
            setBookingLoading(false);
        }
    };

    if (!doctor) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '40px' }}>
            <div className="glass-header">
                <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer', marginBottom: '10px' }}>&lt;</div>
                <h2 style={{ margin: 0 }}>Book Appointment</h2>
            </div>

            <div style={{ padding: '20px' }}>

                {/* Doctor Info */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{
                            width: '60px', height: '60px',
                            background: '#eef', borderRadius: '50px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary)', overflow: 'hidden', flexShrink: 0, fontSize: '30px'
                        }}>
                            {doctor.profile_photo_url ? (
                                <img src={doctor.profile_photo_url} alt={doctor.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                '👨‍⚕️'
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{doctor.display_name || 'Dr. Anonymous'}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{doctor.specialization}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {getDisplayPrice()}
                        </div>
                    </div>
                </div>

                {/* Slots Loading State */}
                {slotsLoading && <div className="card" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>checking availability...</div>}

                {slotsError && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {slotsError}</div>}

                {/* Slots UI */}
                {!slotsLoading && !slotsError && (
                    <>
                        {/* Date Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Select Date</label>
                            {availableDates.length === 0 ? (
                                <div style={{ padding: '15px', background: '#ffebee', borderRadius: '8px', color: '#c62828', fontSize: '13px' }}>
                                    No slots available in the next 7 days.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {availableDates.map(dateStr => {
                                        const dateObj = parseISO(dateStr);
                                        const dayName = format(dateObj, 'EEE');
                                        const dayNum = format(dateObj, 'd');
                                        const month = format(dateObj, 'MMM');
                                        const isSelected = selectedDate === dateStr;

                                        return (
                                            <div
                                                key={dateStr}
                                                onClick={() => setSelectedDate(dateStr)}
                                                style={{
                                                    minWidth: '70px',
                                                    padding: '10px',
                                                    textAlign: 'center',
                                                    background: isSelected ? 'var(--primary)' : 'white',
                                                    color: isSelected ? 'white' : '#333',
                                                    border: isSelected ? 'none' : '1px solid #ddd',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ fontSize: '11px', opacity: 0.8 }}>{dayName}</div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{dayNum}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.8 }}>{month}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Time Selection */}
                        {selectedDate && slotsByDate[selectedDate] && (
                            <div className="card">
                                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Select Time</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {slotsByDate[selectedDate].map((isoString: string) => {
                                        const timeLabel = format(parseISO(isoString), 'h:mm a');
                                        const isSelected = selectedSlotISO === isoString;

                                        return (
                                            <div
                                                key={isoString}
                                                onClick={() => setSelectedSlotISO(isoString)}
                                                style={{
                                                    padding: '12px',
                                                    textAlign: 'center',
                                                    border: isSelected ? '2px solid var(--primary)' : '1px solid #eee',
                                                    background: isSelected ? '#eef2ff' : 'white',
                                                    color: isSelected ? 'var(--primary)' : '#333',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: isSelected ? 'bold' : '500'
                                                }}
                                            >
                                                {timeLabel}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Note about payment */}
                <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px', marginBottom: '20px', marginTop: '20px', fontSize: '13px', color: '#856404' }}>
                    💡 Payment will be collected after the consultation
                </div>

                <button className="btn primary" onClick={handleBookAppointment} disabled={bookingLoading || !selectedSlotISO}>
                    {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                </button>
            </div>
        </div>
    );
}

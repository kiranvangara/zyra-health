'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import posthog from 'posthog-js';
// Imports removed
import { formatPrice } from '../../../utils/formatPrice';
import { useCurrency } from '../../context/CurrencyContext';

// Helper to check slot validity (Client-side usage in component)
const isSlotValid = (slotTime: string, selectedDate: Date) => {
    const now = new Date();
    // Create date object for the slot
    const slotDateTime = new Date(selectedDate);
    const [hours, minutes] = slotTime.split(':');
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Get time 10 mins from now
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60000);

    return slotDateTime > tenMinutesFromNow;
};

export default function Booking() {
    const params = useParams();
    const router = useRouter();
    const { currency } = useCurrency();
    const [doctor, setDoctor] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);

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
        }
    };



    const getDisplayPrice = () => {
        if (!doctor) return '';
        if (currency === 'USD') {
            const fee = doctor.consultation_fee_usd || Math.ceil(doctor.consultation_fee / 83);
            return `$${fee}`;
        }
        return formatPrice(doctor.consultation_fee);
    };

    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedTime) {
            alert('Please select date and time');
            return;
        }

        setLoading(true);

        try {
            posthog.capture('booking_start', {
                doctor_id: doctor.id
            });

            // Create appointment first to get ID
            // Force IST timezone (UTC+5:30) to avoid timezone confusion
            const scheduledAt = `${selectedDate}T${selectedTime}:00+05:30`;

            const { data: appointment, error: apptError } = await supabase
                .from('appointments')
                .insert({
                    patient_id: user.id,
                    doctor_id: doctor.id,
                    scheduled_at: scheduledAt,
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
            setLoading(false);
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

                {/* Date Selection */}
                <div className="card">
                    <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Select Date</label>
                    <input
                        type="date"
                        className="input-box"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                {/* Time Selection */}
                <div className="card">
                    <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Select Time</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(time => {
                            const isValid = selectedDate ? isSlotValid(time, new Date(selectedDate)) : true;

                            return (
                                <div
                                    key={time}
                                    onClick={() => {
                                        if (isValid) setSelectedTime(time);
                                    }}
                                    style={{
                                        padding: '10px',
                                        textAlign: 'center',
                                        border: `2px solid ${selectedTime === time ? 'var(--primary)' : '#ddd'}`,
                                        borderRadius: '8px',
                                        cursor: isValid ? 'pointer' : 'not-allowed',
                                        background: selectedTime === time ? '#eef' : (isValid ? 'white' : '#f5f5f5'),
                                        fontSize: '14px',
                                        fontWeight: selectedTime === time ? 'bold' : 'normal',
                                        opacity: isValid ? 1 : 0.5,
                                        color: isValid ? 'inherit' : '#999'
                                    }}
                                >
                                    {time}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Note about payment */}
                <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#856404' }}>
                    💡 Payment will be collected after the consultation
                </div>

                <button className="btn primary" onClick={handleBookAppointment} disabled={loading}>
                    {loading ? 'Booking...' : 'Confirm Appointment'}
                </button>
            </div>
        </div>
    );
}

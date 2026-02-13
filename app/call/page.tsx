'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../utils/supabase';

function VideoCallContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const appointmentId = searchParams.get('appointmentId');
            if (appointmentId) {
                fetchAppointment(appointmentId);
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [searchParams]);

    const fetchAppointment = async (id: string) => {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            alert('Appointment not found');
            router.back();
            return;
        }

        if (!data.meeting_link) {
            alert('Video room not created yet');
            router.back();
            return;
        }

        setAppointment(data);
        setLoading(false);
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading video call...</div>;
    }

    if (!appointment) return null;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
            {/* Header */}
            <div style={{ padding: '15px', background: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px' }}>Medivera Consultation</div>
                <button
                    onClick={() => router.push('/appointments')}
                    style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    End Call
                </button>
            </div>

            {/* Video Frame */}
            <iframe
                src={appointment.meeting_link}
                allow="camera; microphone; fullscreen; display-capture"
                style={{
                    flex: 1,
                    border: 'none',
                    width: '100%'
                }}
            />
        </div>
    );
}

export default function VideoCall() {
    return (
        <Suspense fallback={<div>Loading video call...</div>}>
            <VideoCallContent />
        </Suspense>
    );
}

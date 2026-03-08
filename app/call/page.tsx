'use client';

import posthog from 'posthog-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../utils/supabase';
import { Capacitor } from '@capacitor/core';

function VideoCallContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [callStartTime] = useState(Date.now());

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const appointmentId = searchParams.get('appointmentId');
            if (appointmentId) {
                posthog.capture('call_join_attempted', {
                    appointment_id: appointmentId,
                    platform: Capacitor.isNativePlatform() ? 'native' : 'web',
                });
                fetchAppointment(appointmentId);
            } else {
                posthog.capture('call_join_failed', {
                    error: 'no_appointment_id',
                    platform: Capacitor.isNativePlatform() ? 'native' : 'web',
                });
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
            posthog.capture('call_join_failed', {
                appointment_id: id,
                error: 'appointment_not_found',
            });
            alert('Appointment not found');
            router.back();
            return;
        }

        if (!data.meeting_link) {
            posthog.capture('call_join_failed', {
                appointment_id: id,
                error: 'no_meeting_link',
            });
            alert('Video room not created yet');
            router.back();
            return;
        }

        setAppointment(data);
        setLoading(false);

        // Track call page opened
        const minutesBefore = Math.round(
            (new Date(data.scheduled_at).getTime() - Date.now()) / 60000
        );
        posthog.capture('call_page_opened', {
            appointment_id: data.id,
            minutes_before_scheduled: minutesBefore,
            platform: Capacitor.isNativePlatform() ? 'native' : 'web',
        });
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
                    onClick={() => {
                        const durationSeconds = Math.round((Date.now() - callStartTime) / 1000);
                        posthog.capture('call_ended', {
                            appointment_id: appointment.id,
                            duration_seconds: durationSeconds,
                            is_ultra_short: durationSeconds < 120,
                            platform: Capacitor.isNativePlatform() ? 'native' : 'web',
                        });
                        router.push('/appointments');
                    }}
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

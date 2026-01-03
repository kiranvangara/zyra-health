'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../utils/supabase';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/dashboard';

            // 1. Handle PKCE Code Exchange
            if (code) {
                try {
                    await supabase.auth.exchangeCodeForSession(code);
                } catch (error) {
                    console.error('Error exchanging code for session:', error);
                }
            }

            // 2. Wait for Session to be available (handles both Code exchange result AND Implicit hash detection)
            // Give it a moment for Supabase to persist safely
            setTimeout(async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.replace(next);
                } else {
                    // Fallback: just redirect and hope dashboard checks again or user tries again
                    console.warn('No session found after callback, redirecting anyway...');
                    router.replace(next);
                }
            }, 1000);
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ width: '20px', height: '20px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ marginTop: '20px', color: '#666', fontFamily: 'system-ui' }}>Verifying...</p>
            <style jsx>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Suspense fallback={<div>Loading...</div>}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

export default function CapacitorDeepLink() {
    const router = useRouter();

    useEffect(() => {
        // Only run on client side and if Capacitor is available
        if (typeof window !== 'undefined') {
            App.addListener('appUrlOpen', async (data) => {
                const url = new URL(data.url);

                // If it's an auth redirect (contains hash with access_token)
                if (url.hash && (url.hash.includes('access_token') || url.hash.includes('refresh_token'))) {
                    // Manually propagate the hash to the window location so Supabase picks it up
                    // AND force a navigation to the callback page to handle the exchange
                    // Using window.location.href ensures a full reload which is often safer for auth state
                    window.location.href = '/auth/callback' + url.hash;
                } else if (url.pathname.includes('dashboard')) {
                    router.push('/dashboard');
                }
            });
        }

        return () => {
            App.removeAllListeners();
        };
    }, [router]);

    return null;
}

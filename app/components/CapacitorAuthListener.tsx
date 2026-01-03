'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

export default function CapacitorAuthListener() {
    const router = useRouter();

    useEffect(() => {
        // Only run if Capacitor is available
        const handleDeepLink = async (data: any) => {
            // Log the URL for debugging (remove later)
            console.log('App URL Event Fired:', data.url);

            try {
                const url = new URL(data.url);

                // Check if it's an auth callback (contains hash with tokens OR search param with code)
                const hasHashToken = url.hash && (url.hash.includes('access_token') || url.hash.includes('refresh_token'));
                const hasCode = url.searchParams.get('code');

                if (hasHashToken || hasCode) {
                    console.log('Auth tokens/code detected, navigating to callback...');

                    // Force client-side navigation to the callback page
                    // Include both search and hash to cover all bases
                    const target = '/auth/callback' + url.search + url.hash;
                    window.location.href = target;
                }
            } catch (e) {
                console.error('Error parsing deep link:', e);
            }
        };

        if (typeof window !== 'undefined' && (window as any).Capacitor) {
            App.addListener('appUrlOpen', handleDeepLink);
        }

        return () => {
            // Cleanup listener if component unmounts
            if (typeof window !== 'undefined' && (window as any).Capacitor) {
                App.removeAllListeners();
            }
        };
    }, [router]);

    return null; // This component renders nothing
}

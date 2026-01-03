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

                // Check if it's an auth callback (contains hash with tokens)
                if (url.hash && (url.hash.includes('access_token') || url.hash.includes('refresh_token'))) {
                    console.log('Auth tokens detected, navigating to callback...');

                    // Force client-side navigation to the callback page with the hash
                    // We use window.location here to ensure the hash is physically present in the URL bar
                    // so Supabase's auto-detect logic works if needed, OR the callback page parses it.
                    // Using router.push might strip the hash depending on Next.js config.
                    window.location.href = '/auth/callback' + url.hash;
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

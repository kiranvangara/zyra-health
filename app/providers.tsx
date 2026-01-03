'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode } from 'react';

if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    });
}

import dynamic from 'next/dynamic';

const CapacitorAuthListener = dynamic(() => import('./components/CapacitorAuthListener'), { ssr: false });

export function CSPostHogProvider({ children }: { children: ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            {children}
            <CapacitorAuthListener />
        </PostHogProvider>
    );
}

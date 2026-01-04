'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToSettings() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/doctor/settings?tab=profile');
    }, []);
    return null;
}

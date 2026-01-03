'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Search, User } from 'lucide-react';

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => {
        // Handle nested paths (e.g., /doctor/123 should verify Search tab?) 
        // For now strict match or startsWith for some
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path === '/appointments' && pathname.startsWith('/appointments')) return true;
        if (path === '/search' && (pathname.startsWith('/search') || pathname.startsWith('/doctor'))) return true;
        if (path === '/profile' && pathname.startsWith('/profile')) return true;

        // Fallback for new paths
        return pathname === path;
    };

    const getIconProps = (path: string) => {
        const active = isActive(path);
        return {
            size: 24,
            color: active ? '#0047AB' : '#9CA3AF', // var(--primary) or gray-400
            strokeWidth: active ? 2.5 : 2,
            style: {
                filter: active ? 'drop-shadow(0 2px 4px rgba(0,71,171,0.2))' : 'none',
                transition: 'all 0.2s ease'
            }
        };
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0 calc(12px + env(safe-area-inset-bottom)) 0', // Dynamic safe area
            zIndex: 1000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.02)'
        }}>
            <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', padding: '10px' }}>
                <Home {...getIconProps('/dashboard')} />
            </div>
            <div onClick={() => router.push('/appointments')} style={{ cursor: 'pointer', padding: '10px' }}>
                <Calendar {...getIconProps('/appointments')} />
            </div>
            <div onClick={() => router.push('/search')} style={{ cursor: 'pointer', padding: '10px' }}>
                <Search {...getIconProps('/search')} />
            </div>
            <div onClick={() => router.push('/profile')} style={{ cursor: 'pointer', padding: '10px' }}>
                <User {...getIconProps('/profile')} />
            </div>
        </div>
    );
}

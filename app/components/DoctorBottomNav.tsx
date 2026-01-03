'use client';

import { Home, Calendar, MessageSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function DoctorBottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0 calc(12px + env(safe-area-inset-bottom)) 0', // Safe Area for iPhone X+
            zIndex: 1000,
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <div
                onClick={() => router.push('/doctor/dashboard')}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                    color: isActive('/doctor/dashboard') ? 'var(--primary)' : '#94a3b8'
                }}
            >
                <Home size={24} strokeWidth={isActive('/doctor/dashboard') ? 2.5 : 2} />
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: isActive('/doctor/dashboard') ? '600' : '400' }}>Home</span>
            </div>

            <div
                onClick={() => router.push('/doctor/appointments')} // Assuming this route exists or will exist
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                    color: isActive('/doctor/appointments') ? 'var(--primary)' : '#94a3b8'
                }}
            >
                <Calendar size={24} strokeWidth={isActive('/doctor/appointments') ? 2.5 : 2} />
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: isActive('/doctor/appointments') ? '600' : '400' }}>Schedule</span>
            </div>

            <div
                onClick={() => alert('Chat coming soon!')}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                    color: isActive('/doctor/chat') ? 'var(--primary)' : '#94a3b8'
                }}
            >
                <MessageSquare size={24} strokeWidth={isActive('/doctor/chat') ? 2.5 : 2} />
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: isActive('/doctor/chat') ? '600' : '400' }}>Chat</span>
            </div>
        </div>
    );
}

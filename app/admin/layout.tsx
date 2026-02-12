'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyAdminSession, logoutAdmin } from './actions';

import { LayoutDashboard, UserCheck, Users, LogOut, Star } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Skip check for login page
        if (pathname === '/admin/login') {
            setAuthorized(true);
            return;
        }

        // Verify session via server action (checks cookie)
        verifyAdminSession().then(isValid => {
            if (!isValid) {
                router.push('/admin/login');
            } else {
                setAuthorized(true);
            }
        });
    }, [pathname]);

    const handleLogout = async () => {
        await logoutAdmin();
        router.push('/admin/login');
    };

    if (!authorized) return null;

    if (pathname === '/admin/login') return <>{children}</>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutDashboard size={24} /> Medivera Admin
                </div>

                <nav style={{ flex: 1 }}>
                    <NavItem
                        icon={<LayoutDashboard size={18} />}
                        label="Dashboard"
                        active={pathname === '/admin'}
                        onClick={() => router.push('/admin')}
                    />
                    <NavItem
                        icon={<UserCheck size={18} />}
                        label="Manage Doctors"
                        active={pathname === '/admin/doctors'}
                        onClick={() => router.push('/admin/doctors')}
                    />
                    <NavItem
                        icon={<Star size={18} />}
                        label="Reviews"
                        active={pathname === '/admin/reviews'}
                        onClick={() => router.push('/admin/reviews')}
                    />
                    <NavItem
                        icon={<Users size={18} />}
                        label="Patients"
                        active={pathname === '/admin/patients'}
                        onClick={() => alert('Coming soon')}
                        disabled
                    />
                </nav>

                <div
                    onClick={handleLogout}
                    style={{
                        padding: '12px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: 'auto',
                        borderTop: '1px solid #334155'
                    }}
                >
                    <LogOut size={18} /> Logout
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    );
}

function NavItem({ icon, label, active, onClick, disabled = false }: any) {
    return (
        <div
            onClick={!disabled ? onClick : undefined}
            style={{
                padding: '12px 15px',
                marginBottom: '5px',
                cursor: disabled ? 'default' : 'pointer',
                background: active ? 'var(--primary)' : 'transparent',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: active ? 'white' : (disabled ? '#64748b' : '#cbd5e1'),
                opacity: disabled ? 0.7 : 1,
                fontSize: '14px'
            }}
        >
            <span>{icon}</span> {label}
        </div>
    );
}

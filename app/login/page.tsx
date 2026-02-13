'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const checkUserRoleAndRedirect = async (userId: string) => {
        // Check if user is a doctor
        const { data: doctor } = await supabase
            .from('doctors')
            .select('id')
            .eq('id', userId)
            .single();

        if (doctor) {
            router.replace('/doctor/dashboard');
        } else {
            router.replace('/dashboard');
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                checkUserRoleAndRedirect(session.user.id);
            }
        };
        checkSession();
    }, [router]);

    const handleEmailLogin = async () => {
        setLoading(true);
        setError('');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            if (data.session) {
                checkUserRoleAndRedirect(data.session.user.id);
            }
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);

        let redirectTo = `${window.location.origin}/dashboard`;

        // Detect if running in Capacitor (Mobile App)
        // @ts-ignore
        if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
            redirectTo = 'com.medivera.app://dashboard';
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
                skipBrowserRedirect: false // Ensure it opens browser
            }
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <div style={{ padding: '40px', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '420px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--text-color)' }}>Welcome to Medivera</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Sign in to manage your health</p>
            </div>

            {error && <div style={{ padding: '12px', background: '#FEF2F2', color: '#991B1B', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    className="input-box"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="input-box"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div style={{ textAlign: 'right' }}>
                    <span onClick={() => router.push('/forgot-password')} style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500', cursor: 'pointer' }}>Forgot Password?</span>
                </div>

                <button className="btn primary" onClick={handleEmailLogin} disabled={loading} style={{ marginTop: '5px' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '20px 0' }}>
                    <div style={{ height: '1px', background: '#E2E8F0', flex: 1 }}></div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>OR LOGIN WITH</div>
                    <div style={{ height: '1px', background: '#E2E8F0', flex: 1 }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <button
                        className="btn"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        style={{
                            background: 'white',
                            color: '#333',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.6336 11.97 13 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4" />
                            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853" />
                            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
                            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        className="btn"
                        onClick={() => handleSocialLogin('apple')}
                        disabled={loading}
                        style={{
                            background: 'black',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.05 20.28C15.8 22.09 14.11 22.06 12.55 22.06C10.95 22.06 10.44 21.14 9.17 21.14C7.88 21.14 7.27 22.05 5.86 22.09C4.1 22.14 2 18.23 2 15.11C2 12.56 3.62 10.74 6.07 10.74C7.42 10.74 8.35 11.66 9.38 11.66C10.37 11.66 11.08 10.74 12.63 10.74C14.18 10.74 15.35 11.58 16.03 12.6C13.23 14.28 13.9 18.3 17.05 20.28ZM12.03 7.24C12.71 6.39 12.66 4.99 12.66 4.99C12.66 4.99 11.53 4.88 10.63 5.8C9.84 6.64 10.04 7.94 10.04 7.94C10.04 7.94 11.23 8.09 12.03 7.24Z" />
                        </svg>
                        Apple
                    </button>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <p style={{ fontSize: '14px', color: '#64748B' }}>
                    Don't have an account? <span onClick={() => router.push('/signup')} style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Create Account</span>
                </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#94A3B8' }}>
                <span onClick={() => router.push('/legal/privacy')} style={{ cursor: 'pointer' }}>Privacy Policy</span>
                {' • '}
                <span onClick={() => router.push('/legal/terms')} style={{ cursor: 'pointer' }}>Terms & Conditions</span>
            </div>
        </div>
    );
}

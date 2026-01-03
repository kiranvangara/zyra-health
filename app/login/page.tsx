'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailLogin = async () => {
        setLoading(true);
        setError('');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/dashboard` }
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <div style={{ padding: '40px', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ color: '#333' }}>Welcome</h2>
                <p style={{ color: '#666' }}>Sign in to manage your health</p>
            </div>

            {error && <div style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                    <span onClick={() => router.push('/forgot-password')} style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }}>Forgot Password?</span>
                </div>

                <button className="btn primary" onClick={handleEmailLogin} disabled={loading}>
                    {loading ? 'Logging in...' : 'Login with Email'}
                </button>

                <button className="btn secondary" style={{ border: '2px solid #333' }} onClick={() => router.push('/signup')}>
                    Create Account
                </button>

                <div style={{ textAlign: 'center', margin: '20px 0', color: '#aaa', fontSize: '12px' }}>OR</div>

                <button className="btn secondary" onClick={() => handleSocialLogin('google')} disabled={loading}>
                    Continue with Google
                </button>
                <button className="btn secondary" style={{ background: '#000', color: 'white' }} onClick={() => handleSocialLogin('apple')} disabled={loading}>
                    Continue with Apple
                </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '11px', color: '#999' }}>
                <span onClick={() => router.push('/legal/privacy')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
                {' • '}
                <span onClick={() => router.push('/legal/terms')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Terms & Conditions</span>
            </div>
        </div>
    );
}

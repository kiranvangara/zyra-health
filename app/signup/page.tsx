'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../utils/supabase';
import posthog from 'posthog-js';

export default function Signup() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        setLoading(true);
        setError('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });



        // Inside handleSignup
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            posthog.capture('signup_complete', { method: 'email' });
            // Check if email confirmation is required
            if (data.user && !data.session) {
                alert('Please check your email to confirm your account!');
            }
            router.push('/profile-setup');
        }
    };

    return (
        <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 0', borderBottom: '1px solid #ddd', marginBottom: '20px', position: 'relative', textAlign: 'center', fontWeight: 'bold' }}>
                <span style={{ position: 'absolute', left: 0, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => router.back()}>&lt;</span>
                Create Account
            </div>

            {error && <div style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
                <input
                    type="text"
                    placeholder="Full Name"
                    className="input-box"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email Address"
                    className="input-box"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    className="input-box"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="btn primary" style={{ marginTop: '20px' }} onClick={handleSignup} disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                <div style={{ fontSize: '11px', textAlign: 'center', color: '#777' }}>
                    By signing up, you agree to our <span onClick={() => router.push('/legal/terms')} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>Terms</span> & <span onClick={() => router.push('/legal/privacy')} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>Privacy Policy</span>.
                </div>
            </div>
        </div>
    );
}

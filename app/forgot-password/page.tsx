'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Check your email for the password reset link.');
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 0', marginBottom: '20px', position: 'relative', textAlign: 'center', fontWeight: 'bold' }}>
                <span style={{ position: 'absolute', left: 0, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </span>
                Reset Password
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
                <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                    Enter your email address and we'll send you a link to reset your password.
                </div>

                {error && <div style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

                {message && <div style={{ padding: '15px', background: '#dcfce7', color: '#16a34a', borderRadius: '8px', textAlign: 'center' }}>{message}</div>}

                <input
                    type="email"
                    placeholder="Enter your email"
                    className="input-box"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button className="btn primary" onClick={handleReset} disabled={loading || !!message}>
                    {loading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
            </div>
        </div>
    );
}

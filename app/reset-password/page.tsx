'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpdatePassword = async () => {
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        setError('');

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setError(error.message);
        } else {
            alert('Password updated successfully!');
            router.push('/dashboard');
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Set New Password</h2>

            {error && <div style={{ padding: '10px', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="password"
                    placeholder="New Password"
                    className="input-box"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="input-box"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button className="btn primary" onClick={handleUpdatePassword} disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </div>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { loginAdmin } from '../actions';

export default function AdminLogin() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const { success, error: loginError } = await loginAdmin(password);

        if (success) {
            router.push('/admin');
        } else {
            setError(loginError || 'Login failed');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
            <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '30px' }}>
                <h2 style={{ textAlign: 'center', marginTop: 0, color: 'var(--primary)' }}>Admin Login 🛡️</h2>

                {error && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Password</label>
                    <input
                        type="password"
                        className="input-box"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        placeholder="Enter admin password"
                    />
                </div>

                <button className="btn primary" onClick={handleLogin}>Login to Dashboard</button>
            </div>
        </div>
    );
}

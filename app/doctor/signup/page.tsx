'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { SPECIALIZATIONS } from '../../utils/constants';

export default function DoctorSignup() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [fee, setFee] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        setLoading(true);

        try {
            // Create auth user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            });

            if (error) throw error;

            if (!data.user) throw new Error('User creation failed');

            // Create doctor profile
            const { error: doctorError } = await supabase
                .from('doctors')
                .insert({
                    id: data.user.id,
                    display_name: fullName,
                    specialization: specialization,
                    consultation_fee: parseFloat(fee),
                    experience_years: 5,
                    is_verified: true,
                    availability_schedule: {}
                });

            if (doctorError) throw doctorError;

            alert('Doctor account created successfully! You can now login.');
            router.push('/doctor/login');
        } catch (error: any) {
            alert('Error: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Create Doctor Account</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                This is a one-time setup page. Delete this file after creating your account.
            </p>

            <input
                type="text"
                placeholder="Full Name (e.g., Dr. John Smith)"
                className="input-box"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
            />

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

            <select
                className="input-box"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
            >
                <option value="" disabled>Select Specialization</option>
                {SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                ))}
            </select>

            <input
                type="number"
                placeholder="Consultation Fee (e.g., 40)"
                className="input-box"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
            />

            <button
                className="btn primary"
                onClick={handleSignup}
                disabled={loading}
                style={{ marginTop: '20px' }}
            >
                {loading ? 'Creating Account...' : 'Create Doctor Account'}
            </button>

            <button
                className="btn secondary"
                onClick={() => router.push('/doctor/login')}
                style={{ marginTop: '10px' }}
            >
                Back to Login
            </button>
        </div>
    );
}

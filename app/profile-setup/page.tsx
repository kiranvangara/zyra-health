'use client';

import posthog from 'posthog-js';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function ProfileSetup() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [age, setAge] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [conditions, setConditions] = useState('');
    const [medications, setMedications] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);
    };

    const handleComplete = async () => {
        if (!user) return;

        setLoading(true);

        // Calculate DOB from age (approximate)
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - parseInt(age || '0');
        const dob = age ? `${birthYear}-01-01` : null;

        const { error } = await supabase
            .from('patients')
            .insert({
                id: user.id,
                dob,
                blood_group: bloodGroup || null,
                chronic_conditions: conditions ? [conditions] : [],
                allergies: []
            });

        if (error) {
            alert('Error saving profile: ' + error.message);
            setLoading(false);
        } else {
            const fieldsFilled = [age, bloodGroup, conditions, medications].filter(v => v.trim() !== '').length;
            posthog.capture('profile_setup_completed', {
                fields_filled: fieldsFilled,
                has_age: age.trim() !== '',
                has_blood_group: bloodGroup.trim() !== '',
                has_conditions: conditions.trim() !== '',
                has_medications: medications.trim() !== '',
            });
            router.push('/dashboard');
        }
    };

    const handleSkip = async () => {
        if (!user) return;

        // Create minimal profile
        await supabase
            .from('patients')
            .insert({ id: user.id });

        posthog.capture('profile_setup_skipped');
        router.push('/dashboard');
    };

    return (
        <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 0', borderBottom: '1px solid #ddd', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                Setup Profile
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Avatar placeholder */}
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eef', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    📷
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="number"
                        placeholder="Age"
                        className="input-box"
                        style={{ flex: 1 }}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Blood Group"
                        className="input-box"
                        style={{ flex: 1 }}
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                    />
                </div>

                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chronic Conditions (Optional)</label>
                <input
                    type="text"
                    placeholder="e.g. Diabetes"
                    className="input-box"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                />

                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Current Medications (Optional)</label>
                <input
                    type="text"
                    placeholder="List here..."
                    className="input-box"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                />

                <button className="btn primary" style={{ marginTop: 'auto' }} onClick={handleComplete} disabled={loading}>
                    {loading ? 'Saving...' : 'Complete Setup'}
                </button>

                {/* Skip Logic */}
                <div
                    style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={handleSkip}
                >
                    Skip for Now
                </div>
            </div>
        </div>
    );
}

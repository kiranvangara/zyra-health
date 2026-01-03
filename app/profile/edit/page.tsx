'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Check } from 'lucide-react';

export default function EditProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);

        const { data: profile } = await supabase
            .from('patients')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            setAge(profile.age ? profile.age.toString() : '');
            setGender(profile.gender || '');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);

        // Update patients table
        const { error: dbError } = await supabase
            .from('patients')
            .update({
                full_name: fullName,
                phone: phone,
                age: age ? parseInt(age) : null,
                gender: gender || null
            })
            .eq('id', user.id);

        if (dbError) {
            console.error('Error updating profile:', dbError);
            alert(`Error updating profile: ${dbError.message} (${dbError.details || 'No details'})`);
            setSaving(false);
            return;
        }

        // Update auth metadata (for consistency)
        await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        // Show success animation instead of alert
        setShowSuccess(true);

        // Auto close and go back after 1.5s
        setTimeout(() => {
            router.back();
        }, 1500);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Success Overlay */}
            {showSuccess && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        transform: 'scale(1)',
                        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: '#dcfce7',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 15px auto'
                        }}>
                            <Check size={32} color="#16a34a" strokeWidth={3} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Saved!</h3>
                    </div>
                    <style jsx>{`
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    `}</style>
                </div>
            )}

            {/* Header */}
            <div className="glass-header">
                <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowLeft size={24} />
                    <span style={{ fontSize: '18px', fontWeight: '600' }}>Edit Profile</span>
                </div>
            </div>

            <div className="page-container">
                <div className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Full Name</label>
                            <input
                                type="text"
                                className="input-box"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Age</label>
                                <input
                                    type="number"
                                    className="input-box"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="e.g. 28"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Gender</label>
                                <select
                                    className="input-box"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    style={{ background: 'white' }}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Phone Number</label>
                            <input
                                type="tel"
                                className="input-box"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Email (Read Only)</label>
                            <input
                                type="email"
                                className="input-box"
                                value={user?.email || ''}
                                disabled
                                style={{ background: '#f5f5f5', color: '#999' }}
                            />
                        </div>

                        <button className="btn primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

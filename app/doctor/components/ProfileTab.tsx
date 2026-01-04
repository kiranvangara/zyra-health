'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { User, Save, Globe, Stethoscope, Languages } from 'lucide-react';
import { SPECIALIZATIONS, LANGUAGES } from '../../constants/medical';

const TIMEZONES = [
    'Asia/Kolkata', // Default first
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Asia/Dubai',
    'Australia/Sydney',
    'Asia/Singapore'
];

export default function ProfileTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [specialization, setSpecialization] = useState('General Physician');
    const [aboutMe, setAboutMe] = useState('');
    const [timeZone, setTimeZone] = useState('Asia/Kolkata');
    const [consultationFee, setConsultationFee] = useState(0);
    const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setDisplayName(data.display_name || user.user_metadata?.full_name || '');
            setSpecialization(data.specialization || 'General Physician');
            setAboutMe(data.about_me || '');
            setTimeZone(data.time_zone || 'Asia/Kolkata');
            setConsultationFee(data.consultation_fee || 0);
            setLanguagesSpoken(data.languages_spoken || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('doctors')
            .update({
                display_name: displayName,
                specialization: specialization,
                about_me: aboutMe,
                time_zone: timeZone,
                consultation_fee: consultationFee,
                languages_spoken: languagesSpoken
            })
            .eq('id', user.id);

        if (!error) {
            // Also update Auth Metadata for name consistency
            await supabase.auth.updateUser({
                data: { full_name: displayName }
            });
            alert('Profile updated successfully! ✅');
        } else {
            alert('Error updating profile: ' + error.message);
        }
        setSaving(false);
    };

    const toggleLanguage = (lang: string) => {
        if (languagesSpoken.includes(lang)) {
            setLanguagesSpoken(languagesSpoken.filter(l => l !== lang));
        } else {
            setLanguagesSpoken([...languagesSpoken, lang]);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div style={{ width: '60px', height: '60px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                        <User size={30} />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#999' }}>PROFILE SETTINGS</div>
                        <div style={{ fontWeight: 'bold' }}>{displayName || 'Doctor Details'}</div>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Display Name</label>
                    <input
                        type="text"
                        className="input-box"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Dr. John Doe"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <Stethoscope size={14} /> Specialization
                    </label>
                    <select
                        className="input-box"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                    >
                        <option value="">Select Specialization</option>
                        {SPECIALIZATIONS.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        <Languages size={14} /> Languages Spoken
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {LANGUAGES.map(lang => {
                            const isSelected = languagesSpoken.includes(lang);
                            return (
                                <div
                                    key={lang}
                                    onClick={() => toggleLanguage(lang)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: isSelected ? 'var(--primary)' : '#f3f4f6',
                                        color: isSelected ? 'white' : '#666',
                                        border: isSelected ? '1px solid var(--primary)' : '1px solid #e5e7eb'
                                    }}
                                >
                                    {lang}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Consultation Fee (INR)</label>
                    <input
                        type="number"
                        className="input-box"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(parseInt(e.target.value) || 0)}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>About Me</label>
                    <textarea
                        className="input-box"
                        rows={4}
                        value={aboutMe}
                        onChange={(e) => setAboutMe(e.target.value)}
                        placeholder="Write a brief bio..."
                    />
                </div>
            </div>

            {/* Timezone Section */}
            <div className="card" style={{ padding: '20px', marginBottom: '20px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Globe size={18} color="var(--primary)" />
                    <label style={{ fontWeight: 'bold' }}>Time Zone Preference</label>
                </div>

                <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px', lineHeight: '1.4' }}>
                    Set your local timezone. This ensures your appointment slots update correctly to match your local time.
                </p>

                <select
                    className="input-box"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    style={{ fontWeight: 'bold' }}
                >
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
            </div>

            <button
                className="btn primary"
                onClick={handleSave}
                disabled={saving}
                style={{ position: 'sticky', bottom: '90px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            >
                <Save size={18} style={{ marginRight: '8px' }} />
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}

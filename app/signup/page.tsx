'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { supabase } from '../utils/supabase';
import posthog from 'posthog-js';

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Capture UTM params for referral attribution
    const utmSource = searchParams.get('utm_source') || '';
    const utmMedium = searchParams.get('utm_medium') || '';
    const utmCampaign = searchParams.get('utm_campaign') || '';
    const referralCode = searchParams.get('ref') || '';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);
    const [signupSource, setSignupSource] = useState('');

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
            posthog.capture('signup_complete', {
                method: 'email',
                signup_source: signupSource || 'not_specified',
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                referral_code: referralCode,
                has_referral: !!referralCode,
            });

            // Log data processing consent to audit table
            if (data.user) {
                await supabase.from('consent_logs').insert({
                    user_id: data.user.id,
                    consent_type: 'data_processing',
                    consent_given: true,
                    user_agent: navigator.userAgent,
                });
            }

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

                <select
                    className="input-box"
                    value={signupSource}
                    onChange={(e) => setSignupSource(e.target.value)}
                    style={{ color: signupSource ? '#0F172A' : '#94A3B8' }}
                >
                    <option value="" disabled>How did you hear about us?</option>
                    <option value="friend_family">Friend or Family</option>
                    <option value="social_media">Social Media</option>
                    <option value="google_search">Google Search</option>
                    <option value="doctor_referral">Doctor Referral</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="other">Other</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#555', cursor: 'pointer', marginTop: '10px' }}>
                    <input
                        type="checkbox"
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                        style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                    />
                    <span>
                        I agree to the <span onClick={(e) => { e.preventDefault(); router.push('/legal/terms'); }} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>Terms & Conditions</span> and <span onClick={(e) => { e.preventDefault(); router.push('/legal/privacy'); }} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>Privacy Policy</span>, and consent to processing of my health data as described therein.
                    </span>
                </label>

                <button className="btn primary" style={{ marginTop: '15px', opacity: consentChecked ? 1 : 0.5 }} onClick={handleSignup} disabled={loading || !consentChecked}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </div>
        </div>
    );
}

export default function Signup() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
            <SignupContent />
        </Suspense>
    );
}

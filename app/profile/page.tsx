'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { supabase } from '../utils/supabase';
import { enrichUserProfile } from '../utils/enrichUserProfile';
import posthog from 'posthog-js';

export default function Profile() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [consentWithdrawn, setConsentWithdrawn] = useState(false);
    const [consentLoading, setConsentLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch extra details from patients table
            const { data: patient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile({
                ...user,
                full_name: patient?.full_name || user.user_metadata?.full_name,
                avatar_url: user.user_metadata?.avatar_url,
                userId: user.id.slice(0, 8).toUpperCase()
            });
            setConsentWithdrawn(patient?.consent_withdrawn || false);
            setLoading(false);

            // Enrich PostHog user profile with behavioral signals
            enrichUserProfile();
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleDownloadData = async () => {
        if (!profile) return;
        setDownloading(true);
        try {
            const userId = profile.id;

            // Fetch all user data in parallel
            const [appointments, prescriptions, records, consents, patient] = await Promise.all([
                supabase.from('appointments').select('*').eq('patient_id', userId),
                supabase.from('prescriptions').select('*').eq('patient_id', userId),
                supabase.from('medical_records').select('id, file_name, file_type, title, created_at').eq('patient_id', userId),
                supabase.from('consent_logs').select('*').eq('user_id', userId),
                supabase.from('patients').select('*').eq('id', userId).single(),
            ]);

            const exportData = {
                exported_at: new Date().toISOString(),
                profile: {
                    email: profile.email,
                    full_name: profile.full_name,
                    ...(patient.data || {}),
                },
                appointments: appointments.data || [],
                prescriptions: prescriptions.data || [],
                medical_records: records.data || [],
                consent_logs: consents.data || [],
            };

            // Download as JSON
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medivera_data_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Your data has been downloaded successfully.');
        } catch (error: any) {
            alert('Error downloading data: ' + error.message);
        } finally {
            setDownloading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const userId = profile.id;

            await supabase
                .from('patients')
                .update({
                    full_name: 'Deleted User',
                    age: null,
                    blood_group: null,
                    conditions: null,
                    medications: null,
                })
                .eq('id', userId);

            await supabase.auth.signOut();
            alert('Your account data has been anonymized. Full deletion will be processed within 30 days.');
            router.push('/login');
        } catch (error: any) {
            alert('Error deleting account: ' + error.message);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleConsentToggle = async () => {
        setConsentLoading(true);
        try {
            const newState = !consentWithdrawn;

            await supabase
                .from('patients')
                .update({ consent_withdrawn: newState })
                .eq('id', profile.id);

            // Log consent action to audit table
            await supabase.from('consent_logs').insert({
                user_id: profile.id,
                consent_type: 'data_processing',
                consent_given: !newState,
                user_agent: navigator.userAgent,
                context: {
                    action: newState ? 'consent_withdrawn' : 'consent_restored',
                    timestamp: new Date().toISOString(),
                },
            });

            setConsentWithdrawn(newState);
            setShowConsentModal(false);

            if (newState) {
                alert('Your consent has been withdrawn. You will not be able to book new appointments until you re-consent.');
            } else {
                alert('Your consent has been restored. You can now book appointments.');
            }
        } catch (error: any) {
            alert('Error updating consent: ' + error.message);
        } finally {
            setConsentLoading(false);
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' }}>
            <div className="glass-header" style={{ textAlign: 'center', paddingTop: '40px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eef', margin: '0 auto 15px', border: '2px solid var(--primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', overflow: 'hidden' }}>
                    {profile?.avatar_url && !imageError ? (
                        <img
                            src={profile.avatar_url}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={() => setImageError(true)}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <span>{profile?.full_name?.[0] || 'U'}</span>
                    )}
                </div>
                <h2 style={{ margin: 0 }}>{profile?.full_name || 'Guest User'}</h2>
                <div style={{ fontSize: '13px', color: '#666' }}>ID: ZR-{profile?.userId || '0000'}</div>
            </div>

            <div style={{ marginTop: '20px', padding: '0 20px' }}>
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => router.push('/profile/edit')}>Edit Profile</div>
                <div className="card" style={{ cursor: 'pointer' }}>Medical Records</div>
                <div className="card" style={{ cursor: 'pointer' }}>Payment Methods</div>
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => router.push('/legal/privacy')}>Privacy Policy</div>
                <div className="card" style={{ cursor: 'pointer' }} onClick={() => router.push('/legal/terms')}>Terms & Conditions</div>

                {/* Refer & Share */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                    border: '1px solid #C7D2FE',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '22px' }}>🎁</span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#312E81', fontSize: '14px' }}>Share Medivera</div>
                            <div style={{ fontSize: '11px', color: '#6366F1' }}>Help others access quality healthcare</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                const refLink = `${window.location.origin}/signup?ref=${profile?.userId || ''}&utm_source=referral&utm_medium=share`;
                                navigator.clipboard.writeText(refLink);
                                posthog.capture('referral_shared', { method: 'copy_link' });
                                alert('Link copied!');
                            }}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                                background: 'white', fontSize: '12px', fontWeight: '600',
                                color: '#4F46E5', cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                        >
                            📋 Copy Link
                        </button>
                        <button
                            onClick={() => {
                                const refLink = `${window.location.origin}/signup?ref=${profile?.userId || ''}&utm_source=referral&utm_medium=whatsapp`;
                                const text = `Hey! I've been using Medivera for online doctor consultations. It's really convenient. Try it: ${refLink}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                posthog.capture('referral_shared', { method: 'whatsapp' });
                            }}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                                background: '#25D366', fontSize: '12px', fontWeight: '600',
                                color: 'white', cursor: 'pointer',
                            }}
                        >
                            💬 WhatsApp
                        </button>
                    </div>
                </div>

                {/* Data Rights */}
                <div
                    className="card"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onClick={handleDownloadData}
                >
                    <span>Download My Data</span>
                    {downloading && <span style={{ fontSize: '12px', color: '#666' }}>Exporting...</span>}
                </div>

                {/* Withdraw / Restore Consent */}
                <div
                    className="card"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: consentWithdrawn ? '3px solid #e65100' : '3px solid #2e7d32' }}
                    onClick={() => setShowConsentModal(true)}
                >
                    <div>
                        <div style={{ fontWeight: '500' }}>{consentWithdrawn ? 'Restore Consent' : 'Withdraw Consent'}</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                            {consentWithdrawn ? '⚠️ Consent withdrawn — booking disabled' : '✅ Data processing consent active'}
                        </div>
                    </div>
                </div>

                <div
                    className="card"
                    style={{ cursor: 'pointer', color: '#dc2626' }}
                    onClick={() => setShowDeleteModal(true)}
                >
                    Delete My Account
                </div>

                <div className="card" style={{ color: 'red', cursor: 'pointer' }} onClick={handleLogout}>Logout</div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '25px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Delete Account?</h3>
                        <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px', lineHeight: '1.5' }}>
                            This will anonymize your personal data. Medical records will be retained for 3 years as required by law. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#f1f5f9', color: '#333' }}
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#dc2626', color: 'white' }}
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Consent Withdrawal/Restore Modal */}
            {showConsentModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '25px', textAlign: 'center' }}>
                        {consentWithdrawn ? (
                            <>
                                <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Restore Consent?</h3>
                                <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px', lineHeight: '1.5' }}>
                                    Restoring consent will allow you to book new appointments and use all platform features again.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 style={{ margin: '0 0 10px 0', color: '#e65100' }}>Withdraw Consent?</h3>
                                <p style={{ fontSize: '14px', color: '#555', marginBottom: '15px', lineHeight: '1.5' }}>
                                    Under the DPDP Act 2023, you have the right to withdraw your data processing consent. Please note:
                                </p>
                                <ul style={{ textAlign: 'left', fontSize: '13px', color: '#555', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '15px' }}>
                                    <li>You will <strong>not be able to book</strong> new appointments</li>
                                    <li>Existing medical records will be <strong>retained for 3 years</strong> as required by law</li>
                                    <li>You can <strong>restore consent</strong> at any time from this page</li>
                                </ul>
                            </>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#f1f5f9', color: '#333' }}
                                onClick={() => setShowConsentModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1, background: consentWithdrawn ? '#2e7d32' : '#e65100', color: 'white' }}
                                onClick={handleConsentToggle}
                                disabled={consentLoading}
                            >
                                {consentLoading ? 'Processing...' : (consentWithdrawn ? 'Restore Consent' : 'Withdraw Consent')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

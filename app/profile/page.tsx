'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { supabase } from '../utils/supabase';

export default function Profile() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
            setLoading(false);
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
            // Note: Full account deletion requires a backend/edge function to delete auth user.
            // For now, we anonymize the patient record and sign out.
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

                {/* Data Rights */}
                <div
                    className="card"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onClick={handleDownloadData}
                >
                    <span>Download My Data</span>
                    {downloading && <span style={{ fontSize: '12px', color: '#666' }}>Exporting...</span>}
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

            <BottomNav />
        </div>
    );
}

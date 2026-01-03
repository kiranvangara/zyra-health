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
                <div className="card" style={{ color: 'red', cursor: 'pointer' }} onClick={handleLogout}>Logout</div>
            </div>

            <BottomNav />
        </div>
    );
}

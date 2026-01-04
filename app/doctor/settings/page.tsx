'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DoctorBottomNav from '../../components/DoctorBottomNav';
import ProfileTab from '../components/ProfileTab';
import AvailabilityTab from '../components/AvailabilityTab';

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState<'profile' | 'availability'>('profile');

    useEffect(() => {
        if (tabParam === 'availability') {
            setActiveTab('availability');
        } else {
            setActiveTab('profile');
        }
    }, [tabParam]);

    const switchTab = (tab: 'profile' | 'availability') => {
        setActiveTab(tab);
        // Shallow routing update
        router.push(`/doctor/settings?tab=${tab}`);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' }}>
            <div className="glass-header" style={{ justifyContent: 'center', flexDirection: 'column', gap: '10px', height: 'auto', padding: '15px 20px' }}>
                <h3 style={{ margin: 0 }}>Dr. Settings</h3>

                {/* Tabs */}
                <div style={{ display: 'flex', background: '#eef2ff', padding: '4px', borderRadius: '12px', width: '100%', maxWidth: '300px' }}>
                    <button
                        onClick={() => switchTab('profile')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            borderRadius: '10px',
                            background: activeTab === 'profile' ? '#fff' : 'transparent',
                            color: activeTab === 'profile' ? 'var(--primary)' : '#6b7280',
                            fontWeight: activeTab === 'profile' ? '600' : '500',
                            fontSize: '13px',
                            boxShadow: activeTab === 'profile' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => switchTab('availability')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            borderRadius: '10px',
                            background: activeTab === 'availability' ? '#fff' : 'transparent',
                            color: activeTab === 'availability' ? 'var(--primary)' : '#6b7280',
                            fontWeight: activeTab === 'availability' ? '600' : '500',
                            fontSize: '13px',
                            boxShadow: activeTab === 'availability' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Availability
                    </button>
                </div>
            </div>

            <div style={{ padding: '20px' }}>
                {activeTab === 'profile' ? (
                    <ProfileTab />
                ) : (
                    <AvailabilityTab />
                )}
            </div>

            <DoctorBottomNav />
        </div>
    );
}

export default function DoctorSettingsPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
            <SettingsContent />
        </Suspense>
    );
}

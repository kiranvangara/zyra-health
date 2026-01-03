'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Consultation() {
    const router = useRouter();
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#111', color: 'white', position: 'relative' }}>

            {/* Main Video Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>👤</div>
                <div style={{ fontSize: '18px' }}>Patient: Kiran Kumar</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>00:04:23</div>
            </div>

            {/* Sidebar Toggle */}
            <div
                onClick={() => setShowHistory(!showHistory)}
                style={{
                    position: 'absolute', right: 0, top: '100px',
                    background: 'rgba(255,255,255,0.1)', padding: '10px 5px',
                    borderRadius: '10px 0 0 10px', fontSize: '10px', textAlign: 'center', cursor: 'pointer'
                }}
            >
                📄<br />H<br />i<br />s<br />t
            </div>

            {/* History Sidebar */}
            {showHistory && (
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%',
                    background: 'rgba(0,0,0,0.9)', borderLeft: '1px solid #333', padding: '20px', zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ fontWeight: 'bold' }}>Medical History</div>
                        <div onClick={() => setShowHistory(false)}>✕</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.6' }}>
                        <b>Conditions:</b> None<br />
                        <b>Allergies:</b> Penicillin<br />
                        <b>Last Visit:</b> 20 Dec 2025<br />
                        <b>Vitals (Recorded):</b><br />
                        - BP: 120/80<br />
                        - Temp: 98.4F
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.8)', borderRadius: '20px 20px 0 0' }}>
                <button
                    className="btn primary"
                    style={{ background: 'white', color: 'black', marginBottom: '20px' }}
                    onClick={() => router.push('/doctor/rx-writer')}
                >
                    📝 Write Rx
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎤</div>
                    <div
                        style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer' }}
                        onClick={() => router.push('/doctor/dashboard')}
                    >
                        📞
                    </div>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📹</div>
                </div>
            </div>
        </div>
    );
}

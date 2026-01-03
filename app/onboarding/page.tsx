'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function Onboarding() {
    const router = useRouter();

    useEffect(() => {
        posthog.capture('signup_start');
    }, []);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'white'
        }}>
            {/* Visual Part */}
            <div style={{
                height: '60%',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px'
            }}>
                🌏
            </div>

            {/* Content */}
            <div style={{
                padding: '40px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div>
                    <h2 style={{ color: '#333' }}>Global Care</h2>
                    <p style={{ color: '#666', lineHeight: '1.5' }}>
                        Consult top Indian doctors from anywhere in the world.
                    </p>
                </div>

                {/* Pagination Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '20px', height: '8px', borderRadius: '4px', background: 'var(--primary)' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ccc' }}></div>
                </div>

                <button className="btn primary" onClick={() => {
                    // Set persistent cookie for 1 year
                    document.cookie = "onboarding_complete=true; path=/; max-age=31536000";
                    router.push('/login');
                }}>
                    Get Started
                </button>
            </div>
        </div>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DoctorLogin() {
    const router = useRouter();

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'white' }}>
            <Image
                src="/logo.png"
                alt="ZyraHealth Logo"
                width={80}
                height={80}
                style={{ marginBottom: '20px' }}
            />
            <h2 style={{ color: '#333', marginBottom: '5px' }}>ZyraHealth</h2>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '40px' }}>For Providers</div>

            <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="input-box">Provider ID / Email</div>
                <div className="input-box">Password</div>

                <button className="btn primary" style={{ background: '#28a745' }} onClick={() => router.push('/doctor/dashboard')}>
                    Secure Login
                </button>
            </div>

            <div style={{ marginTop: '30px', fontSize: '12px', color: '#888', textAlign: 'center', lineHeight: '1.5', maxWidth: '300px' }}>
                <b>Not yet on ZyraHealth?</b><br />
                Our platform is invite-only. To join our network of verified specialists, please <u style={{ cursor: 'pointer', color: '#28a745' }} onClick={() => alert('Please email partners@zyrahealth.com')}>contact our partner team</u>.
            </div>
        </div>
    );
}

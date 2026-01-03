'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Header */}
            <div className="glass-header">
                <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowLeft size={24} />
                    <span style={{ fontSize: '18px', fontWeight: '600' }}>Privacy Policy</span>
                </div>
            </div>

            <div className="page-container">
                <div className="card">
                    <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Privacy Policy</h1>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Last updated: January 2026</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', fontSize: '14px', color: '#333' }}>
                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>1. Introduction</h3>
                            <p>Welcome to Zyra Health. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our app and tell you about your privacy rights and how the law protects you.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>2. Data We Collect</h3>
                            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, title, date of birth and gender.</li>
                                <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                                <li><strong>Health Data</strong> includes medical records, prescriptions, and consultation notes encrypted and stored securely.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>3. How We Use Your Data</h3>
                            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>To provide the healthcare services and consultations you request.</li>
                                <li>To manage payments, fees and charges.</li>
                                <li>To manage our relationship with you.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>4. Data Security</h3>
                            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>5. Contact Us</h3>
                            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at support@zyrahealth.com.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

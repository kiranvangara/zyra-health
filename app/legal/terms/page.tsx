'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
    const router = useRouter();

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Header */}
            <div className="glass-header">
                <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowLeft size={24} />
                    <span style={{ fontSize: '18px', fontWeight: '600' }}>Terms & Conditions</span>
                </div>
            </div>

            <div className="page-container">
                <div className="card">
                    <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Terms & Conditions</h1>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Last updated: January 2026</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', fontSize: '14px', color: '#333' }}>
                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>1. Agreement to Terms</h3>
                            <p>By accessing our app, Zyra Health, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>2. Medical Disclaimer</h3>
                            <p style={{ background: '#fff3cd', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                                <strong>Important:</strong> Zyra Health facilitates online consultations but is not a substitute for emergency medical care. If you are facing a medical emergency, please visit your nearest hospital immediately.
                            </p>
                            <p style={{ marginTop: '10px' }}>Doctors on our platform are independent practitioners. Zyra Health does not directly provide medical services and is not liable for the outcome of consultations.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>3. User Accounts</h3>
                            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>4. Intellectual Property</h3>
                            <p>The Service and its original content, features and functionality are and will remain the exclusive property of Zyra Health and its licensors.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>5. Termination</h3>
                            <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>6. Changes</h3>
                            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

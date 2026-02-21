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
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Last updated: February 2026</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', fontSize: '14px', color: '#333' }}>
                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>1. Introduction</h3>
                            <p>Welcome to Medivera. We are committed to protecting your personal data and privacy. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the <strong>Information Technology Act, 2000</strong>.</p>
                            <p style={{ marginTop: '10px' }}>Medivera acts as a &quot;Data Fiduciary&quot; under the DPDP Act for the personal data collected through this platform.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>2. Data We Collect</h3>
                            <p>We collect the following categories of personal data:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li><strong>Identity Data:</strong> Full name, email address, age, gender, and profile photo.</li>
                                <li><strong>Health Data:</strong> Medical conditions, medications, blood group, consultation notes, prescriptions, and uploaded medical records. This is classified as <strong>sensitive personal data</strong>.</li>
                                <li><strong>Consultation Data:</strong> Video/audio consultation recordings (if applicable), chat messages, and appointment history.</li>
                                <li><strong>Consent Records:</strong> Timestamps and details of consent given for data processing and teleconsultation.</li>
                                <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage analytics.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>3. How We Use Your Data</h3>
                            <p>We use your personal data for the following purposes:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>Providing teleconsultation services and facilitating doctor-patient communication.</li>
                                <li>Generating and storing electronic prescriptions.</li>
                                <li>Managing appointments, medical records, and billing.</li>
                                <li>Improving service quality through anonymized analytics.</li>
                                <li>Communicating appointment reminders and service updates.</li>
                                <li>Complying with legal and regulatory obligations.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>4. Legal Basis for Processing</h3>
                            <p>Under the DPDP Act, 2023, we process your data on the following bases:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li><strong>Consent:</strong> You provide explicit consent at signup for data processing and at each booking for teleconsultation. You may withdraw consent at any time.</li>
                                <li><strong>Contractual Necessity:</strong> Processing required to provide the services you requested (e.g., sharing your details with your consulting doctor).</li>
                                <li><strong>Legal Obligation:</strong> Retaining medical records as required under Indian medical regulations.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>5. Data Retention</h3>
                            <p>We retain your data for the following periods:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li><strong>Medical Records & Prescriptions:</strong> Minimum 3 years from the date of consultation, as required by Indian medical record-keeping guidelines.</li>
                                <li><strong>Account Data:</strong> Retained for the duration of your active account, plus 30 days after account deletion.</li>
                                <li><strong>Consent Logs:</strong> Retained indefinitely as part of our regulatory audit trail.</li>
                                <li><strong>Analytics Data:</strong> Anonymized and retained for up to 2 years.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>6. Your Rights</h3>
                            <p>Under the DPDP Act, 2023, you have the following rights:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li><strong>Right to Access:</strong> Request a copy of your personal data held by us.</li>
                                <li><strong>Right to Correction:</strong> Request correction of inaccurate personal data.</li>
                                <li><strong>Right to Erasure:</strong> Request deletion of your personal data, subject to legal retention requirements.</li>
                                <li><strong>Right to Data Portability:</strong> Download your data in a machine-readable format.</li>
                                <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for data processing at any time via your profile settings.</li>
                            </ul>
                            <p style={{ marginTop: '10px' }}>To exercise any of these rights, use the options in your Profile page or contact our Grievance Officer.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>7. Data Security</h3>
                            <p>We implement appropriate technical and organizational security measures:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>All data is encrypted at rest and in transit using industry-standard encryption (AES-256, TLS 1.2+).</li>
                                <li>Access to personal data is restricted to authorized personnel on a need-to-know basis.</li>
                                <li>Regular security assessments and vulnerability testing.</li>
                                <li>Data breach notification will be provided to affected users and the Data Protection Board of India as required by the DPDP Act.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>8. Third-Party Services</h3>
                            <p>We use the following third-party services that may process your data:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li><strong>Supabase:</strong> Cloud database and authentication services (data storage and user management).</li>
                                <li><strong>Daily.co:</strong> Video consultation infrastructure (video/audio streams).</li>
                                <li><strong>PostHog:</strong> Product analytics (anonymized usage data).</li>
                                <li><strong>Google OAuth:</strong> Authentication service (if you sign in with Google).</li>
                            </ul>
                            <p style={{ marginTop: '10px' }}>Each third-party provider has their own privacy policy and data processing agreements. We ensure all third-party providers meet our data protection standards.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>9. Contact & Grievance Officer</h3>
                            <p>For any questions about this Privacy Policy or to exercise your data rights, please contact:</p>
                            <div style={{ background: '#f0f7ff', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
                                <p><strong>Grievance Officer</strong></p>
                                <p>Email: privacy@medivera.com</p>
                                <p>Response time: Within 72 hours of receiving your request</p>
                            </div>
                            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                If you are not satisfied with our response, you may file a complaint with the Data Protection Board of India as established under the DPDP Act, 2023.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

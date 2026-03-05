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
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Last updated: March 2026</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', fontSize: '14px', color: '#333' }}>
                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>1. Agreement to Terms</h3>
                            <p>By accessing or using the Medivera application (&quot;Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Service. These terms constitute a legally binding agreement between you and Medivera.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>2. Medical Disclaimer</h3>
                            <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #ffc107', marginBottom: '10px' }}>
                                <strong>Important:</strong> Medivera facilitates online teleconsultations but is <strong>not a substitute for emergency medical care</strong>. If you are experiencing a medical emergency, please visit your nearest hospital or call emergency services immediately.
                            </div>
                            <p>Teleconsultations have inherent limitations compared to in-person consultations. Doctors may not be able to perform physical examinations, and certain conditions may require in-person evaluation. The consulting doctor will use their professional judgment to determine if a teleconsultation is appropriate for your condition.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>3. Teleconsultation Services</h3>
                            <p>Medivera provides a platform for teleconsultation services in accordance with the <strong>Telemedicine Practice Guidelines, 2020</strong> issued by the Board of Governors, Medical Council of India (now National Medical Commission).</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>All consultations are conducted via video, audio, or text-based communication.</li>
                                <li>All doctors on the platform are Registered Medical Practitioners (RMPs) registered with the National Medical Commission or a State Medical Council.</li>
                                <li>This Service currently operates within the jurisdiction of India. Patients located outside India should consult healthcare providers licensed in their country of residence for primary medical care.</li>
                                <li>Teleconsultation for patients under 16 years of age requires the presence of an identified adult family member or guardian.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>4. Prescriptions</h3>
                            <p>Electronic prescriptions issued through the platform comply with Telemedicine Practice Guidelines and include:</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>The doctor&apos;s name, qualification, and registration number.</li>
                                <li>A &quot;Teleconsultation&quot; label to distinguish from in-person prescriptions.</li>
                                <li>Patient identification details and consultation date.</li>
                            </ul>
                            <p style={{ marginTop: '10px' }}>The prescribing doctor is solely responsible for ensuring compliance with applicable drug prescribing rules, including restrictions on Schedule X and controlled substances via teleconsultation. Medivera does not manufacture, stock, or dispense medications.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>5. User Accounts</h3>
                            <p>When you create an account, you must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>6. Data Privacy & Consent</h3>
                            <p>By using the Service, you consent to the collection, processing, and storage of your personal and health data as described in our <span onClick={() => router.push('/legal/privacy')} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}>Privacy Policy</span>. Your health data is classified as sensitive personal data under the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.</p>
                            <p style={{ marginTop: '10px' }}>You have the right to withdraw your consent for data processing at any time. Withdrawal of consent may limit your ability to use certain features of the Service.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>7. Intellectual Property</h3>
                            <p>The Service and its original content, features, and functionality are the exclusive property of Medivera and its licensors. The Service is protected by copyright, trademark, and other intellectual property laws.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>8. Limitation of Liability</h3>
                            <p>Medivera acts as a technology platform facilitating teleconsultations between patients and independent medical practitioners. Medivera does not directly provide medical services.</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>Doctors on the platform are independent practitioners and are solely responsible for clinical decisions, prescriptions, and medical advice.</li>
                                <li>Medivera shall not be liable for any medical outcomes, misdiagnosis, or adverse effects arising from teleconsultations conducted through the platform.</li>
                                <li>Medivera&apos;s total liability to you for any claim shall not exceed the amount you paid for the specific consultation giving rise to the claim.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>9. Termination</h3>
                            <p>We may terminate or suspend your access to the Service immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Service ceases immediately. Your medical records will be retained as required by applicable law.</p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>10. Governing Law, Jurisdiction & Dispute Resolution</h3>
                            <div style={{ background: '#e8f4fd', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #0047AB', marginBottom: '10px' }}>
                                <strong>Jurisdiction:</strong> This Service operates exclusively within the territory of India. By using this Service, you agree that Indian law governs all aspects of your use.
                            </div>
                            <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</p>
                            <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '10px' }}>
                                <li>Any disputes arising out of or in connection with these Terms shall first be attempted to be resolved through <strong>mediation</strong> between the parties within 30 days of written notice.</li>
                                <li>If mediation fails, the dispute shall be referred to and finally resolved by <strong>arbitration</strong> under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be <strong>Amaravathi, Andhra Pradesh, India</strong>.</li>
                                <li>The arbitration shall be conducted by a sole arbitrator mutually agreed upon by both parties, in the English language.</li>
                                <li>Subject to the above arbitration clause, the courts at <strong>Amaravathi, Andhra Pradesh</strong> shall have exclusive jurisdiction over any proceedings arising out of or related to these Terms.</li>
                                <li>This Service is intended for use within India only. Users accessing the Service from outside India do so at their own risk and are responsible for compliance with local laws.</li>
                            </ul>
                            <p style={{ marginTop: '10px' }}>We reserve the right to modify these Terms at any time. Material changes will be communicated via the Service or email. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

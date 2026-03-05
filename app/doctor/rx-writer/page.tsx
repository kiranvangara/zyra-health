'use client';

import posthog from 'posthog-js';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../utils/supabase';
import MedicineSearch from '../../components/MedicineSearch';


interface Medication {
    name: string;
    composition?: string;
    strength?: string;
    frequency: string;
    duration: string;
}


import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

// ... (previous imports)

function RxWriterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    const [patient, setPatient] = useState<any>(null);
    const [medications, setMedications] = useState<Medication[]>([
        { name: '', frequency: '', duration: '' }
    ]);
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const sigPad = useRef<SignatureCanvas>(null);

    // ... (previous helper functions)

    const clearSignature = () => {
        sigPad.current?.clear();
    };

    const handleSignAndSend = async () => {
        if (!appointmentId) {
            alert('No appointment selected');
            return;
        }

        // Validate at least one medication
        const validMeds = medications.filter(m => m.name.trim() !== '');
        if (validMeds.length === 0) {
            alert('Please add at least one medication');
            return;
        }

        // Validate Signature
        if (sigPad.current?.isEmpty()) {
            alert('Please sign the prescription');
            return;
        }

        // In a real app, upload this data URL to Supabase Storage
        const signatureDataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
        console.log('Signature captured:', signatureDataUrl?.substring(0, 50) + '...');

        setLoading(true);

        try {
            const { error } = await supabase
                .from('prescriptions')
                .insert({
                    appointment_id: appointmentId,
                    medications: validMeds,
                    advice: advice || null,
                    // If we had a signature_url column, we'd upload the image first and save the URL here
                });

            if (error) throw error;

            posthog.capture('rx_written', {
                appointment_id: appointmentId,
                medication_count: validMeds.length,
                has_advice: !!advice.trim(),
            });

            alert('Prescription signed & sent successfully!');
            router.push('/doctor/dashboard');
        } catch (error: any) {
            alert('Error saving prescription: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            {/* ... (Header) ... */}

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                {/* Medications List */}
                {medications.map((med, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '10px', border: '1px solid #e8e8e8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Medicine {index + 1}</span>
                            {medications.length > 1 && (
                                <span
                                    onClick={() => setMedications(medications.filter((_, i) => i !== index))}
                                    style={{ fontSize: '12px', color: '#ff4444', cursor: 'pointer' }}
                                >Remove ✕</span>
                            )}
                        </div>
                        <MedicineSearch
                            value={med.name}
                            onChange={(val) => {
                                const updated = [...medications];
                                updated[index] = { ...updated[index], name: val };
                                setMedications(updated);
                            }}
                            onSelect={(selected) => {
                                const updated = [...medications];
                                updated[index] = {
                                    ...updated[index],
                                    name: selected.name,
                                    composition: selected.composition || undefined,
                                };
                                setMedications(updated);
                            }}
                            placeholder="Search medicine (e.g. Amoxicillin)"
                        />
                        {med.composition && (
                            <div style={{ fontSize: '11px', color: '#0070f3', marginTop: '4px', padding: '0 4px' }}>
                                💊 {med.composition}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input
                                className="input-box"
                                style={{ flex: 1 }}
                                placeholder="Frequency (e.g. Twice daily)"
                                value={med.frequency}
                                onChange={(e) => {
                                    const updated = [...medications];
                                    updated[index].frequency = e.target.value;
                                    setMedications(updated);
                                }}
                            />
                            <input
                                className="input-box"
                                style={{ flex: 1 }}
                                placeholder="Duration (e.g. 5 days)"
                                value={med.duration}
                                onChange={(e) => {
                                    const updated = [...medications];
                                    updated[index].duration = e.target.value;
                                    setMedications(updated);
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* Add More Button */}
                <button
                    onClick={() => setMedications([...medications, { name: '', frequency: '', duration: '' }])}
                    style={{
                        width: '100%', padding: '10px', marginBottom: '20px',
                        background: 'transparent', border: '1px dashed #ccc',
                        borderRadius: '8px', color: '#666', cursor: 'pointer',
                        fontSize: '13px',
                    }}
                >
                    + Add Another Medicine
                </button>

                {/* Notes */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Advice / Notes</label>
                    <textarea
                        className="input-box"
                        style={{ height: '80px', fontFamily: 'inherit' }}
                        placeholder="Drink plenty of warm water..."
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                    />
                </div>

                {/* Signature Pad */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Doctor's Signature</label>
                        <span onClick={clearSignature} style={{ fontSize: '12px', color: '#ff4444', cursor: 'pointer' }}>Clear x</span>
                    </div>
                    <div style={{ border: '1px solid #ccc', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
                        <SignatureCanvas
                            ref={sigPad}
                            penColor="black"
                            canvasProps={{
                                width: 350, // Should be responsive ideally, but fixed for MPV
                                height: 150,
                                className: 'sigCanvas',
                                style: { width: '100%', height: '150px' }
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Sign above using your finger or stylus</div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #ddd' }}>
                {/* Drug Prescribing Disclaimer */}
                <div style={{
                    padding: '10px 12px', marginBottom: '12px',
                    background: '#FFFBEB', borderRadius: '8px',
                    border: '1px solid #FDE68A',
                    fontSize: '11px', lineHeight: '1.5', color: '#92400E'
                }}>
                    <strong>⚠️ Prescribing reminder:</strong> Per Telemedicine Practice Guidelines 2020 — List O drugs only for first consultations. List A drugs require video consultation. Schedule X and narcotics/psychotropics cannot be prescribed via teleconsultation.
                </div>
                <button
                    className="btn primary"
                    style={{ background: '#28a745' }}
                    onClick={handleSignAndSend}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Sign & Send 🚀'}
                </button>
            </div>
        </div>
    );
}

export default function RxWriter() {
    return (
        <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
            <RxWriterContent />
        </Suspense>
    );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../utils/supabase';

interface Medication {
    name: string;
    frequency: string;
    duration: string;
}

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

    useEffect(() => {
        if (appointmentId) {
            fetchPatientInfo();
        }
    }, [appointmentId]);

    const fetchPatientInfo = async () => {
        const { data: appointment } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('id', appointmentId)
            .single();

        if (appointment) {
            const { data: { user } } = await supabase.auth.admin.getUserById(appointment.patient_id);
            setPatient({
                name: user?.user_metadata?.full_name || 'Patient',
                id: appointment.patient_id
            });
        }
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', frequency: '', duration: '' }]);
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
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

        setLoading(true);

        try {
            const { error } = await supabase
                .from('prescriptions')
                .insert({
                    appointment_id: appointmentId,
                    medications: validMeds,
                    advice: advice || null,
                });

            if (error) throw error;

            alert('Prescription signed & sent successfully!');
            router.push('/doctor/dashboard');
        } catch (error: any) {
            alert('Error saving prescription: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px', background: 'white', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer' }}>&lt;</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Rx: {patient?.name || 'Loading...'}</h2>
                    <div style={{ fontSize: '12px', color: '#666' }}>Digital Prescription</div>
                </div>
            </div>

            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                {/* Medications */}
                {medications.map((med, index) => (
                    <div key={index} className="card" style={{ padding: '15px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Medicine {index + 1}</div>
                            {medications.length > 1 && (
                                <div
                                    onClick={() => removeMedication(index)}
                                    style={{ color: '#ff4444', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    Remove
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            className="input-box"
                            placeholder="Medicine name (e.g., Paracetamol 500mg)"
                            value={med.name}
                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                            style={{ marginBottom: '10px' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', color: '#666' }}>Frequency</label>
                                <input
                                    type="text"
                                    className="input-box"
                                    placeholder="1-0-1"
                                    value={med.frequency}
                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    style={{ padding: '8px' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '11px', color: '#666' }}>Duration</label>
                                <input
                                    type="text"
                                    className="input-box"
                                    placeholder="3 Days"
                                    value={med.duration}
                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    style={{ padding: '8px' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add More */}
                <div
                    className="card"
                    onClick={addMedication}
                    style={{
                        padding: '15px',
                        border: '1px dashed var(--primary)',
                        background: '#eef',
                        textAlign: 'center',
                        color: 'var(--primary)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginBottom: '20px'
                    }}
                >
                    + Add Medicine
                </div>

                {/* Notes */}
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Advice / Notes</label>
                    <textarea
                        className="input-box"
                        style={{ height: '80px', fontFamily: 'inherit' }}
                        placeholder="Drink plenty of warm water..."
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #ddd' }}>
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

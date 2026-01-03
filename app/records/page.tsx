'use client';
import posthog from 'posthog-js';

import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { generatePrescriptionPDF } from '../utils/generatePrescriptionPDF';

interface Prescription {
    id: string;
    created_at: string;
    medications: any[];
    advice: string;
    appointment: {
        doctor_name: string;
        scheduled_at: string;
    };
}

interface MedicalFile {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    uploaded_at: string;
    title?: string;
}

export default function Records() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [files, setFiles] = useState<MedicalFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileTitle, setFileTitle] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Viewer State
    const [viewingFile, setViewingFile] = useState<MedicalFile | null>(null);
    const [viewingUrl, setViewingUrl] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUserId(user.id);

        // Fetch prescriptions
        const { data: appointments } = await supabase
            .from('appointments')
            .select('id, doctor_id, scheduled_at')
            .eq('patient_id', user.id);

        if (appointments) {
            const prescriptionsWithDoctors = await Promise.all(
                appointments.map(async (appt) => {
                    const { data: prescription } = await supabase
                        .from('prescriptions')
                        .select('*')
                        .eq('appointment_id', appt.id)
                        .single();

                    if (!prescription) return null;

                    const { data: doctorData } = await supabase
                        .from('doctors')
                        .select('display_name')
                        .eq('id', appt.doctor_id)
                        .single();

                    return {
                        ...prescription,
                        appointment: {
                            doctor_name: doctorData?.display_name || 'Dr. Anonymous',
                            scheduled_at: appt.scheduled_at
                        }
                    };
                })
            );

            setPrescriptions(prescriptionsWithDoctors.filter(p => p !== null) as Prescription[]);
        }

        // Fetch uploaded files
        const { data: medicalFiles } = await supabase
            .from('medical_files')
            .select('*')
            .eq('patient_id', user.id)
            .order('uploaded_at', { ascending: false });

        setFiles(medicalFiles || []);
        setLoading(false);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only PDF and image files are allowed');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        setFileTitle(file.name.split('.')[0]); // Default title to filename without ext
        setShowUploadModal(true);
    };

    const handleUploadConfirm = async () => {
        if (!selectedFile || !fileTitle.trim()) {
            alert('Please provide a title');
            return;
        }

        setUploading(true);

        try {
            // Upload to Supabase Storage
            const fileName = `${Date.now()}_${selectedFile.name}`;
            const filePath = `${userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('medical-records')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // Save metadata to database
            const { error: dbError } = await supabase
                .from('medical_files')
                .insert({
                    patient_id: userId,
                    title: fileTitle,
                    file_name: selectedFile.name,
                    file_path: filePath,
                    file_type: selectedFile.type,
                    file_size: selectedFile.size,
                });

            if (dbError) throw dbError;

            alert('File uploaded successfully!');
            setShowUploadModal(false);
            setSelectedFile(null);
            setFileTitle('');
            fetchData(); // Refresh the list
        } catch (error: any) {
            alert('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const downloadFile = async (filePath: string, fileName: string) => {
        const { data, error } = await supabase.storage
            .from('medical-records')
            .download(filePath);

        if (error) {
            alert('Error downloading file: ' + error.message);
            return;
        }

        // Create download link
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const openFileViewer = async (file: MedicalFile) => {
        // Fetch signed URL valid for 1 hour
        const { data, error } = await supabase.storage
            .from('medical-records')
            .createSignedUrl(file.file_path, 3600);

        if (error || !data?.signedUrl) {
            alert('Could not load file preview');
            return;
        }

        setViewingUrl(data.signedUrl);
        setViewingFile(file);
    };


    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' }}>
            <div className="glass-header">
                <h2 style={{ margin: 0 }}>Medical Records</h2>
            </div>

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading...</div>
            ) : (
                <div style={{ padding: '20px' }}>
                    {/* Prescriptions Section */}
                    {/* ... Prescriptions Rendering (Same as before) ... */}
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#666' }}>PRESCRIPTIONS</div>
                    {prescriptions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                            <div>No prescriptions yet</div>
                        </div>
                    ) : (
                        prescriptions.map(rx => (
                            <div key={rx.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{rx.appointment.doctor_name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{formatDate(rx.created_at)}</div>
                                </div>

                                <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#666' }}>Medications:</div>
                                    {rx.medications.map((med: any, idx: number) => (
                                        <div key={idx} style={{ marginBottom: '5px', paddingLeft: '10px' }}>
                                            • {med.name} - {med.frequency} for {med.duration}
                                        </div>
                                    ))}
                                </div>

                                {rx.advice && (
                                    <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                        <strong>Advice:</strong> {rx.advice}
                                    </div>
                                )}

                                <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn secondary"
                                        style={{ fontSize: '11px', padding: '5px 10px', flex: 1 }}
                                        onClick={() => {
                                            posthog.capture('rx_downloaded', { prescription_id: rx.id });
                                            generatePrescriptionPDF(rx);
                                        }}
                                    >
                                        ⬇ PDF
                                    </button>
                                    <button
                                        className="btn secondary"
                                        style={{ fontSize: '11px', padding: '5px 10px', flex: 1 }}
                                        onClick={() => window.location.href = `mailto:?subject=Prescription from ${rx.appointment.doctor_name}&body=Please find my prescription details attached.`}
                                    >
                                        📧 Email
                                    </button>
                                    <button
                                        className="btn primary"
                                        style={{ fontSize: '11px', padding: '5px 10px', flex: 1 }}
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: `Prescription from ${rx.appointment.doctor_name}`,
                                                    text: `Prescription details for ${rx.medications.length} medications.`,
                                                    url: window.location.href
                                                }).catch(console.error);
                                            } else {
                                                alert('Sharing not supported on this browser');
                                            }
                                        }}
                                    >
                                        Share 📤
                                    </button>
                                </div>
                            </div>
                        ))
                    )}


                    {/* Lab Reports Section */}
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '30px', marginBottom: '10px', color: '#666' }}>PAST REPORTS & DOCUMENTS</div>

                    {files.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧪</div>
                            <div>No documents uploaded</div>
                        </div>
                    ) : (
                        files.map(file => (
                            <div key={file.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openFileViewer(file)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        {/* Use Title instead of FileName */}
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{file.title || file.file_name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{formatDate(file.uploaded_at)}</div>
                                    </div>
                                    <button
                                        className="btn secondary"
                                        style={{ fontSize: '11px', padding: '6px 12px' }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening viewer
                                            downloadFile(file.file_path, file.file_name);
                                        }}
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    <label htmlFor="file-upload">
                        <div className="btn primary" style={{ marginTop: '15px', fontSize: '12px', padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
                            {uploading ? 'Uploading...' : '+ Upload New Document'}
                        </div>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        disabled={uploading}
                    />
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && selectedFile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '320px' }}>
                        <h3 style={{ marginTop: 0 }}>Upload Document</h3>
                        <p style={{ fontSize: '13px', color: '#666' }}>{selectedFile.name}</p>

                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Document Title</label>
                        <input
                            type="text"
                            className="input-box"
                            placeholder="e.g. Blood Test Report"
                            autoFocus
                            value={fileTitle}
                            onChange={(e) => setFileTitle(e.target.value)}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn secondary" style={{ flex: 1 }} onClick={() => {
                                setShowUploadModal(false);
                                setSelectedFile(null);
                            }}>Cancel</button>
                            <button className="btn primary" style={{ flex: 1 }} onClick={handleUploadConfirm} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Viewer Modal */}
            {viewingFile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'black', zIndex: 100,
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                        <div style={{ fontWeight: 'bold' }}>{viewingFile.title || viewingFile.file_name}</div>
                        <div style={{ cursor: 'pointer', padding: '5px' }} onClick={() => { setViewingFile(null); setViewingUrl(''); }}>✕ Close</div>
                    </div>

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}>
                        {viewingFile.file_type.includes('image') ? (
                            <img src={viewingUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <iframe src={viewingUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                        )}
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

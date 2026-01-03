'use client';

import { useEffect, useState } from 'react';
import { getAllDoctors, updateDoctorVerification, updateDoctorFee, createDoctor, updateDoctorProfile } from '../actions';
import { Plus, X, Pencil } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface Doctor {
    id: string;
    display_name: string;
    specialization: string;
    is_verified: boolean;
    consultation_fee: number;
    consultation_fee_usd?: number;
    experience_years: number;
    about_me?: string;
    education?: string;
    languages_spoken?: string[];
    registration_number?: string;
    profile_photo_url?: string;
}

export default function ManageDoctors() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
    const [tempFee, setTempFee] = useState<number>(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

    const initialFormState = {
        display_name: '',
        email: '',
        password: '',
        specialization: 'General Physician',
        consultation_fee: 30,
        consultation_fee_usd: undefined as number | undefined,
        experience_years: 5,
        education: '',

        languages_input: '',
        registration_number: '',
        profile_photo_url: '',
        about_me: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        const { data, error } = await getAllDoctors();
        if (data) setDoctors(data as Doctor[]);
        if (error) alert('Error fetching doctors: ' + error);
        setLoading(false);
    };

    const toggleVerification = async (doctor: Doctor) => {
        const newVal = !doctor.is_verified;
        // Optimistic update
        setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, is_verified: newVal } : d));
        const { success, error } = await updateDoctorVerification(doctor.id, newVal);
        if (!success) {
            alert('Error updating doctor: ' + error);
            // Revert on error
            setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, is_verified: !newVal } : d));
        }
    };

    const handleSaveFee = async (doctor: Doctor) => {
        const { success, error } = await updateDoctorFee(doctor.id, tempFee);
        if (success) {
            setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, consultation_fee: tempFee } : d));
            setEditingFeeId(null);
        } else {
            alert('Failed to update fee: ' + error);
        }
    };

    const openCreateModal = () => {
        setIsEditingMode(false);
        setFormData(initialFormState);
        setSelectedDoctorId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (doctor: Doctor) => {
        setIsEditingMode(true);
        setSelectedDoctorId(doctor.id);
        setFormData({
            ...initialFormState,
            display_name: doctor.display_name,
            specialization: doctor.specialization,
            consultation_fee: doctor.consultation_fee,
            consultation_fee_usd: doctor.consultation_fee_usd,
            experience_years: doctor.experience_years,
            about_me: doctor.about_me || '',
            education: doctor.education || '',
            registration_number: doctor.registration_number || '',
            profile_photo_url: doctor.profile_photo_url || '',
            languages_input: (doctor.languages_spoken || []).join(', '),
            email: '', // Not editable
            password: '' // Not editable
        });
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('doctor-profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('doctor-profiles')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, profile_photo_url: publicUrl }));
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.display_name) {
            alert('Name is required');
            return;
        }

        setSaving(true);
        const submissionData = {
            ...formData,
            languages_spoken: formData.languages_input.split(',').map(s => s.trim()).filter(Boolean)
        };

        if (isEditingMode && selectedDoctorId) {
            const { success, error } = await updateDoctorProfile(selectedDoctorId, submissionData);
            if (success) {
                alert('Profile updated! ✅');
                setIsModalOpen(false);
                fetchDoctors();
            } else {
                alert('Update failed: ' + error);
            }
        } else {
            if (!formData.email || !formData.password) {
                alert('Email and Password are required for new accounts');
                setSaving(false);
                return;
            }
            const { success, error } = await createDoctor(submissionData);
            if (success) {
                alert('Doctor created! ✅');
                setIsModalOpen(false);
                fetchDoctors();
            } else {
                alert('Creation failed: ' + error);
            }
        }
        setSaving(false);
    };

    return (
        <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Manage Doctors</h2>
                <button
                    className="btn primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto', padding: '10px 20px' }}
                    onClick={openCreateModal}
                >
                    <Plus size={18} /> Add Doctor
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Specialization</th>
                                <th>Fee</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map(doctor => (
                                <tr key={doctor.id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{doctor.display_name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{doctor.education}</div>
                                    </td>
                                    <td>{doctor.specialization}</td>
                                    <td>
                                        {editingFeeId === doctor.id ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <input
                                                    type="number"
                                                    value={tempFee}
                                                    onChange={(e) => setTempFee(parseInt(e.target.value))}
                                                    style={{ width: '80px', padding: '5px' }}
                                                />
                                                <button onClick={() => handleSaveFee(doctor)}>💾</button>
                                            </div>
                                        ) : (
                                            <span onClick={() => { setEditingFeeId(doctor.id); setTempFee(doctor.consultation_fee); }} style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc' }}>
                                                ₹{doctor.consultation_fee}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${doctor.is_verified ? 'verified' : 'pending'}`}>
                                            {doctor.is_verified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => openEditModal(doctor)}
                                            style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                                            title="Edit Profile"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        {doctor.is_verified ? (
                                            <button
                                                onClick={() => toggleVerification(doctor)}
                                                style={{ padding: '6px 12px', border: '1px solid #ef4444', color: '#ef4444', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                Revoke
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toggleVerification(doctor)}
                                                style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>

                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{isEditingMode ? 'Edit Doctor Profile' : 'Add New Doctor'}</h3>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Full Name</label>
                                <input
                                    className="input-box"
                                    placeholder="Dr. Name"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                />
                            </div>

                            {!isEditingMode && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Email</label>
                                        <input
                                            className="input-box"
                                            placeholder="email@zyra.com"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Password</label>
                                        <input
                                            className="input-box"
                                            placeholder="Secure password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Specialization</label>
                                    <select
                                        className="input-box"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    >
                                        <option>General Physician</option>
                                        <option>Cardiology</option>
                                        <option>Dermatology</option>
                                        <option>Pediatrics</option>
                                        <option>Orthopedics</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Fee (INR)</label>
                                        <input
                                            type="number"
                                            className="input-box"
                                            value={formData.consultation_fee}
                                            onChange={(e) => setFormData({ ...formData, consultation_fee: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Fee (USD)</label>
                                        <input
                                            type="number"
                                            className="input-box"
                                            placeholder="Optional"
                                            value={formData.consultation_fee_usd || ''}
                                            onChange={(e) => setFormData({ ...formData, consultation_fee_usd: e.target.value ? parseInt(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>About / Bio</label>
                                    <textarea
                                        className="input-box"
                                        style={{ height: '80px', fontFamily: 'inherit' }}
                                        placeholder="Short biography..."
                                        value={formData.about_me}
                                        onChange={(e) => setFormData({ ...formData, about_me: e.target.value })}
                                    />
                                </div>

                                <button
                                    className="btn primary"
                                    style={{ marginTop: '10px' }}
                                    disabled={saving}
                                    onClick={handleSubmit}
                                >
                                    {saving ? 'Saving...' : (isEditingMode ? 'Update Profile' : 'Create Account')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

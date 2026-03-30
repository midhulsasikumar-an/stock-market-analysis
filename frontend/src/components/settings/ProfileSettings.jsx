import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { getAvatarImageUrl, getAvatarInitials } from '../../utils/avatar';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ProfileSettings() {
    const { user, login } = useAuth(); // login function from context might need to be refreshed or we just update local state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef();

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
            setPreviewImage(getAvatarImageUrl(user.profileImage));
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
                return;
            }
            setProfileImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const avatarInitials = getAvatarInitials(user);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            if (profileImage) {
                formData.append('profileImage', profileImage);
            }

            const res = await fetch(`${API_URL}/api/profile/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': authService.getAuthHeaders().Authorization
                },
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update local storage user
                const updatedUser = { ...user, firstName: data.user.firstName, lastName: data.user.lastName, profileImage: data.user.profileImage };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Reload window to reflect changes globally
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setMessage({ type: 'error', text: data.message || 'Error updating profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to connect to server' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 bg-glass rounded">
            <h2 className="text-xl fw-bold text-white mb-4">Edit Profile</h2>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} p-2 small mb-4 rounded opacity-75`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="d-flex flex-column gap-4">

                {/* Avatar Upload */}
                <div className="d-flex align-items-center gap-4">
                    <div className="position-relative" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)' }}>
                        {previewImage ? (
                            <img src={previewImage} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div className="w-100 h-100 bg-secondary d-flex align-items-center justify-content-center text-white text-uppercase" style={{ fontSize: '1.5rem' }}>
                                {avatarInitials}
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/jpeg, image/png" className="d-none" />
                    </div>
                    <div>
                        <button type="button" className="btn btn-sm btn-outline-light px-3 py-1 bg-opacity-10 rounded" onClick={() => fileInputRef.current.click()}>
                            Change Picture
                        </button>
                        <p className="text-muted mt-1 m-0" style={{ fontSize: '0.65rem' }}>JPG, PNG. Max 5MB.</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label text-muted small mb-1">First Name</label>
                        <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Enter first name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-muted small mb-1">Last Name</label>
                        <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Enter last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div className="col-12 mt-3">
                        <label className="form-label text-muted small mb-1">Email Address</label>
                        <input type="email" className="form-control bg-dark text-secondary border-secondary" value={email} disabled readOnly />
                        <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.65rem' }}>Email cannot be changed directly.</p>
                    </div>
                </div>

                <div className="d-flex justify-content-end mt-2">
                    <button type="submit" disabled={saving} className="btn btn-primary px-4 py-2 fw-bold text-white rounded">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

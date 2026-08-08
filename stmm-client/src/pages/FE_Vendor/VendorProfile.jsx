import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '../../utils/alert';
import { translateError } from '../../utils/translateError';
import './VendorProfile.css';

const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export default function VendorProfile() {
  const { t } = useTranslation();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [language, setLanguage] = useState('English');

    // Password change fields
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get('http://localhost:5056/api/users/profile/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const data = res.data;
                setProfile(data);
                setFullName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
                
                // Extract vendor details if they exist in the nested object
                if (data.vendor) {
                    setBusinessName(data.vendor.businessName || '');
                } else if (data.businessName) {
                    setBusinessName(data.businessName);
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                showError(t('vendorprofile.failure'), t('vendorprofile.unable_to_load_account'));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.put('http://localhost:5056/api/users/profile/me', {
                name: fullName,
                phone: phone,
                businessName: businessName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess(t('vendorprofile.success'), t('vendorprofile.updated_information_successfully'));
        } catch (err) {
            console.error("Error updating profile:", err);
            const msg = err.response?.data?.message || err.response?.data || "Có lỗi xảy ra khi cập nhật.";
            showError(t('vendorprofile.failure'), translateError(msg, t));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');
        
        if (newPassword !== confirmPassword) {
            setPasswordError(t('vendorprofile.confirmation_password_does_not'));
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError(t('vendorprofile.the_new_password_must'));
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.post('http://localhost:5056/api/users/change-password', {
                currentPassword: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPasswordSuccess(res.data.message || t('vendorprofile.password_changed_successfully'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordChange(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (err) {
            console.error("Error changing password:", err);
            const msg = err.response?.data?.message || err.response?.data || t('vendorprofile.an_error_occurred_while');
            setPasswordError(translateError(msg, t));
        }
    };

    if (loading) return <div className="vendor-profile-loading">{t('vendorprofile.loading_information')}</div>;

    return (
        <div className="vendor-profile-container">
            {/* Header Section */}
            <div className="vp-header">
                <div className="vp-avatar-wrapper">
                    <div className="vp-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                </div>
                <div className="vp-header-info">
                    <h2>{fullName || 'Vendor'}</h2>
                    <p>{t('vendorprofile.enterprise_account_manager')}</p>
                </div>
                <div className="vp-header-action">
                    <button className="vp-btn-outline">{t('vendorprofile.upload_photo')}</button>
                </div>
            </div>

            {/* Nav Tabs */}
            <div className="vp-nav-tabs">
                <div className="vp-tab active">{t('vendorprofile.personal_information_tab')}</div>
            </div>

            {/* Main Content Grid */}
            <div className="vp-content-grid">
                
                {/* Left Column */}
                <div className="vp-col-left">
                    {/* Personal Information Box */}
                    <div className="vp-box">
                        <h3 className="vp-box-title">{t('vendorprofile.personal_information_header')}</h3>
                        <div className="vp-form-grid">
                            <div className="vp-form-group">
                                <label>{t('vendorprofile.full_name')}</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="vp-form-group">
                                <label>{t('vendorprofile.email_address')}</label>
                                <input type="email" value={email} disabled style={{ backgroundColor: '#f9fafb', color: '#6b7280' }} />
                            </div>
                            <div className="vp-form-group">
                                <label>{t('vendorprofile.phone_number')}</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                            <div className="vp-form-group">
                                <label>{t('vendorprofile.business_name')}</label>
                                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} autoComplete="off" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="vp-col-right">
                    {/* Security Box */}
                    <div className="vp-box vp-security-box">
                        <div className="vp-security-header">
                            <h3 className="vp-box-title">{t('vendorprofile.security')}</h3>
                            <IconShield />
                        </div>
                        <div className="vp-security-content">
                            <label>{t('vendorprofile.password')}</label>
                            <p className="vp-text-muted">{t('vendorprofile.last_changed_3_months_ago')}</p>
                            
                            {!showPasswordChange ? (
                                <button className="vp-btn-outline vp-btn-full" onClick={() => setShowPasswordChange(true)}>
                                    {t('vendorprofile.change_password')}
                                </button>
                            ) : (
                                <div className="vp-password-form">
                                    <input 
                                        type="password" 
                                        placeholder={t('vendorprofile.current_password_placeholder')} 
                                        value={currentPassword} 
                                        onChange={e => setCurrentPassword(e.target.value)} 
                                        className="vp-input-sm"
                                        autoComplete="new-password"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder={t('vendorprofile.new_password_placeholder')} 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                        className="vp-input-sm"
                                        autoComplete="new-password"
                                    />
                                    <input 
                                        type="password" 
                                        placeholder={t('vendorprofile.confirm_new_password_placeholder')} 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                        className="vp-input-sm"
                                        autoComplete="new-password"
                                    />
                                    
                                    {passwordError && <p className="vp-text-error">{passwordError}</p>}
                                    {passwordSuccess && <p className="vp-text-success">{passwordSuccess}</p>}

                                    <div className="vp-password-actions">
                                        <button className="vp-btn-text" onClick={() => setShowPasswordChange(false)}>{t('vendorprofile.cancel')}</button>
                                        <button className="vp-btn-solid-sm" onClick={handleChangePassword}>{t('vendorprofile.save')}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div className="vp-footer-actions">
                <button className="vp-btn-solid" onClick={handleSaveChanges} disabled={saving}>
                    {saving ? t('vendorprofile.saving') : t('vendorprofile.save_changes')}
                </button>
            </div>
        </div>
    );
}

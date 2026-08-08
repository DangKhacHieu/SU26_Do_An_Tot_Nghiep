import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfileManager.css';

/* ─── SVG Icons ─── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconKey = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6" />
    <path d="M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');

export default function ProfileManager({ addToast, navigate }) {
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  /* form fields */
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  /* password fields */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/users/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setName(res.data.name || '');
      setPhone(res.data.phone || '');
    } catch (err) {
      addToast(err.response?.data?.message || t('profilemanager.unable_to_load_profile'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!name.trim()) { addToast(t('profilemanager.name_required'), 'error'); return; }
    if (!phone.trim()) { addToast(t('profilemanager.phone_required'), 'error'); return; }
    if (!/^\d{9,11}$/.test(phone)) { addToast(t('profilemanager.phone_invalid'), 'error'); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(`${API_BASE_URL}/users/profile/me`, { name, phone }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const updated = { ...JSON.parse(userStr), name: res.data.name, phone: res.data.phone };
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      setProfile(res.data);
      addToast(t('profilemanager.profile_updated_success'), 'success');
    } catch (err) {
      addToast(err.response?.data?.message || t('profilemanager.unable_to_update_information'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) { addToast(t('profilemanager.please_enter_your_current'), 'error'); return; }
    if (newPassword.length < 6) { addToast(t('profilemanager.new_password_min_len'), 'error'); return; }
    if (newPassword === currentPassword) { addToast(t('profilemanager.the_new_password_must'), 'error'); return; }
    if (newPassword !== confirmPassword) { addToast(t('profilemanager.confirmation_password_does_not'), 'error'); return; }

    setPasswordSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/users/change-password`, { currentPassword, newPassword, confirmPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast(t('profilemanager.change_password_success'), 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || t('profilemanager.password_change_failed'), 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mp2-loading">
        <div className="mp2-spinner" />
        <p>{t('profilemanager.loading_profile')}</p>
      </div>
    );
  }

  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase()
    : 'M';

  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="mp2-page">
      {/* ═══ HERO BANNER ═══ */}
      <div className="mp2-hero">
        <div className="mp2-hero-top">
          <div className="mp2-hero-body">
            <div className="mp2-avatar-wrap">
              <div className="mp2-avatar">{initials}</div>
              <span className="mp2-avatar-ring" />
            </div>
            <div className="mp2-hero-info">
              <h1 className="mp2-hero-name">{profile?.name}</h1>
              <p className="mp2-hero-meta">
                <span className="mp2-badge mp2-badge-role">{profile?.roleName || 'Manager'}</span>
                <span className="mp2-badge mp2-badge-active">
                  <span className="mp2-pulse" />{t('profilemanager.active')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick info chips */}
        <div className="mp2-hero-chips">
          <div className="mp2-chip">
            <IconMail />
            <span>{profile?.email || '—'}</span>
          </div>
          <div className="mp2-chip">
            <IconPhone />
            <span>{profile?.phone || '—'}</span>
          </div>
          <div className="mp2-chip">
            <IconClock />
            <span>Tham gia: {fmtDate(profile?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="mp2-tabs">
        <button
          className={`mp2-tab ${activeTab === 'info' ? 'mp2-tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <IconUser /> {t('profilemanager.personal_information')}</button>
        <button
          className={`mp2-tab ${activeTab === 'security' ? 'mp2-tab-active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <IconShield /> {t('profilemanager.security_passwords')}</button>
        <button
          className={`mp2-tab ${activeTab === 'activity' ? 'mp2-tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <IconClock /> {t('profilemanager.activity_history')}</button>
      </div>

      {/* ═══ TAB PANELS ═══ */}
      <div className="mp2-panel" key={activeTab}>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveChanges} className="mp2-form">
            <div className="mp2-section-title">
              <IconUser /> {t('profilemanager.edit_information')}</div>
            <div className="mp2-field-grid">
              <div className="mp2-field">
                <label className="mp2-label">{t('profilemanager.full_name')}</label>
                <input
                  type="text"
                  className="mp2-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('profilemanager.enter_full_name_and')}
                  required
                />
              </div>
              <div className="mp2-field">
                <label className="mp2-label">{t('profilemanager.phone_number')}</label>
                <div className="mp2-input-icon-wrap">
                  <span className="mp2-input-icon"><IconPhone /></span>
                  <input
                    type="tel"
                    className="mp2-input mp2-input-iconed"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0xxxxxxxxx"
                    required
                  />
                </div>
              </div>
              <div className="mp2-field">
                <label className="mp2-label">{t('profilemanager.email_address')}<span className="mp2-lock-tag">{t('profilemanager.cannot_be_changed')}</span></label>
                <div className="mp2-input-icon-wrap">
                  <span className="mp2-input-icon"><IconMail /></span>
                  <input
                    type="email"
                    className="mp2-input mp2-input-iconed mp2-input-locked"
                    value={profile?.email || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="mp2-field">
                <label className="mp2-label">{t('profilemanager.cccd_number')}<span className="mp2-lock-tag">{t('profilemanager.cannot_be_changed')}</span></label>
                <div className="mp2-input-icon-wrap">
                  <span className="mp2-input-icon"><IconCard /></span>
                  <input
                    type="text"
                    className="mp2-input mp2-input-iconed mp2-input-locked"
                    value={profile?.cccd || ''}
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="mp2-form-footer">
              <button type="submit" className="mp2-btn-save" disabled={saving}>
                {saving ? (
                  <><span className="mp2-btn-spinner" /> {t('profilemanager.saving')}</>
                ) : (
                  <><IconCheck /> {t('profilemanager.save_changes')}</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="mp2-form">
            <div className="mp2-section-title">
              <IconKey /> {t('profilemanager.change_password')}</div>
            <div className="mp2-security-note">
              <IconShield />
              <p>{t('profilemanager.it_is_recommended_to')}</p>
            </div>
            <div className="mp2-field-grid mp2-field-grid-1">
              {[
                { label: t('profilemanager.current_password'), val: currentPassword, set: setCurrentPassword, show: showCur, toggle: setShowCur, ac: 'current-password' },
                { label: t('profilemanager.new_password'), val: newPassword, set: setNewPassword, show: showNew, toggle: setShowNew, ac: 'new-password' },
                { label: t('profilemanager.confirm_new_password'), val: confirmPassword, set: setConfirmPassword, show: showCfm, toggle: setShowCfm, ac: 'new-password' },
              ].map(({ label, val, set, show, toggle, ac }) => (
                <div className="mp2-field" key={label}>
                  <label className="mp2-label">{label}</label>
                  <div className="mp2-pw-wrap">
                    <input
                      type={show ? 'text' : 'password'}
                      className="mp2-input mp2-input-pw"
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={ac}
                    />
                    <button type="button" className="mp2-eye-btn" onClick={() => toggle(!show)} tabIndex={-1}>
                      {show ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mp2-form-footer">
              <button type="submit" className="mp2-btn-save mp2-btn-danger" disabled={passwordSaving}>
                {passwordSaving ? (
                  <><span className="mp2-btn-spinner" /> {t('profilemanager.updating')}</>
                ) : (
                  <><IconKey /> {t('profilemanager.update_password')}</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <div className="mp2-activity">
            <div className="mp2-section-title"><IconClock /> {t('profilemanager.activity_history')}</div>
            <div className="mp2-timeline">
              <div className="mp2-tl-item">
                <div className="mp2-tl-dot mp2-tl-dot-green" />
                <div className="mp2-tl-content">
                  <span className="mp2-tl-label">{t('profilemanager.last_login')}</span>
                  <span className="mp2-tl-value">
                    {profile?.lastLogin ? fmtDate(profile.lastLogin) : t('profilemanager.current_session')}
                  </span>
                </div>
              </div>
              <div className="mp2-tl-item">
                <div className="mp2-tl-dot mp2-tl-dot-blue" />
                <div className="mp2-tl-content">
                  <span className="mp2-tl-label">{t('profilemanager.account_creation_date')}</span>
                  <span className="mp2-tl-value">{fmtDate(profile?.createdAt)}</span>
                </div>
              </div>
              <div className="mp2-tl-item">
                <div className="mp2-tl-dot mp2-tl-dot-purple" />
                <div className="mp2-tl-content">
                  <span className="mp2-tl-label">{t('profilemanager.account_status')}</span>
                  <span className="mp2-tl-value mp2-tl-value-active">
                    <span className="mp2-pulse" /> {profile?.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="mp2-tl-item">
                <div className="mp2-tl-dot mp2-tl-dot-gray" />
                <div className="mp2-tl-content">
                  <span className="mp2-tl-label">{t('profilemanager.system_role')}</span>
                  <span className="mp2-tl-value">{profile?.roleName || 'Manager'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

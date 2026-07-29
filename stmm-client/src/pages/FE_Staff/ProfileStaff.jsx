import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ProfileStaff.css';

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

export default function ProfileStaff({ userId, baseUrl, onShowNotification }) {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  const API_URL = (baseUrl || 'http://localhost:5056/api').replace(/\/api\/?$/, '') + '/api';

  const addToast = useCallback((message, type = 'info') => {
    onShowNotification(message, type === 'error' ? 'danger' : type);
  }, [onShowNotification]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/users/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setName(res.data.name || '');
      setPhone(res.data.phone || '');
    } catch (err) {
      addToast(err.response?.data?.detail || err.response?.data?.title || t('profilestaff.unable_to_load_profile'), 'error');
    } finally {
      setLoading(false);
    }
  }, [API_URL, addToast, t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, userId]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!name.trim()) { addToast(t('profilestaff.full_name_required'), 'error'); return; }
    if (!phone.trim()) { addToast(t('profilestaff.phone_required'), 'error'); return; }
    if (!/^\d{9,11}$/.test(phone)) { addToast(t('profilestaff.phone_invalid'), 'error'); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(`${API_URL}/users/profile/me`, { name, phone }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const updated = { ...JSON.parse(userStr), name: res.data.name, phone: res.data.phone };
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
      setProfile(res.data);
      addToast(t('profilestaff.profile_updated'), 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || err.response?.data?.title || t('profilestaff.unable_to_update_profile'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) { addToast(t('profilestaff.current_password_required'), 'error'); return; }
    if (newPassword.length < 6) { addToast(t('profilestaff.new_password_too_short'), 'error'); return; }
    if (newPassword === currentPassword) { addToast(t('profilestaff.new_password_must_differ'), 'error'); return; }
    if (newPassword !== confirmPassword) { addToast(t('profilestaff.password_confirmation_mismatch'), 'error'); return; }

    setPasswordSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/users/change-password`, { currentPassword, newPassword, confirmPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast(t('profilestaff.password_changed'), 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.detail || err.response?.data?.title || t('profilestaff.unable_to_change_password'), 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sp2-loading">
        <div className="sp2-spinner" />
        <p>{t('profilestaff.loading_profile')}</p>
      </div>
    );
  }

  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase()
    : 'S';

  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return new Date(d).toLocaleString();
    }
  };

  return (
    <div className="sp2-page">
      <div className="sp2-hero">
        <div className="sp2-hero-top">
          <div className="sp2-hero-body">
            <div className="sp2-avatar-wrap">
              <div className="sp2-avatar">{initials}</div>
              <span className="sp2-avatar-ring" />
            </div>
            <div className="sp2-hero-info">
              <h1 className="sp2-hero-name">{profile?.name}</h1>
              <p className="sp2-hero-meta">
                <span className="sp2-badge sp2-badge-role">{profile?.roleName || t('profilestaff.staff')}</span>
                <span className="sp2-badge sp2-badge-active">
                  <span className="sp2-pulse" />{t('profilestaff.active')}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="sp2-hero-chips">
          <div className="sp2-chip">
            <IconMail />
            <span>{profile?.email || '—'}</span>
          </div>
          <div className="sp2-chip">
            <IconPhone />
            <span>{profile?.phone || '—'}</span>
          </div>
          <div className="sp2-chip">
            <IconClock />
            <span>{t('profilestaff.joined')}: {fmtDate(profile?.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="sp2-tabs">
        <button
          className={`sp2-tab ${activeTab === 'info' ? 'sp2-tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <IconUser /> {t('profilestaff.personal_information')}</button>
        <button
          className={`sp2-tab ${activeTab === 'security' ? 'sp2-tab-active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <IconShield /> {t('profilestaff.security_password')}</button>
        <button
          className={`sp2-tab ${activeTab === 'activity' ? 'sp2-tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <IconClock /> {t('profilestaff.account_activity')}</button>
      </div>

      <div className="sp2-panel" key={activeTab}>

        {activeTab === 'info' && (
          <form onSubmit={handleSaveChanges} className="sp2-form">
            <div className="sp2-section-title">
              <IconUser /> {t('profilestaff.edit_information')}</div>
            <div className="sp2-field-grid">
              <div className="sp2-field">
                <label className="sp2-label">{t('profilestaff.full_name')}</label>
                <input
                  type="text"
                  className="sp2-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('profilestaff.enter_your_full_name')}
                  required
                />
              </div>
              <div className="sp2-field">
                <label className="sp2-label">{t('profilestaff.phone_number')}</label>
                <div className="sp2-input-icon-wrap">
                  <span className="sp2-input-icon"><IconPhone /></span>
                  <input
                     type="tel"
                     className="sp2-input sp2-input-iconed"
                     value={phone}
                     onChange={e => setPhone(e.target.value)}
                     placeholder={t('profilestaff.0xxxxxxxxx')}
                     required
                  />
                </div>
              </div>
              <div className="sp2-field">
                <label className="sp2-label">{t('profilestaff.email_address')}<span className="sp2-lock-tag">{t('profilestaff.read_only')}</span></label>
                <div className="sp2-input-icon-wrap">
                  <span className="sp2-input-icon"><IconMail /></span>
                  <input
                    type="email"
                    className="sp2-input sp2-input-iconed sp2-input-locked"
                    value={profile?.email || ''}
                    disabled
                  />
                </div>
              </div>
              <div className="sp2-field">
                <label className="sp2-label">{t('profilestaff.identity_number')}<span className="sp2-lock-tag">{t('profilestaff.read_only')}</span></label>
                <div className="sp2-input-icon-wrap">
                  <span className="sp2-input-icon"><IconCard /></span>
                  <input
                    type="text"
                    className="sp2-input sp2-input-iconed sp2-input-locked"
                    value={profile?.cccd || ''}
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="sp2-form-footer">
              <button type="submit" className="sp2-btn-save" disabled={saving}>
                {saving ? (
                  <><span className="sp2-btn-spinner" /> {t('profilestaff.saving')}</>
                ) : (
                  <><IconCheck /> {t('profilestaff.save_changes')}</>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="sp2-form">
            <div className="sp2-section-title">
              <IconKey /> {t('profilestaff.change_password')}</div>
            <div className="sp2-security-note">
              <IconShield />
              <p>{t('profilestaff.use_a_unique_password')}</p>
            </div>
            <div className="sp2-field-grid mp2-field-grid-1">
              {[
                { label: t('profilestaff.current_password'), val: currentPassword, set: setCurrentPassword, show: showCur, toggle: setShowCur, ac: 'current-password' },
                { label: t('profilestaff.new_password'), val: newPassword, set: setNewPassword, show: showNew, toggle: setShowNew, ac: 'new-password' },
                { label: t('profilestaff.confirm_new_password'), val: confirmPassword, set: setConfirmPassword, show: showCfm, toggle: setShowCfm, ac: 'new-password' },
              ].map(({ label, val, set, show, toggle, ac }) => (
                <div className="sp2-field" key={label}>
                  <label className="sp2-label">{label}</label>
                  <div className="sp2-pw-wrap">
                    <input
                      type={show ? 'text' : 'password'}
                      className="sp2-input sp2-input-pw"
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={ac}
                    />
                    <button type="button" className="sp2-eye-btn" onClick={() => toggle(!show)} tabIndex={-1}>
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
            <div className="sp2-form-footer">
              <button type="submit" className="sp2-btn-save sp2-btn-danger" disabled={passwordSaving}>
                {passwordSaving ? (
                  <><span className="sp2-btn-spinner" /> {t('profilestaff.updating')}</>
                ) : (
                  <><IconKey /> {t('profilestaff.update_password')}</>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'activity' && (
          <div className="sp2-activity">
            <div className="sp2-section-title"><IconClock /> {t('profilestaff.account_activity')}</div>
            <div className="sp2-timeline">
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-green" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">{t('profilestaff.last_login')}</span>
                  <span className="sp2-tl-value">
                    {profile?.lastLogin ? fmtDate(profile.lastLogin) : t('profilestaff.current_session')}
                  </span>
                </div>
              </div>
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-blue" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">{t('profilestaff.account_created')}</span>
                  <span className="sp2-tl-value">{fmtDate(profile?.createdAt)}</span>
                </div>
              </div>
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-purple" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">{t('profilestaff.account_status')}</span>
                  <span className="sp2-tl-value sp2-tl-value-active">
                    <span className="sp2-pulse" /> {profile?.status || t('profilestaff.active')}
                  </span>
                </div>
              </div>
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-gray" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">{t('profilestaff.system_role')}</span>
                  <span className="sp2-tl-value">{profile?.roleName || t('profilestaff.staff')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

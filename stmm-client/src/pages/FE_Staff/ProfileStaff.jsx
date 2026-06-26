import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfileStaff.css';

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

export default function ProfileStaff({ userId, baseUrl, onShowNotification }) {
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

  const API_URL = (baseUrl || 'http://localhost:5056').replace(/\/api\/?$/, '') + '/api';

  const addToast = (message, type = 'info') => {
    onShowNotification(message, type === 'error' ? 'danger' : type);
  };

  useEffect(() => { fetchProfile(); }, [userId]);

  const fetchProfile = async () => {
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
      addToast(err.response?.data?.message || 'Không thể tải thông tin hồ sơ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!name.trim()) { addToast('Họ và tên không được để trống.', 'error'); return; }
    if (!phone.trim()) { addToast('Số điện thoại không được để trống.', 'error'); return; }
    if (!/^\d{9,11}$/.test(phone)) { addToast('Số điện thoại phải chứa từ 9 đến 11 chữ số.', 'error'); return; }

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
      addToast('Cập nhật thông tin cá nhân thành công!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Không thể cập nhật thông tin.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) { addToast('Vui lòng nhập mật khẩu hiện tại.', 'error'); return; }
    if (newPassword.length < 6) { addToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error'); return; }
    if (newPassword === currentPassword) { addToast('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'error'); return; }
    if (newPassword !== confirmPassword) { addToast('Mật khẩu xác nhận không trùng khớp.', 'error'); return; }

    setPasswordSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/users/change-password`, { currentPassword, newPassword, confirmPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Đổi mật khẩu thành công!', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Đổi mật khẩu thất bại.', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sp2-loading">
        <div className="sp2-spinner" />
        <p>Đang tải hồ sơ…</p>
      </div>
    );
  }

  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase()
    : 'S';

  const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="sp2-page">
      {/* ═══ HERO BANNER ═══ */}
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
                <span className="sp2-badge sp2-badge-role">{profile?.roleName || 'Staff'}</span>
                <span className="sp2-badge sp2-badge-active">
                  <span className="sp2-pulse" />Đang hoạt động
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick info chips */}
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
            <span>Tham gia: {fmtDate(profile?.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="sp2-tabs">
        <button
          className={`sp2-tab ${activeTab === 'info' ? 'sp2-tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <IconUser /> Thông tin cá nhân
        </button>
        <button
          className={`sp2-tab ${activeTab === 'security' ? 'sp2-tab-active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <IconShield /> Bảo mật & Mật khẩu
        </button>
        <button
          className={`sp2-tab ${activeTab === 'activity' ? 'sp2-tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <IconClock /> Lịch sử hoạt động
        </button>
      </div>

      {/* ═══ TAB PANELS ═══ */}
      <div className="sp2-panel" key={activeTab}>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveChanges} className="sp2-form">
            <div className="sp2-section-title">
              <IconUser /> Chỉnh sửa thông tin
            </div>
            <div className="sp2-field-grid">
              <div className="sp2-field">
                <label className="sp2-label">Họ và tên</label>
                <input
                  type="text"
                  className="sp2-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                />
              </div>
              <div className="sp2-field">
                <label className="sp2-label">Số điện thoại</label>
                <div className="sp2-input-icon-wrap">
                  <span className="sp2-input-icon"><IconPhone /></span>
                  <input
                    type="tel"
                    className="sp2-input sp2-input-iconed"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0xxxxxxxxx"
                    required
                  />
                </div>
              </div>
              <div className="sp2-field">
                <label className="sp2-label">Địa chỉ Email <span className="sp2-lock-tag">Không thể thay đổi</span></label>
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
                <label className="sp2-label">Số CCCD <span className="sp2-lock-tag">Không thể thay đổi</span></label>
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
                  <><span className="sp2-btn-spinner" /> Đang lưu…</>
                ) : (
                  <><IconCheck /> Lưu thay đổi</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="sp2-form">
            <div className="sp2-section-title">
              <IconKey /> Đổi mật khẩu
            </div>
            <div className="sp2-security-note">
              <IconShield />
              <p>Nên thay đổi mật khẩu định kỳ để bảo vệ tài khoản nhân viên của bạn.</p>
            </div>
            <div className="sp2-field-grid mp2-field-grid-1">
              {[
                { label: 'Mật khẩu hiện tại', val: currentPassword, set: setCurrentPassword, show: showCur, toggle: setShowCur, ac: 'current-password' },
                { label: 'Mật khẩu mới', val: newPassword, set: setNewPassword, show: showNew, toggle: setShowNew, ac: 'new-password' },
                { label: 'Xác nhận mật khẩu mới', val: confirmPassword, set: setConfirmPassword, show: showCfm, toggle: setShowCfm, ac: 'new-password' },
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
                  <><span className="sp2-btn-spinner" /> Đang cập nhật…</>
                ) : (
                  <><IconKey /> Cập nhật mật khẩu</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <div className="sp2-activity">
            <div className="sp2-section-title"><IconClock /> Lịch sử hoạt động</div>
            <div className="sp2-timeline">
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-green" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">Lần đăng nhập gần nhất</span>
                  <span className="sp2-tl-value">
                    {profile?.lastLogin ? fmtDate(profile.lastLogin) : 'Phiên hiện tại'}
                  </span>
                </div>
              </div>
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-blue" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">Ngày tạo tài khoản</span>
                  <span className="sp2-tl-value">{fmtDate(profile?.createdAt)}</span>
                </div>
              </div>
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-purple" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">Trạng thái tài khoản</span>
                  <span className="sp2-tl-value sp2-tl-value-active">
                    <span className="sp2-pulse" /> {profile?.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="sp2-tl-item">
                <div className="sp2-tl-dot sp2-tl-dot-gray" />
                <div className="sp2-tl-content">
                  <span className="sp2-tl-label">Vai trò hệ thống</span>
                  <span className="sp2-tl-value">{profile?.roleName || 'Staff'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

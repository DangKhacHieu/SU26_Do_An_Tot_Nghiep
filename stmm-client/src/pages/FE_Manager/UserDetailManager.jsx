import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import './UserDetailManager.css';

const API_BASE = "http://localhost:5056/api/manager/users";

/* ── Role config ── */
const ROLE_CONFIG = {
  staff:      { color: '#2563eb', bg: '#dbeafe', label: 'Staff' },
  accountant: { color: '#7c3aed', bg: '#f3e8ff', label: 'Accountant' },
  vendor:     { color: '#0f766e', bg: '#ccfbf1', label: 'Vendor' },
  customer:   { color: '#d97706', bg: '#fef9c3', label: 'Customer' },
  manager:    { color: '#dc2626', bg: '#fee2e2', label: 'Manager' },
  admin:      { color: '#0f172a', bg: '#f1f5f9', label: 'Admin' },
};

/* ── Status config ── */
const STATUS_CONFIG = {
  active:    { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', dot: '#16a34a', label: 'Hoạt động' },
  locked:    { color: '#dc2626', bg: '#fee2e2', border: '#fecaca', dot: '#dc2626', label: 'Bị khóa' },
  suspended: { color: '#d97706', bg: '#fef9c3', border: '#fde68a', dot: '#d97706', label: 'Tạm dừng' },
};

/* ── Validation rules (để hiển thị trạng thái dữ liệu) ── */
const validateField = (key, value, t) => {
  switch (key) {
    case 'name':
      if (!value || !value.trim()) return { ok: false, msg: 'Họ và tên bị trống.' };
      if (value.trim().length < 2)  return { ok: false, msg: 'Tên quá ngắn (tối thiểu 2 ký tự).' };
      if (value.trim().length > 100) return { ok: false, msg: 'Tên quá dài (tối đa 100 ký tự).' };
      return { ok: true, msg: 'Hợp lệ' };

    case 'email':
      if (!value || !value.trim()) return { ok: false, msg: 'Email bị trống.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, msg: 'Định dạng email không hợp lệ.' };
      return { ok: true, msg: 'Hợp lệ' };

    case 'phone':
      if (!value || !value.trim()) return { ok: false, msg: 'Số điện thoại bị trống.' };
      if (!/^\d{10,11}$/.test(value)) return { ok: false, msg: 'SĐT phải có 10–11 chữ số.' };
      return { ok: true, msg: 'Hợp lệ' };

    case 'cccd':
      if (!value || !value.trim()) return { ok: false, msg: 'Số CCCD bị trống.' };
      if (!/^\d{12}$/.test(value)) return { ok: false, msg: 'CCCD phải đúng 12 chữ số.' };
      return { ok: true, msg: 'Hợp lệ' };

    default:
      return { ok: true, msg: '' };
  }
};

/* ── Icons ── */
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconWarn = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const fmt = (dt) =>
  dt ? new Date(dt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : null;

const timeAgo = (dt, t) => {
  if (!dt) return null;
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Vừa xong';
  if (mins < 60) return '${mins} phút trước';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return '${hrs} giờ trước';
  const days = Math.floor(hrs / 24);
  if (days < 30) return '${days} ngày trước';
  return fmt(dt);
};

/* ── Main component ── */
export default function UserDetailManager({ userId, navigate, addToast }) {
  const { t } = useTranslation();

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${userId}`);
      if (res.ok) setUser(await res.json());
      else { addToast('Không tìm thấy tài khoản.', 'error'); navigate('users'); }
    } catch { addToast('Lỗi kết nối khi tải hồ sơ.', 'error'); navigate('users'); }
    finally { setLoading(false); }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="udetail-wrap">
        <div className="udetail-loading">
          <div className="udetail-spinner" />
          <p>{t('userdetailmanager.loading_account_profile')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleKey   = (user.roleName || '').toLowerCase();
  const statusKey = (user.status   || '').toLowerCase();
  const roleCfg   = ROLE_CONFIG[roleKey]   || { color: '#64748b', bg: '#f1f5f9', label: user.roleName || '—' };
  const statusCfg = STATUS_CONFIG[statusKey] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', dot: '#64748b', label: user.status || '—' };

  /* Data validation check */
  const validations = {
    name:  validateField('name',  user.name, t),
    email: validateField('email', user.email, t),
    phone: validateField('phone', user.phone, t),
    cccd:  validateField('cccd',  user.cccd, t),
  };
  const hasIssues = Object.values(validations).some(v => !v.ok);

  /* Avatar initials */
  const initials = (user.name || '?').trim().split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

  return (
    <div className="udetail-wrap">

      {/* ── TOP ACTION BAR ── */}
      <div className="udetail-topbar">
        <button className="udetail-btn-back" onClick={() => navigate('users')}>
          <IconArrow /> {t('userdetailmanager.back_to_the_list')}</button>
        <div className="udetail-topbar-right">
          <button className="udetail-btn-reload" onClick={load} title={t('userdetailmanager.reload')}>
            <IconRefresh /> {t('userdetailmanager.reload')}</button>
          <button className="udetail-btn-edit" onClick={() => navigate('form', user.userId)}>
            <IconEdit /> {t('userdetailmanager.edit')}</button>
        </div>
      </div>

      {/* ── DATA VALIDATION BANNER ── */}
      {hasIssues && (
        <div className="udetail-alert-banner">
          <IconWarn />
          <div>
            <strong>{t('userdetailmanager.data_to_check')}</strong> Tài khoản này có {Object.values(validations).filter(v => !v.ok).length} trường không hợp lệ.
            <button className="udetail-alert-toggle" onClick={() => setShowValidation(v => !v)}>
              {showValidation ? t('userdetailmanager.hide_details') : t('userdetailmanager.see_details')}
            </button>
          </div>
        </div>
      )}
      {!hasIssues && (
        <div className="udetail-ok-banner">
          <IconCheck />
          <span>{t('userdetailmanager.account_data_is_valid')}</span>
        </div>
      )}

      {/* Validation detail panel */}
      {showValidation && hasIssues && (
        <div className="udetail-validation-panel">
          <p className="udetail-vp-title">{t('userdetailmanager.detailed_test_data')}</p>
          <div className="udetail-vp-list">
            {Object.entries(validations).map(([key, v]) => {
              const labels = { name: t('userdetailmanager.full_name'), email: 'Email', phone: t('userdetailmanager.phone_number'), cccd: t('userdetailmanager.cccd_number') };
              return (
                <div key={key} className={`udetail-vp-row ${v.ok ? 'ok' : 'fail'}`}>
                  <span className="udetail-vp-icon">{v.ok ? <IconCheck /> : <IconWarn />}</span>
                  <span className="udetail-vp-label">{labels[key]}</span>
                  <span className="udetail-vp-msg">{v.ok ? t('userdetailmanager.valid') : v.msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PROFILE HERO ── */}
      <div className="udetail-hero" style={{ '--role-color': roleCfg.color }}>
        <div className="udetail-hero-bg" />
        <div className="udetail-hero-content">
          {/* Avatar */}
          <div
            className="udetail-avatar"
            style={{ background: roleCfg.color }}
          >
            {initials}
          </div>

          {/* Identity */}
          <div className="udetail-identity">
            <h2 className="udetail-fullname">{user.name}</h2>
            <p className="udetail-uid">ID tài khoản: {user.userId}</p>
            <div className="udetail-badges">
              <span className="udetail-badge-role" style={{ color: roleCfg.color, background: roleCfg.bg }}>
                {roleCfg.label}
              </span>
              <span
                className="udetail-badge-status"
                style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
              >
                <span className="udetail-status-dot" style={{ background: statusCfg.dot }} />
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO GRID ── */}
      <div className="udetail-grid">

        {/* Card: Thông tin cá nhân */}
        <div className="udetail-card">
          <div className="udetail-card-header">
            <span className="udetail-card-icon"><IconUser /></span>
            <span className="udetail-card-title">{t('userdetailmanager.personal_information')}</span>
          </div>
          <div className="udetail-card-body">

            <FieldRow
              label={t('userdetailmanager.full_name')}
              value={user.name}
              validation={validations.name}
              showValidation
            />
            <FieldRow
              label={t('userdetailmanager.cccd_number')}
              value={user.cccd}
              mono
              validation={validations.cccd}
              showValidation
            />
            <FieldRow
              label={t('userdetailmanager.email_address')}
              value={user.email}
              validation={validations.email}
              showValidation
            />
            <FieldRow
              label={t('userdetailmanager.phone_number')}
              value={user.phone}
              validation={validations.phone}
              showValidation
            />

          </div>
        </div>

        {/* Card: Phân quyền & Trạng thái */}
        <div className="udetail-card">
          <div className="udetail-card-header">
            <span className="udetail-card-icon"><IconShield /></span>
            <span className="udetail-card-title">{t('userdetailmanager.authorization_status')}</span>
          </div>
          <div className="udetail-card-body">

            <div className="udetail-field">
              <span className="udetail-flabel">{t('userdetailmanager.system_role')}</span>
              <span className="udetail-fvalue">
                <span className="udetail-badge-role" style={{ color: roleCfg.color, background: roleCfg.bg }}>
                  {roleCfg.label}
                </span>
              </span>
            </div>

            <div className="udetail-field">
              <span className="udetail-flabel">{t('userdetailmanager.account_status')}</span>
              <span className="udetail-fvalue">
                <span
                  className="udetail-badge-status"
                  style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
                >
                  <span className="udetail-status-dot" style={{ background: statusCfg.dot }} />
                  {statusCfg.label}
                </span>
              </span>
            </div>

            {user.roleDescription && (
              <div className="udetail-field udetail-field-full">
                <span className="udetail-flabel">{t('userdetailmanager.description_of_powers')}</span>
                <p className="udetail-desc">{user.roleDescription}</p>
              </div>
            )}

          </div>
        </div>

        {/* Card: Lịch sử hoạt động — full width */}
        <div className="udetail-card udetail-card-full">
          <div className="udetail-card-header">
            <span className="udetail-card-icon"><IconClock /></span>
            <span className="udetail-card-title">{t('userdetailmanager.activity_history')}</span>
          </div>
          <div className="udetail-card-body udetail-timeline-grid">

            <TimelineItem
              label={t('userdetailmanager.account_creation_date')}
              date={fmt(user.createdAt)}
              ago={timeAgo(user.createdAt, t)}
              empty={t('userdetailmanager.no_information_yet')}
            />
            <TimelineItem
              label={t('userdetailmanager.most_recent_update')}
              date={fmt(user.updatedAt)}
              ago={timeAgo(user.updatedAt, t)}
              empty={t('userdetailmanager.never_updated')}
            />
            <TimelineItem
              label={t('userdetailmanager.most_recent_login')}
              date={fmt(user.lastLogin)}
              ago={timeAgo(user.lastLogin, t)}
              empty={t('userdetailmanager.never_logged_in')}
            />

          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ── */
function FieldRow({ label, value, mono, validation, showValidation }) {
  const isEmpty = !value || !String(value).trim();
  const valid   = validation ? validation.ok : true;

  return (
    <div className={`udetail-field ${showValidation && !valid ? 'udetail-field--warn' : ''}`}>
      <span className="udetail-flabel">
        {label}
        {showValidation && (
          <span className={`udetail-vbadge ${valid ? 'ok' : 'fail'}`}>
            {valid ? <IconCheck /> : <IconWarn />}
          </span>
        )}
      </span>
      <span className={`udetail-fvalue ${mono ? 'mono' : ''} ${isEmpty ? 'empty' : ''}`}>
        {isEmpty ? '—' : value}
      </span>
      {showValidation && !valid && (
        <span className="udetail-ferror">{validation.msg}</span>
      )}
    </div>
  );
}

function TimelineItem({ label, date, ago, empty }) {
  return (
    <div className="udetail-timeline-item">
      <span className="udetail-tl-label">{label}</span>
      {date ? (
        <>
          <span className="udetail-tl-date">{date}</span>
          <span className="udetail-tl-ago">{ago}</span>
        </>
      ) : (
        <span className="udetail-tl-empty">{empty}</span>
      )}
    </div>
  );
}

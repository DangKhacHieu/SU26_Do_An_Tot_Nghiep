import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import './UserFormManager.css';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/manager/users`;

/* ── Icons ── */
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconOk = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconErr = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ── Password strength scorer ── */
const getStrength = (pw) => {
  if (!pw) return { score: 0, key: '', color: '' };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw))    score++;
  if (/[^A-Za-z\d]/.test(pw)) score++;
  if (score <= 1) return { score, key: 'too_weak', color: '#ef4444' };
  if (score === 2) return { score, key: 'weak',    color: '#f97316' };
  if (score === 3) return { score, key: 'medium', color: '#eab308' };
  if (score === 4) return { score, key: 'strong',   color: '#22c55e' };
  return { score, key: 'very_strong', color: '#16a34a' };
};

export default function UserFormManager({ userId, navigate, addToast }) {
  const { t } = useTranslation();

  /* ── Validation rules ── */
  const RULES = {
    name: (v) => {
      if (!v || !v.trim())        return t('userformmanager.full_name_cannot_be');
      if (v.trim().length < 2)    return t('userformmanager.name_is_too_short');
      if (v.trim().length > 100)  return t('userformmanager.name_is_too_long');
      if (/\d/.test(v))           return t('userformmanager.names_cannot_contain_numbers');
      return '';
    },
    email: (v) => {
      if (!v || !v.trim())                           return t('userformmanager.email_cannot_be_blank');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return t('userformmanager.invalid_email_address_eg');
      return '';
    },
    phone: (v) => {
      if (!v || !v.trim())       return t('userformmanager.phone_number_cannot_be');
      if (/\D/.test(v))          return t('userformmanager.phone_numbers_must_contain');
      if (!/^\d{10,11}$/.test(v)) return t('userformmanager.the_phone_number_must');
      if (!/^(0[35789]\d{8}|0[1-9]\d{9})$/.test(v)) return t('userformmanager.the_phone_number_is');
      return '';
    },
    cccd: (v) => {
      if (!v || !v.trim())        return t('userformmanager.cccd_number_cannot_be');
      if (/\D/.test(v))           return t('userformmanager.cccd_must_contain_only');
      if (!/^\d{12}$/.test(v))    return t('userformmanager.cccd_must_have_exactly');
      return '';
    },
    roleId: (v) => {
      if (!v) return t('userformmanager.please_select_a_role');
      return '';
    },
    password: (v, isEdit) => {
      if (!isEdit && (!v || !v.trim())) return t('userformmanager.password_cannot_be_blank');
      if (v && v.length < 6)            return t('userformmanager.password_must_have_at');
      if (v && v.length > 64)           return t('userformmanager.password_must_not_exceed');
      if (v && !/[A-Za-z]/.test(v))    return t('userformmanager.password_should_have_at');
      return '';
    },
  };

  const isEdit  = !!userId;
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [touched, setTouched]       = useState({});     // which fields the user interacted with
  const [submitted, setSubmitted]   = useState(false);  // true after first submit attempt

  const [form, setForm] = useState({
    name: '', email: '', phone: '', cccd: '',
    roleId: '', status: 'Active', password: '',
  });

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    try {
      const rolesRes = await fetch(`${API_BASE}/roles`);
      let rolesList = [];
      if (rolesRes.ok) { rolesList = await rolesRes.json(); setRoles(rolesList); }

      if (isEdit) {
        const userRes = await fetch(`${API_BASE}/${userId}`);
        if (userRes.ok) {
          const u = await userRes.json();
          setForm({ name: u.name, email: u.email, phone: u.phone, cccd: u.cccd || '',
                    roleId: u.roleId.toString(), status: u.status, password: '' });
        } else { addToast(t('userformmanager.unable_to_load_account'), 'error'); navigate('users'); }
      } else if (rolesList.length > 0) {
        setForm(prev => ({ ...prev, roleId: rolesList[0].roleId.toString() }));
      }
    } catch { addToast(t('userformmanager.connection_error_when_loading'), 'error'); }
    finally { setLoading(false); }
  };

  /* Update field + mark as touched */
  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  /* Compute errors for current form state */
  const getErrors = () => ({
    name:     RULES.name(form.name),
    email:    RULES.email(form.email),
    phone:    RULES.phone(form.phone),
    cccd:     RULES.cccd(form.cccd),
    roleId:   RULES.roleId(form.roleId),
    password: RULES.password(form.password, isEdit),
  });

  /* Show error if field is touched OR form was submitted */
  const showErr = (key) => (touched[key] || submitted) ? getErrors()[key] : '';

  const isFieldOk  = (key) => !!(touched[key] || submitted) && !getErrors()[key];
  const isFieldErr = (key) => !!(touched[key] || submitted) &&  !!getErrors()[key];

  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = getErrors();
    if (Object.values(errs).some(Boolean)) {
      addToast(t('userformmanager.please_check_the_error'), 'error');
      return;
    }

    const payload = {
      roleId: parseInt(form.roleId),
      name: form.name.trim(), email: form.email.trim(),
      phone: form.phone.trim(), cccd: form.cccd.trim(),
      status: form.status,
      ...(form.password ? { password: form.password } : {}),
    };

    setSubmitting(true);
    try {
      const url = isEdit ? `${API_BASE}/${userId}` : API_BASE;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        addToast(isEdit ? t('userformmanager.account_updated_successfully') : t('userformmanager.account_registration_successful'), 'success');
        navigate('users');
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || err.title || t('userformmanager.error_when_saving_account'), 'error');
      }
    } catch { addToast(t('userformmanager.unable_to_connect_to'), 'error'); }
    finally { setSubmitting(false); }
  };

  /* Count errors to show summary */
  const totalErrors = submitted ? Object.values(getErrors()).filter(Boolean).length : 0;

  if (loading) {
    return (
      <div className="form-page-wrap">
        <div className="form-card">
          <div className="form-loading">
            <div className="spinner" />
            {t('userformmanager.loading_account_information')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-wrap">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-card">

          {/* ── Header ── */}
          <div className="form-card-header">
            <div>
              <h2>{isEdit ? t('userformmanager.edit_account') : t('userformmanager.register_a_new_account')}</h2>
              <p className="form-card-sub">
                {isEdit
                  ? t('userformmanager.update_member_account_information')
                  : t('userformmanager.fill_in_all_information')}
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => navigate('users')}>
              <IconArrow /> {t('userformmanager.come_back')}</button>
          </div>

          {/* ── Error summary banner ── */}
          {totalErrors > 0 && (
            <div className="form-error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{t('userformmanager.there_are')} <strong>{totalErrors}</strong> {t('userformmanager.invalid_fields_please_check')}</span>
            </div>
          )}

          {/* ── Body ── */}
          <div className="form-card-body">

            {/* Section: Thông tin cá nhân */}
            <div className="form-section">
              <p className="form-section-label">{t('userformmanager.personal_information')}</p>

              <div className="form-row">
                {/* Họ và tên */}
                <FormField
                  label={t('userformmanager.full_name')} required
                  hint={t('userformmanager.full_name_no_numbers')}
                  ok={isFieldOk('name')} err={showErr('name')}
                >
                  <input
                    type="text"
                    className={`form-control ${isFieldErr('name') ? 'is-error' : isFieldOk('name') ? 'is-ok' : ''}`}
                    placeholder={t('userformmanager.nguyen_van_a')}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    onBlur={() => setTouched(p => ({ ...p, name: true }))}
                  />
                </FormField>

                {/* Số CCCD */}
                <FormField
                  label={t('userformmanager.cccd_number')} required
                  hint={t('userformmanager.12_digits_no_letters')}
                  ok={isFieldOk('cccd')} err={showErr('cccd')}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    className={`form-control ${isFieldErr('cccd') ? 'is-error' : isFieldOk('cccd') ? 'is-ok' : ''}`}
                    placeholder="012345678901"
                    value={form.cccd}
                    onChange={(e) => set('cccd', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    onBlur={() => setTouched(p => ({ ...p, cccd: true }))}
                  />
                </FormField>
              </div>

              <div className="form-row">
                {/* Số điện thoại */}
                <FormField
                  label={t('userformmanager.phone_number')} required
                  hint={t('userformmanager.1011_digits_vietnamese_prefix')}
                  ok={isFieldOk('phone')} err={showErr('phone')}
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    className={`form-control ${isFieldErr('phone') ? 'is-error' : isFieldOk('phone') ? 'is-ok' : ''}`}
                    placeholder="0912345678"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    onBlur={() => setTouched(p => ({ ...p, phone: true }))}
                  />
                </FormField>

                {/* Email */}
                <FormField
                  label={t('userformmanager.login_email')} required
                  hint={isEdit ? t('userformmanager.email_cannot_be_changed') : t('userformmanager.used_to_log_into')}
                  ok={!isEdit && isFieldOk('email')} err={!isEdit ? showErr('email') : ''}
                >
                  <input
                    type="email"
                    className={`form-control ${!isEdit && isFieldErr('email') ? 'is-error' : !isEdit && isFieldOk('email') ? 'is-ok' : ''}`}
                    placeholder="example@gmail.com"
                    value={form.email}
                    disabled={isEdit}
                    onChange={(e) => set('email', e.target.value)}
                    onBlur={() => setTouched(p => ({ ...p, email: true }))}
                  />
                </FormField>
              </div>
            </div>

            {/* Section: Phân quyền & Bảo mật */}
            <div className="form-section">
              <p className="form-section-label">{t('userformmanager.decentralization_security')}</p>

              <div className="form-row">
                {/* Vai trò */}
                <FormField
                  label={t('userformmanager.system_role')} required
                  hint={t('userformmanager.determine_account_access_rights')}
                  ok={isFieldOk('roleId')} err={showErr('roleId')}
                >
                  <select
                    className={`form-control ${isFieldErr('roleId') ? 'is-error' : isFieldOk('roleId') ? 'is-ok' : ''}`}
                    value={form.roleId}
                    onChange={(e) => set('roleId', e.target.value)}
                    onBlur={() => setTouched(p => ({ ...p, roleId: true }))}
                  >
                    <option value="">{t('userformmanager.select_role')}</option>
                    {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.name}</option>)}
                  </select>
                </FormField>

                {/* Trạng thái (chỉ khi edit) */}
                {isEdit ? (
                  <FormField label={t('userformmanager.operating_status')} hint={t('userformmanager.update_account_status')}>
                    <select
                      className="form-control"
                      value={form.status}
                      onChange={(e) => set('status', e.target.value)}
                    >
                      <option value="Active">{t('userformmanager.active_active')}</option>
                      <option value="Locked">{t('userformmanager.locked_locked')}</option>
                      <option value="Suspended">{t('userformmanager.suspended_suspended')}</option>
                    </select>
                  </FormField>
                ) : <div />}
              </div>

              {/* Mật khẩu */}
              <div className="form-row-single">
                <FormField
                  label={isEdit ? t('userformmanager.new_password_leave_blank') : t('userformmanager.password')}
                  required={!isEdit}
                  hint={isEdit ? t('userformmanager.only_fill_in_if') : t('userformmanager.minimum_6_characters_should')}
                  ok={isFieldOk('password')} err={showErr('password')}
                >
                  <div className="pw-input-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={`form-control pw-input ${isFieldErr('password') ? 'is-error' : isFieldOk('password') ? 'is-ok' : ''}`}
                      placeholder={isEdit ? t('userformmanager.enter_a_new_password') : t('userformmanager.minimum_6_characters')}
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      onBlur={() => setTouched(p => ({ ...p, password: true }))}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      {showPw ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {form.password && (
                    <div className="pw-strength">
                      <div className="pw-strength-bars">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className="pw-bar"
                            style={{ background: i <= strength.score ? strength.color : '#e2e8f0' }}
                          />
                        ))}
                      </div>
                      <span className="pw-strength-label" style={{ color: strength.color }}>
                        {strength.key ? t(`userformmanager.${strength.key}`) : ''}
                      </span>
                    </div>
                  )}
                </FormField>
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={() => navigate('users')}>
              {t('userformmanager.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <IconSave />
              {submitting ? t('userformmanager.saving') : isEdit ? t('userformmanager.save_changes') : t('userformmanager.create_an_account')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ── FormField wrapper ── */
function FormField({ label, required, hint, ok, err, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="req"> *</span>}
        {ok  && <span className="field-ok-badge"><IconOk /></span>}
        {err && <span className="field-err-badge"><IconErr /></span>}
      </label>
      {children}
      {err  && <span className="form-error-msg"><IconErr />{err}</span>}
      {!err && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

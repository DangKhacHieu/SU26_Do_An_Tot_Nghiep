import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Save, 
  Shield, 
  MapPin, 
  Briefcase, 
  RefreshCw, 
  AlertTriangle,
  AlertCircle,
  X,
  CreditCard
} from 'lucide-react';


export default function ProfileManagement() {
  const { t } = useTranslation();

  // Profile state
  const [profile, setProfile] = useState({
    userId: 1,
    name: t('profilemanagement.le_thanh_binh'),
    email: 'binhlt.accountant@stmm.vn',
    phone: '0987 654 321',
    cccd: '001095009876',
    roleName: t('profilemanagement.professional_accountant'),
    department: t('profilemanagement.finance_accounting_department'),
    office: t('profilemanagement.3rd_floor_stmm_executive')
  });

  // Password state
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'confirm_profile' | 'confirm_password'
  const [notification, setNotification] = useState(null); // { type: 'success' | 'danger' | 'warning', message: '' }
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    setModalError(null);
  }, [activeModal]);

  // Temporary state for form editing before confirmation
  const [tempProfile, setTempProfile] = useState({ ...profile });

  // Custom notification trigger
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load Accountant Profile
  const loadProfile = () => {
    setLoading(true);
    setIsMock(false);

    // Retrieve user session info from localStorage
    const session = localStorage.getItem('user');
    let currentUserId = 1;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        currentUserId = parsed.userId || 1;
      } catch (e) {
        console.error(t('profilemanagement.error_parsing_session_in'), e);
      }
    }

    // Fetch profile of accountant dynamically using logged-in user id
    fetch(`http://localhost:5056/api/accountant/profile?userId=${currentUserId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(res => {
        if (!res.ok) throw new Error(t('profilemanagement.unable_to_load_user'));
        return res.json();
      })
      .then(data => {
        const mergedProfile = {
          ...profile,
          userId: data.userId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          cccd: data.cccd,
          roleName: data.roleName === 'Accountant' ? t('profilemanagement.professional_accountant') : data.roleName
        };
        setProfile(mergedProfile);
        setTempProfile(mergedProfile);
        setLoading(false);
      })
      .catch(err => {
        console.warn(t('profilemanagement.error_connecting_to_backend'), err);
        
        // Use local storage profile if available
        if (session) {
          try {
            const parsed = JSON.parse(session);
            const fallbackProfile = {
              ...profile,
              userId: parsed.userId || 1,
              name: parsed.name,
              email: parsed.email,
              roleName: parsed.roleName === 'Accountant' ? t('profilemanagement.professional_accountant') : parsed.roleName
            };
            setProfile(fallbackProfile);
            setTempProfile(fallbackProfile);
          } catch (e) {}
        } else {
          setTempProfile(profile);
        }
        
        setIsMock(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // --- ACTIONS ---

  // Trigger Profile Save Confirm Dialog
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setActiveModal('confirm_profile');
  };

  // Perform actual profile save
  const executeProfileSave = () => {
    if (isMock) {
      setProfile(tempProfile);

      // Sync with localStorage
      const session = localStorage.getItem('user');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          parsed.name = tempProfile.name;
          parsed.email = tempProfile.email;
          localStorage.setItem('user', JSON.stringify(parsed));
          window.dispatchEvent(new Event('userSessionUpdated'));
        } catch (e) {
          console.error(t('profilemanagement.error_updating_localstorage'), e);
        }
      }

      showNotification('success', t('profilemanagement.profile_information_saved_successfully'));
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/profile?userId=${profile.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone
        })
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.title || t('profilemanagement.unable_to_save_profile'));
        }
        return res.json();
      })
      .then(data => {
        const merged = {
          ...profile,
          name: data.name,
          email: data.email,
          phone: data.phone
        };
        setProfile(merged);
        setTempProfile(merged);

        // Sync with localStorage
        const session = localStorage.getItem('user');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            parsed.name = data.name;
            parsed.email = data.email;
            localStorage.setItem('user', JSON.stringify(parsed));
            window.dispatchEvent(new Event('userSessionUpdated'));
          } catch (e) {
            console.error(t('profilemanagement.error_updating_localstorage'), e);
          }
        }

        showNotification('success', t('profilemanagement.updated_personal_profile_successfully'));
        setActiveModal(null);
      })
      .catch(err => {
        setModalError(err.message);
      });
    }
  };

  // Trigger Password Change Confirm Dialog
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setActiveModal('confirm_password');
  };

  // Perform actual password change
  const executePasswordChange = () => {
    if (isMock) {
      showNotification('success', t('profilemanagement.account_password_changed_successfully'));
      setPassword({ current: '', new: '', confirm: '' });
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/profile/change-password?userId=${profile.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.new,
          confirmPassword: password.confirm
        })
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.title || t('profilemanagement.password_change_failed'));
        }
        showNotification('success', t('profilemanagement.password_change_successful_remember'));
        setPassword({ current: '', new: '', confirm: '' });
        setActiveModal(null);
      })
      .catch(err => {
        setModalError(err.message);
      });
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">{t('profilemanagement.records_management')}</h1>
          <p className="page-subtitle">
            {t('profilemanagement.update_your_personal_contact')}</p>
        </div>
        
        <div className="page-actions">
          <button 
            onClick={loadProfile}
            className="acc-btn-secondary btn-icon"
            title={t('profilemanagement.reload_profile')}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "loading-spinner" : ""} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`alert alert-${notification.type}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} className="alert-icon" />
            <span>{notification.message}</span>
          </div>
          <button className="acc-btn-ghost btn-sm btn-icon" onClick={() => setNotification(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mock notice */}
      {isMock && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={18} className="alert-icon" />
          <span>
            <strong>{t('profilemanagement.simulation_mode')}</strong> {t('profilemanagement.unable_to_connect_to')}<code>http://localhost:5056</code>{t('profilemanagement.the_system_is_displaying')}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <RefreshCw className="loading-spinner" size={24} style={{ color: 'var(--primary)' }} />
          <span className="loading-text">{t('profilemanagement.loading_accountant_profile')}</span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Side: Profile Summary Card */}
          <div className="acc-card" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--acc-primary-light)',
                color: 'var(--acc-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                border: '4px solid var(--acc-bg-app)'
              }}>
                <UserIcon size={36} strokeWidth={1.5} />
              </div>
              
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--acc-text-main)', marginBottom: '8px' }}>
                {profile.name}
              </h3>
              <span className="acc-badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Shield size={14} />
                {profile.roleName}
              </span>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--acc-border-color)', width: '100%' }}></div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--acc-text-main)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--acc-bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc-text-sub)' }}>
                  <Briefcase size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--acc-text-muted)' }}>{t('profilemanagement.department') || 'Phòng ban'}</span>
                  <span style={{ fontWeight: '500' }}>{profile.department}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--acc-text-main)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--acc-bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc-text-sub)' }}>
                  <MapPin size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--acc-text-muted)' }}>{t('profilemanagement.office') || 'Văn phòng'}</span>
                  <span style={{ fontWeight: '500' }}>{profile.office}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--acc-text-main)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--acc-bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc-text-sub)' }}>
                  <CreditCard size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--acc-text-muted)' }}>CCCD / ID</span>
                  <span style={{ fontWeight: '500' }}>{profile.cccd}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Form 1: Edit Profile */}
            <div className="acc-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--acc-text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon size={18} style={{ color: 'var(--acc-primary)' }} /> {t('profilemanagement.personal_information')}
              </h3>
              
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="acc-form-label">{t('profilemanagement.employee_id_id')}</label>
                    <input
                      type="text"
                      disabled
                      value={`EMP-ACC-${String(profile.userId).padStart(3, '0')}`}
                      className="acc-input"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        color: 'var(--text-muted)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="acc-form-label">{t('profilemanagement.full_name')}</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                      className="acc-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="acc-form-label">{t('profilemanagement.contact_email')}</label>
                    <input
                      type="email"
                      required
                      maxLength={150}
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                      className="acc-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="acc-form-label">{t('profilemanagement.phone_number')}</label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={tempProfile.phone}
                      onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                      className="acc-input"
                    />
                  </div>
                </div>

                <button type="submit" className="acc-btn-primary" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                  <Save size={16} /> {t('profilemanagement.save_changes')}</button>
              </form>
            </div>

            {/* Form 2: Change Password */}
            <div className="acc-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--acc-text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} style={{ color: 'var(--acc-primary)' }} /> {t('profilemanagement.change_password')}
              </h3>
              
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="acc-form-label">{t('profilemanagement.current_password')}</label>
                  <input
                    type="password"
                    required
                    maxLength={100}
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    placeholder={t('profilemanagement.enter_your_current_password')}
                    className="acc-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="acc-form-label">{t('profilemanagement.new_password')}</label>
                    <input
                      type="password"
                      required
                      maxLength={100}
                      minLength={6}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      placeholder={t('profilemanagement.minimum_6_characters')}
                      className="acc-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="acc-form-label">{t('profilemanagement.confirm_new_password')}</label>
                    <input
                      type="password"
                      required
                      maxLength={100}
                      minLength={6}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      placeholder={t('profilemanagement.reenter_new_password')}
                      className="acc-input"
                    />
                  </div>
                </div>

                <button type="submit" className="acc-btn-primary" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                  <Lock size={16} /> {t('profilemanagement.update_password')}</button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* --- POPUP CONFIRMATION DIALOGS --- */}

      {/* 1. Profile Update Confirmation */}
      {activeModal === 'confirm_profile' && (
        <div className="acc-modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="acc-modal-header">
              <h3 className="acc-modal-title">{t('profilemanagement.confirmation_of_changes')}</h3>
              <button onClick={() => setActiveModal(null)} className="acc-modal-close"><X size={16} /></button>
            </div>
            
            <div className="acc-modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <AlertCircle size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-title)', marginBottom: '6px' }}>
                    {t('profilemanagement.are_you_sure_you')}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {t('profilemanagement.all_subsequent_invoice_transaction')}</p>
                </div>
              </div>
            </div>
            
            <div className="acc-modal-footer">
              <button type="button" onClick={() => setActiveModal(null)} className="acc-btn-secondary">{t('profilemanagement.cancel')}</button>
              <button type="button" onClick={executeProfileSave} className="acc-btn-primary">{t('profilemanagement.confirm_save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Password Change Confirmation */}
      {activeModal === 'confirm_password' && (
        <div className="acc-modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="acc-modal-header">
              <h3 className="acc-modal-title" style={{ color: 'var(--warning)' }}>{t('profilemanagement.confirm_password_change')}</h3>
              <button onClick={() => setActiveModal(null)} className="acc-modal-close"><X size={16} /></button>
            </div>
            
            <div className="acc-modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <AlertTriangle size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-title)', marginBottom: '6px' }}>
                    {t('profilemanagement.confirm_change_to_new')}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {t('profilemanagement.your_account_will_change')}</p>
                </div>
              </div>
            </div>
            
            <div className="acc-modal-footer">
              <button type="button" onClick={() => setActiveModal(null)} className="acc-btn-secondary">{t('profilemanagement.cancel')}</button>
              <button type="button" onClick={executePasswordChange} className="acc-btn-primary" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>{t('profilemanagement.change_password')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

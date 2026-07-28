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
    office: t('profilemanagement.3rd_floor_stmm_executive'),
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
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
            className="btn btn-secondary btn-icon"
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
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setNotification(null)}>
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
          {/* Left Side: Avatar Card */}
          <div className="card-padded" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={profile.avatar}
                alt="Avatar"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '4px solid var(--primary-glow)',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
            </div>
            
            <div style={{ width: '100%' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '8px' }}>{profile.name}</h3>
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={12} />
                {profile.roleName}
              </span>
            </div>

            <div className="divider" style={{ margin: '8px 0', width: '100%' }}></div>

            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'flex-start',
              fontSize: '13.5px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                <Briefcase size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>{profile.department}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                <MapPin size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>{profile.office}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                <CreditCard size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>CCCD: {profile.cccd}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Form 1: Edit Profile */}
            <div className="card-padded">
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserIcon size={18} style={{ color: 'var(--primary)' }} /> {t('profilemanagement.personal_information')}</h3>
              
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">{t('profilemanagement.employee_id_id')}</label>
                    <input
                      type="text"
                      disabled
                      value={`EMP-ACC-${String(profile.userId).padStart(3, '0')}`}
                      className="form-input"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        color: 'var(--text-muted)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">{t('profilemanagement.full_name')}</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">{t('profilemanagement.contact_email')}</label>
                    <input
                      type="email"
                      required
                      maxLength={150}
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">{t('profilemanagement.phone_number')}</label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={tempProfile.phone}
                      onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                  <Save size={16} /> {t('profilemanagement.save_changes')}</button>
              </form>
            </div>

            {/* Form 2: Change Password */}
            <div className="card-padded">
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: 'var(--primary)' }} /> {t('profilemanagement.change_password')}</h3>
              
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">{t('profilemanagement.current_password')}</label>
                  <input
                    type="password"
                    required
                    maxLength={100}
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    placeholder={t('profilemanagement.enter_your_current_password')}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">{t('profilemanagement.new_password')}</label>
                    <input
                      type="password"
                      required
                      maxLength={100}
                      minLength={6}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      placeholder={t('profilemanagement.minimum_6_characters')}
                      className="form-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">{t('profilemanagement.confirm_new_password')}</label>
                    <input
                      type="password"
                      required
                      maxLength={100}
                      minLength={6}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      placeholder={t('profilemanagement.reenter_new_password')}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                  <Lock size={16} /> {t('profilemanagement.update_password')}</button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* --- POPUP CONFIRMATION DIALOGS --- */}

      {/* 1. Profile Update Confirmation */}
      {activeModal === 'confirm_profile' && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h3 className="modal-title">{t('profilemanagement.confirmation_of_changes')}</h3>
              <button onClick={() => setActiveModal(null)} className="modal-close-btn"><X size={16} /></button>
            </div>
            
            <div className="modal-body">
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
            
            <div className="modal-footer">
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">{t('profilemanagement.cancel')}</button>
              <button type="button" onClick={executeProfileSave} className="btn btn-primary">{t('profilemanagement.confirm_save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Password Change Confirmation */}
      {activeModal === 'confirm_password' && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--warning)' }}>{t('profilemanagement.confirm_password_change')}</h3>
              <button onClick={() => setActiveModal(null)} className="modal-close-btn"><X size={16} /></button>
            </div>
            
            <div className="modal-body">
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
            
            <div className="modal-footer">
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">{t('profilemanagement.cancel')}</button>
              <button type="button" onClick={executePasswordChange} className="btn btn-primary" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>{t('profilemanagement.change_password')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

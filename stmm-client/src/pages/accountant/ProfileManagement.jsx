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
  // Profile state
  const [profile, setProfile] = useState({
    userId: 1,
    name: 'Lê Thanh Bình',
    email: 'binhlt.accountant@stmm.vn',
    phone: '0987 654 321',
    cccd: '001095009876',
    roleName: 'Kế toán viên chuyên nghiệp',
    department: 'Phòng Tài Chính - Kế Toán',
    office: 'Tầng 3, Tòa nhà Điều Hành STMM',
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
        console.error('Lỗi phân tích session trong loadProfile:', e);
      }
    }

    // Fetch profile of accountant dynamically using logged-in user id
    fetch(`http://localhost:5056/api/accountant/profile?userId=${currentUserId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải hồ sơ người dùng');
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
          roleName: data.roleName === 'Accountant' ? 'Kế toán viên chuyên nghiệp' : data.roleName
        };
        setProfile(mergedProfile);
        setTempProfile(mergedProfile);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Lỗi kết nối tới API Backend. Sử dụng dữ liệu hồ sơ mặc định:', err);
        
        // Use local storage profile if available
        if (session) {
          try {
            const parsed = JSON.parse(session);
            const fallbackProfile = {
              ...profile,
              userId: parsed.userId || 1,
              name: parsed.name,
              email: parsed.email,
              roleName: parsed.roleName === 'Accountant' ? 'Kế toán viên chuyên nghiệp' : parsed.roleName
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
          console.error('Lỗi cập nhật localStorage:', e);
        }
      }

      showNotification('success', 'Đã lưu thông tin hồ sơ thành công (Mock)!');
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
          throw new Error(errData.detail || errData.title || 'Không thể lưu hồ sơ');
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
            console.error('Lỗi cập nhật localStorage:', e);
          }
        }

        showNotification('success', 'Cập nhật hồ sơ cá nhân thành công!');
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
      showNotification('success', 'Đã thay đổi mật khẩu tài khoản thành công (Mock)!');
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
          throw new Error(errData.detail || errData.title || 'Thay đổi mật khẩu thất bại');
        }
        showNotification('success', 'Thay đổi mật khẩu thành công! Hãy nhớ mật khẩu mới của bạn.');
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
          <h1 className="page-title">Quản Lý Hồ Sơ</h1>
          <p className="page-subtitle">
            Cập nhật thông tin cá nhân liên hệ và thay đổi mật khẩu đăng nhập hệ thống của bạn.
          </p>
        </div>
        
        <div className="page-actions">
          <button 
            onClick={loadProfile}
            className="btn btn-secondary btn-icon"
            title="Tải lại hồ sơ"
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
            <strong>Chế độ mô phỏng:</strong> Không thể kết nối tới Backend tại <code>http://localhost:5056</code>. Hệ thống đang hiển thị hồ sơ ngoại tuyến.
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <RefreshCw className="loading-spinner" size={24} style={{ color: 'var(--primary)' }} />
          <span className="loading-text">Đang nạp hồ sơ kế toán viên...</span>
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
                <UserIcon size={18} style={{ color: 'var(--primary)' }} /> Thông Tin Cá Nhân
              </h3>
              
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Mã nhân viên (ID)</label>
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
                    <label className="form-label">Họ và tên</label>
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
                    <label className="form-label">Email liên hệ</label>
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
                    <label className="form-label">Số điện thoại</label>
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
                  <Save size={16} /> Lưu Thay Đổi
                </button>
              </form>
            </div>

            {/* Form 2: Change Password */}
            <div className="card-padded">
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} style={{ color: 'var(--primary)' }} /> Đổi Mật Khẩu
              </h3>
              
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    maxLength={100}
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    placeholder="Nhập mật khẩu đang sử dụng..."
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      maxLength={100}
                      minLength={6}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự..."
                      className="form-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      required
                      maxLength={100}
                      minLength={6}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                  <Lock size={16} /> Cập Nhật Mật Khẩu
                </button>
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
              <h3 className="modal-title">Xác Nhận Thay Đổi</h3>
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
                    Bạn có chắc chắn muốn lưu thông tin mới?
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Mọi hoạt động giao dịch hóa đơn và đối soát tài chính sau đó sẽ được gắn kèm với các thông tin định danh mới này.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">Hủy</button>
              <button type="button" onClick={executeProfileSave} className="btn btn-primary">Xác nhận lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Password Change Confirmation */}
      {activeModal === 'confirm_password' && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--warning)' }}>Xác Nhận Đổi Mật Khẩu</h3>
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
                    Xác nhận đổi sang mật khẩu mới?
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Tài khoản của bạn sẽ đổi sang mật khẩu mới ngay lập tức. Bạn cần đăng nhập lại với mật khẩu mới cho các phiên làm việc tiếp theo.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary">Hủy</button>
              <button type="button" onClick={executePasswordChange} className="btn btn-primary" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>Đổi mật khẩu</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

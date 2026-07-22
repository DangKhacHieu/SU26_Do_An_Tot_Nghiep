import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Receipt,
  ShieldAlert,
  Wrench,
  CheckSquare,
  User,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut,
  Building2,
  TrendingUp,
  ChevronDown,
  X,
  Trash2
} from 'lucide-react';
import './AccountantLayout.css';

const NAV_ITEMS = [
  {
    section: 'Tổng quan',
    items: [
      { path: '/accountant/dashboard', label: 'Tổng quan & Báo cáo', icon: LayoutDashboard }
    ]
  },
  {
    section: 'Nghiệp vụ Tài chính',
    items: [
      { path: '/accountant/financial-config', label: 'Cấu hình tài chính', icon: Settings },
      { path: '/accountant/periodic-invoices', label: 'Hóa đơn định kỳ', icon: Receipt },
      { path: '/accountant/payment-verification', label: 'Đối soát & Thanh toán', icon: CheckSquare },
    ]
  },
  {
    section: 'Quản lý',
    items: [
      { path: '/accountant/violations-penalties', label: 'Vi phạm & Phạt', icon: ShieldAlert },
      { path: '/accountant/repair-price', label: 'Giá sửa chữa', icon: Wrench },
    ]
  },
  {
    section: 'Tài khoản',
    items: [
      { path: '/accountant/profile-management', label: 'Hồ sơ cá nhân', icon: User },
    ]
  }
];

const PAGE_LABELS = {
  '/accountant/dashboard': 'Tổng quan & Báo cáo',
  '/accountant/financial-config': 'Cấu hình Tài chính',
  '/accountant/periodic-invoices': 'Hóa đơn Định kỳ',
  '/accountant/violations-penalties': 'Vi phạm & Phạt',
  '/accountant/repair-price': 'Giá Sửa Chữa',
  '/accountant/payment-verification': 'Đối soát & Thanh toán',
  '/accountant/profile-management': 'Hồ sơ Cá nhân',
};

export default function AccountantLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNoti, setSelectedNoti] = useState(null);

  const [currentUser, setCurrentUser] = useState({
    name: 'Lê Thanh Bình',
    email: 'binhlt.accountant@stmm.vn',
    roleName: 'Accountant',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
  });

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch('http://localhost:5056/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await fetch('http://localhost:5056/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReadNotification = async (noti) => {
    setSelectedNoti(noti);
    setShowNotifications(false);
    if (!noti.isRead) {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        await fetch(`http://localhost:5056/api/notifications/${noti.id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(notifications.map(n => n.id === noti.id ? { ...n, isRead: true } : n));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteNotification = async (e, notiId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await fetch(`http://localhost:5056/api/notifications/${notiId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== notiId));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const loadSession = () => {
      const session = localStorage.getItem('user');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setCurrentUser({
            name: parsed.name || 'Lê Thanh Bình',
            email: parsed.email || 'binhlt.accountant@stmm.vn',
            roleName: parsed.roleName || 'Accountant',
            avatar: parsed.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
          });
        } catch (e) {}
      }
    };

    loadSession();

    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    window.addEventListener('storage', loadSession);
    window.addEventListener('userSessionUpdated', loadSession);
    return () => {
      window.removeEventListener('storage', loadSession);
      window.removeEventListener('userSessionUpdated', loadSession);
    };
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống STMM?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const roleLabel = (roleName) => {
    const map = { Accountant: 'Kế toán viên', Admin: 'Quản trị viên', Manager: 'Quản lý' };
    return map[roleName] || roleName;
  };

  const currentPageLabel = PAGE_LABELS[location.pathname] || 'STMM Portal';

  return (
    <div className="layout-container">
      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>

        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">
              <Building2 size={18} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">STMM Portal</span>
              <span className="sidebar-brand-sub">Hệ thống Kế toán</span>
            </div>
          </div>
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <img src={currentUser.avatar} alt={currentUser.name} className="sidebar-user-avatar" />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser.name}</span>
            <span className="sidebar-user-role">{roleLabel(currentUser.roleName)}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              {!isCollapsed && (
                <div className="sidebar-nav-section">
                  <span className="sidebar-nav-section-label">{group.section}</span>
                </div>
              )}
              {isCollapsed && <div style={{ height: 8 }} />}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={18} />
            <span className="logout-btn-text">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className={`main-content-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>

        {/* Top Header */}
        <header className="top-header">
          {/* Left: Breadcrumb */}
          <div className="header-left">
            <div className="header-breadcrumb">
              <Building2 size={15} />
              <span className="header-breadcrumb-separator">›</span>
              <span>Kế toán</span>
              <span className="header-breadcrumb-separator">›</span>
              <span className="header-breadcrumb-current">{currentPageLabel}</span>
            </div>
          </div>

          {/* Center: Search (Removed) */}

          {/* Right: Controls */}
          <div className="header-controls">
            {/* Theme Toggle */}
            <button className="control-btn" onClick={toggleTheme} title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <div className="notification-wrapper">
              <button
                className="control-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Thông báo"
              >
                <Bell size={17} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="notif-badge">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notif-header">
                    <h4>Thông báo</h4>
                    <button className="mark-read-btn" onClick={handleMarkAllAsRead}>
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                  <div className="notif-list">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => handleReadNotification(n)}>
                        <div className="notif-item-inner" style={{ position: 'relative', paddingRight: '24px' }}>
                          {!n.isRead && <span className="notif-dot" />}
                          <div>
                            <p className="notif-text">{n.title}</p>
                            <span className="notif-time">{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <button 
                            className="btn-ghost btn-icon" 
                            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', padding: 4 }}
                            onClick={(e) => handleDeleteNotification(e, n.id)}
                            title="Xóa thông báo"
                          >
                            <Trash2 size={14} color="var(--danger)" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Không có thông báo nào.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="header-divider" />

            {/* User Profile */}
            <div
              className="user-profile-header"
              onClick={() => navigate('/accountant/profile-management')}
            >
              <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar" />
              <div className="user-info-text">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{roleLabel(currentUser.roleName)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="content-container-inside">
          <Outlet />
        </main>
      </div>

      {/* Notification Detail Modal */}
      {selectedNoti && (
        <div className="modal-overlay" onClick={() => setSelectedNoti(null)} style={{ zIndex: 9999 }}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Chi Tiết Thông Báo</span>
              <button className="modal-close-btn" onClick={() => setSelectedNoti(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ minHeight: '120px' }}>
              <h3 style={{ marginBottom: 12, color: 'var(--text-title)', fontSize: 16 }}>{selectedNoti.title}</h3>
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{selectedNoti.content}</p>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                Thời gian: {new Date(selectedNoti.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedNoti(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

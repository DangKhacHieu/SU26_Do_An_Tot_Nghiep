import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
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

const getNavItems = (t) => [
  {
    section: t('accountantlayout.overview'),
    items: [
      { path: '/accountant/dashboard', label: t('accountantlayout.overview_report'), icon: LayoutDashboard }
    ]
  },
  {
    section: t('accountantlayout.financial_operations'),
    items: [
      { path: '/accountant/financial-config', label: t('accountantlayout.financial_configuration'), icon: Settings },
      { path: '/accountant/periodic-invoices', label: t('accountantlayout.recurring_bills'), icon: Receipt },
      { path: '/accountant/payment-verification', label: t('accountantlayout.control_payment'), icon: CheckSquare },
    ]
  },
  {
    section: t('accountantlayout.manage'),
    items: [
      { path: '/accountant/violations-penalties', label: t('accountantlayout.violations_fines'), icon: ShieldAlert },
      { path: '/accountant/repair-price', label: t('accountantlayout.repair_price'), icon: Wrench },
    ]
  },
  {
    section: t('accountantlayout.account'),
    items: [
      { path: '/accountant/profile-management', label: t('accountantlayout.personal_profile'), icon: User },
    ]
  }
];

const getPageLabels = (t) => ({
  '/accountant/dashboard': t('accountantlayout.overview_report'),
  '/accountant/financial-config': t('accountantlayout.financial_configuration'),
  '/accountant/periodic-invoices': t('accountantlayout.recurring_bills'),
  '/accountant/violations-penalties': t('accountantlayout.violations_fines'),
  '/accountant/repair-price': t('accountantlayout.repair_price'),
  '/accountant/payment-verification': t('accountantlayout.control_payment'),
  '/accountant/profile-management': t('accountantlayout.personal_profile'),
});

export default function AccountantLayout() {
  const { t } = useTranslation();
  const NAV_ITEMS = getNavItems(t);
  const PAGE_LABELS = getPageLabels(t);

  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNoti, setSelectedNoti] = useState(null);

  const [currentUser, setCurrentUser] = useState({
    name: t('accountantlayout.le_thanh_binh'),
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
            name: parsed.name || t('accountantlayout.le_thanh_binh'),
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
    if (window.confirm(t('accountantlayout.are_you_sure_you'))) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const roleLabel = (roleName) => {
    const map = { Accountant: t('accountantlayout.accountant'), Admin: t('accountantlayout.administrator'), Manager: t('accountantlayout.manage') };
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
              <span className="sidebar-brand-sub">{t('accountantlayout.accounting_system')}</span>
            </div>
          </div>
          <button
            className="collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? t('accountantlayout.expand_menu') : t('accountantlayout.collapse_menu')}
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
          <button className="logout-btn" onClick={handleLogout} title={t('accountantlayout.sign_out')}>
            <LogOut size={18} />
            <span className="logout-btn-text">{t('accountantlayout.sign_out')}</span>
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
              <span>{t('accountantlayout.accountant')}</span>
              <span className="header-breadcrumb-separator">›</span>
              <span className="header-breadcrumb-current">{currentPageLabel}</span>
            </div>
          </div>

          {/* Center: Search (Removed) */}

          {/* Right: Controls */}
          <div className="header-controls">
            {/* Theme Toggle */}
            <button className="control-btn" onClick={toggleTheme} title={isDark ? t('accountantlayout.bright_interface') : t('accountantlayout.dark_interface')}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notifications */}
            <div className="notification-wrapper">
              <button
                className="control-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title={t('accountantlayout.notification')}
              >
                <Bell size={17} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="notif-badge">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notif-header">
                    <h4>{t('accountantlayout.notification')}</h4>
                    <button className="mark-read-btn" onClick={handleMarkAllAsRead}>
                      {t('accountantlayout.mark_all_as_read')}</button>
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
                            title={t('accountantlayout.delete_notification')}
                          >
                            <Trash2 size={14} color="var(--danger)" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        {t('accountantlayout.there_are_no_announcements')}</div>
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
              <span className="modal-title">{t('accountantlayout.notification_details')}</span>
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
              <button className="btn btn-secondary" onClick={() => setSelectedNoti(null)}>{t('accountantlayout.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

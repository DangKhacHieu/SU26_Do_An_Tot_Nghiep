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
      { path: '/accountant/periodic-invoices', label: t('accountantlayout.invoices'), icon: Receipt },
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
  '/accountant/periodic-invoices': t('accountantlayout.invoices'),
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNoti, setSelectedNoti] = useState(null);

  const [currentUser, setCurrentUser] = useState({
    name: t('accountantlayout.le_thanh_binh'),
    email: 'binhlt.accountant@stmm.vn',
    roleName: 'Accountant'
  });

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error("No token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.warn("Using mock notifications due to fetch error:", e);
      setNotifications([
        { id: 1, title: 'Hóa đơn định kỳ tháng này đã được tạo thành công.', createdAt: new Date().toISOString(), isRead: false },
        { id: 2, title: 'Tiểu thương Kiosk B-12 vừa thanh toán hóa đơn vi phạm.', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: false },
        { id: 3, title: 'Tiểu thương Kiosk A-10 khiếu nại về tiền điện tháng 6.', createdAt: new Date(Date.now() - 7200000).toISOString(), isRead: true },
        { id: 4, title: 'Báo cáo doanh thu tháng 6 đã được kết xuất sẵn sàng.', createdAt: new Date(Date.now() - 86400000).toISOString(), isRead: true }
      ]);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/notifications/read-all`, {
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
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/notifications/${noti.id}/read`, {
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
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/notifications/${notiId}`, {
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
            roleName: parsed.roleName || 'Accountant'
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
    <div className="acc-layout-wrapper">
      {/* Backdrop for Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div className="acc-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`acc-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>

        {/* Brand Header */}
        <div className="acc-brand-section">
          <div className="acc-brand-logo">
            <Building2 size={18} />
          </div>
          <div className="acc-brand-name">
            <span className="acc-brand-title">STMM Portal</span>
            <span className="acc-brand-subtitle">{t('accountantlayout.accounting_system')}</span>
          </div>
          <button
            className="acc-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? t('accountantlayout.expand_menu') : t('accountantlayout.collapse_menu')}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Close Button for Mobile Drawer */}
        <button
          className="acc-mobile-close-btn"
          onClick={() => setIsMobileSidebarOpen(false)}
          title={t('accountantlayout.close_menu', 'Đóng menu')}
        >
          <X size={18} />
        </button>

        {/* User Card (Removed here, moved to footer) */}

        {/* Navigation */}
        <nav className="acc-sidebar-menu">
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              {!isCollapsed && (
                <p className="acc-sidebar-section-label">{group.section}</p>
              )}
              {isCollapsed && <div style={{ height: 8 }} />}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `acc-menu-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => setIsMobileSidebarOpen(false)}
                  >
                    <Icon size={18} className="acc-menu-icon" />
                    <span className="acc-menu-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Logout */}
        <div className="acc-sidebar-footer" onClick={handleLogout} title={t('accountantlayout.sign_out')}>
          <div className="acc-user-avatar" style={{ backgroundColor: 'var(--acc-primary-light)', color: 'var(--acc-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} />
          </div>
          <div className="acc-user-info">
            <span className="acc-user-name">{currentUser.name}</span>
            <span className="acc-user-role">{roleLabel(currentUser.roleName)}</span>
          </div>
          <LogOut size={16} className="acc-logout-icon" />
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="acc-main">

        {/* Top Header */}
        <header className="acc-header">
          {/* Hamburger button on mobile */}
          <button
            type="button"
            className="acc-hamburger-btn"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="acc-hamburger-line"></span>
            <span className="acc-hamburger-line"></span>
            <span className="acc-hamburger-line"></span>
          </button>

          {/* Left: Breadcrumb/Title */}
          <div className="acc-header-title">
            <h1>{currentPageLabel}</h1>
            <p>{t('accountantlayout.system_subtitle')}</p>
          </div>

          {/* Center: Search (Removed) */}

          {/* Right: Controls */}
          <div className="acc-header-actions">
            {/* Theme Toggle */}
            <button className="acc-btn-ghost" onClick={toggleTheme} title={isDark ? t('accountantlayout.bright_interface') : t('accountantlayout.dark_interface')}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                className="acc-btn-ghost"
                onClick={() => setShowNotifications(!showNotifications)}
                title={t('accountantlayout.notification')}
              >
                <Bell size={17} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="acc-badge danger" style={{ position: 'absolute', top: -4, right: -4, padding: '2px 4px', fontSize: 10, minWidth: 16 }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="acc-card" style={{ position: 'absolute', top: '100%', right: 0, width: 350, marginTop: 8, zIndex: 50 }}>
                  <div className="acc-card-header">
                    <h4 style={{ margin: 0 }}>{t('accountantlayout.notification')}</h4>
                    <button className="acc-btn-ghost" onClick={handleMarkAllAsRead} style={{ fontSize: 12 }}>
                      {t('accountantlayout.mark_all_as_read')}
                    </button>
                  </div>
                  <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--acc-border-color)', cursor: 'pointer', backgroundColor: n.isRead ? 'transparent' : 'var(--acc-primary-light)' }} onClick={() => handleReadNotification(n)}>
                        <div style={{ position: 'relative', paddingRight: '24px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: 'var(--acc-text-main)' }}>{n.title}</p>
                            <span style={{ fontSize: 11, color: 'var(--acc-text-muted)' }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <button 
                            className="acc-btn-ghost" 
                            style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)' }}
                            onClick={(e) => handleDeleteNotification(e, n.id)}
                            title={t('accountantlayout.delete_notification')}
                          >
                            <Trash2 size={14} color="var(--acc-danger)" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--acc-text-muted)', fontSize: 13 }}>
                        {t('accountantlayout.there_are_no_announcements')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div
              onClick={() => navigate('/accountant/profile-management')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}
            >
              <div className="acc-user-avatar" style={{ backgroundColor: 'var(--acc-primary-light)', color: 'var(--acc-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="acc-dashboard-content">
          <Outlet />
        </main>
      </div>

      {/* Notification Detail Modal */}
      {selectedNoti && (
        <div className="acc-modal-overlay" onClick={() => setSelectedNoti(null)}>
          <div className="acc-modal-container" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('accountantlayout.notification_details')}</span>
              <button className="acc-modal-close" onClick={() => setSelectedNoti(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body" style={{ minHeight: '120px' }}>
              <h3 style={{ marginBottom: 12, color: 'var(--acc-text-main)', fontSize: 16 }}>{selectedNoti.title}</h3>
              <p style={{ color: 'var(--acc-text-sub)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{selectedNoti.content}</p>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--acc-text-muted)' }}>
                Thời gian: {new Date(selectedNoti.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setSelectedNoti(null)}>{t('accountantlayout.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

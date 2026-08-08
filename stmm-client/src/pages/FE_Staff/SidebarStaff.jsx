import { useTranslation } from 'react-i18next';
import { Bell, ClipboardCheck, LayoutDashboard, LogOut, Radio, Store, TriangleAlert, UserRound } from 'lucide-react';
import './SidebarStaff.css';

export default function SidebarStaff({ currentView, setView, user, onLogout, unreadNotificationsCount = 0, isMobileOpen, onClose }) {
  const { t } = useTranslation();

  const NAV_GROUPS = [
    {
      label: t('sidebarstaff.overview'),
      items: [
        { key: 'dashboard', label: t('sidebarstaff.dashboard'), icon: LayoutDashboard },
        { key: 'notifications', label: t('sidebarstaff.notifications'), icon: Bell, badge: unreadNotificationsCount },
      ],
    },
    {
      label: t('sidebarstaff.operations'),
      items: [
        { key: 'tasks', label: t('sidebarstaff.tasks'), icon: ClipboardCheck, childKeys: ['task-details', 'task-map'] },
        { key: 'violations', label: t('sidebarstaff.violations'), icon: TriangleAlert, childKeys: ['violation-details'] },
        { key: 'issues', label: t('sidebarstaff.issues'), icon: Radio, childKeys: ['issue-details'] },
      ],
    },
    {
      label: t('sidebarstaff.management'),
      items: [{ key: 'stall-list', label: t('sidebarstaff.stall_list'), icon: Store, childKeys: ['stall-invoices', 'meters', 'meter-details'] }],
    },
    {
      label: t('sidebarstaff.account', 'Tài khoản'),
      items: [{ key: 'profile', label: t('sidebarstaff.personal_profile', 'Hồ sơ cá nhân'), icon: UserRound }],
    },
  ];

  const isActive = (item) => item.key === currentView || item.childKeys?.includes(currentView);

  return (
    <aside className={`staff-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Close Button */}
      <button
        type="button"
        className="staff-sidebar-mobile-close-btn"
        onClick={onClose}
        style={{
          display: "none",
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.6)",
          cursor: "pointer",
          fontSize: "24px",
          padding: "4px",
          lineHeight: "1",
          zIndex: 100,
        }}
      >
        &times;
      </button>
      <div className="staff-brand-section">
        <div className="staff-brand-logo">{t('sidebarstaff.st')}</div>
        <div className="staff-brand-name"><span className="staff-brand-title">{t('sidebarstaff.mhms')}</span><span className="staff-brand-subtitle">{t('sidebarstaff.staff_console')}</span></div>
      </div>

      <div style={{ flex: 1 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="staff-sidebar-section-label">{group.label}</p>
            <nav className="staff-sidebar-menu">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} className={`staff-menu-item ${isActive(item) ? 'active' : ''}`} onClick={() => setView(item.key)}>
                    <span className="staff-menu-icon"><Icon size={17} /></span>
                    <span className="staff-menu-label">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="staff-sidebar-badge">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="staff-sidebar-footer">
        {onLogout ? (
          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
            title={t('sidebarstaff.log_out')}
          >
            <span className="staff-menu-icon"><LogOut size={18} /></span>
            <span className="staff-menu-label">{t('sidebarstaff.log_out')}</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}


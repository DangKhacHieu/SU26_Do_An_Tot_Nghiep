import { useTranslation } from 'react-i18next';
import { ClipboardCheck, LayoutDashboard, LogOut, Radio, Store, TriangleAlert } from 'lucide-react';
import './SidebarStaff.css';

export default function SidebarStaff({ currentView, setView, user, onLogout }) {
  const { t } = useTranslation();

  const NAV_GROUPS = [
    {
      label: t('sidebarstaff.overview'),
      items: [{ key: 'dashboard', label: t('sidebarstaff.dashboard'), icon: LayoutDashboard }],
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
  ];

  const isActive = (item) => item.key === currentView || item.childKeys?.includes(currentView);

  return (
    <aside className="staff-sidebar">
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
                    <span className="staff-menu-icon"><Icon size={17} /></span><span className="staff-menu-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="staff-sidebar-footer">
        <button type="button" className={`staff-sidebar-user ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
          <span className="staff-user-avatar">{user?.name ? user.name.substring(0, 1).toUpperCase() : 'S'}</span>
          <span className="staff-user-info"><span className="staff-user-name">{user?.name || t('sidebarstaff.staff')}</span><span className="staff-user-role">{t('sidebarstaff.staff')}</span></span>
        </button>
        {onLogout ? <button type="button" className="staff-menu-item logout-btn" onClick={onLogout}><LogOut size={16} /> {t('sidebarstaff.log_out')}</button> : null}
      </div>
    </aside>
  );
}

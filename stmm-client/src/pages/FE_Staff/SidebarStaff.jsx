import { ClipboardCheck, LayoutDashboard, LogOut, Radio, Store, TriangleAlert } from 'lucide-react';
import './SidebarStaff.css';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { key: 'tasks', label: 'Tasks', icon: ClipboardCheck, childKeys: ['task-details', 'task-map'] },
      { key: 'violations', label: 'Violations', icon: TriangleAlert, childKeys: ['violation-details'] },
      { key: 'issues', label: 'Issues', icon: Radio, childKeys: ['issue-details'] },
    ],
  },
  {
    label: 'Management',
    items: [{ key: 'stall-list', label: 'Stall List', icon: Store, childKeys: ['stall-invoices', 'meters', 'meter-details'] }],
  },
];

export default function SidebarStaff({ currentView, setView, user, onLogout }) {
  const isActive = (item) => item.key === currentView || item.childKeys?.includes(currentView);

  return (
    <aside className="staff-sidebar">
      <div className="staff-brand-section">
        <div className="staff-brand-logo">ST</div>
        <div className="staff-brand-name"><span className="staff-brand-title">MHMS</span><span className="staff-brand-subtitle">Staff Console</span></div>
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
          <span className="staff-user-info"><span className="staff-user-name">{user?.name || 'Staff'}</span><span className="staff-user-role">Staff</span></span>
        </button>
        {onLogout ? <button type="button" className="staff-menu-item logout-btn" onClick={onLogout}><LogOut size={16} /> Log out</button> : null}
      </div>
    </aside>
  );
}

import './SidebarStaff.css';

/**
 * SidebarStaff — Thanh điều hướng bên trái của Staff Console.
 *
 * Props:
 *   currentView  {string}    — view đang active ('dashboard', 'tasks', ...)
 *   setView      {function}  — hàm chuyển view
 *
 * Pattern: giống SidebarManager, accent màu xanh dương (#3b82f6)
 */

// ─── Icon components ─────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconTasks = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const IconMeters = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconViolations = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconIssues = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

const IconStalls = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// ─── Navigation structure ─────────────────────────────────────────────────────
// Mỗi group có label và danh sách items.
// Mỗi item: { key, label, icon, childKeys? }
//   - key       : view name để setView
//   - childKeys : các view con cũng được tính là active khi mở
const NAV_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <IconDashboard />,
      },
    ],
  },
  {
    label: 'Hoạt động',
    items: [
      {
        key: 'tasks',
        label: 'Tasks',
        icon: <IconTasks />,
        childKeys: ['task-details', 'task-map'],
      },
      {
        key: 'violations',
        label: 'Violations',
        icon: <IconViolations />,
        childKeys: ['violation-details'],
      },
      {
        key: 'issues',
        label: 'Issues',
        icon: <IconIssues />,
        childKeys: ['issue-details'],
      },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      {
        key: 'stall-list',
        label: 'List Stall',
        icon: <IconStalls />,
        childKeys: ['stall-invoices'],
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SidebarStaff({ currentView, setView, user, onLogout }) {
  const isActive = (item) =>
    item.key === currentView ||
    (item.childKeys && item.childKeys.includes(currentView));

  return (
    <aside className="staff-sidebar">
      {/* Brand */}
      <div className="staff-brand-section">
        <div className="staff-brand-logo">ST</div>
        <div className="staff-brand-name">
          <span className="staff-brand-title">MHMS</span>
          <span className="staff-brand-subtitle">Staff Console</span>
        </div>
      </div>

      {/* Navigation groups */}
      <div style={{ flex: 1 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="staff-sidebar-section-label">{group.label}</p>
            <nav className="staff-sidebar-menu">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  className={`staff-menu-item ${isActive(item) ? 'active' : ''}`}
                  onClick={() => setView(item.key)}
                >
                  <span className="staff-menu-icon">{item.icon}</span>
                  <span className="staff-menu-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer: current user info & logout */}
      <div className="staff-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div 
          onClick={() => setView('profile')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            width: '100%',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            transition: 'background-color 0.15s ease',
            backgroundColor: currentView === 'profile' ? 'rgba(59, 130, 246, 0.18)' : 'transparent'
          }}
          onMouseEnter={(e) => {
            if (currentView !== 'profile') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== 'profile') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div className="staff-user-avatar" style={{ minWidth: '32px' }}>
            {user?.name ? user.name.substring(0, 1).toUpperCase() : 'S'}
          </div>
          <div className="staff-user-info" style={{ flexGrow: 1, minWidth: 0 }}>
            <span className="staff-user-name" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {user?.name || 'Staff'}
            </span>
            <span className="staff-user-role">Nhân viên</span>
          </div>
        </div>
        {onLogout && (
          <button 
            className="staff-menu-item logout-btn" 
            onClick={onLogout}
            style={{ 
              marginTop: '5px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              width: '100%',
              borderRadius: '6px',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13px',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        )}
      </div>
    </aside>
  );
}

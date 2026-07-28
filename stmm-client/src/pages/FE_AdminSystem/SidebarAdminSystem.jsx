import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import './SidebarAdminSystem.css';

/**
 * SidebarAdminSystem — Sidebar for the Admin System Console.
 */

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogs = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [
      {
        key: 'admin-dashboard',
        label: "Trang tổng quan",
        icon: <IconGrid />,
      },
    ],
  },
  {
    label: "Quản trị hệ thống",
    items: [
      {
        key: 'admin-users',
        label: "Tài khoản toàn hệ thống",
        icon: <IconUsers />,
        childKeys: ['admin-user-form', 'admin-user-detail'],
      },
      {
        key: 'admin-market-approval',
        label: "Phê duyệt Chợ",
        icon: <IconSettings />,
      },
      {
        key: 'admin-audit-logs',
        label: "Nhật ký hoạt động",
        icon: <IconLogs />,
      },
    ],
  },
];

export default function SidebarAdminSystem({ currentPage, navigate, user, onLogout }) {
  const { t } = useTranslation();

  const getGroupLabel = (groupLabel) => {
    if (groupLabel === "Tổng quan") return t('sidebaradminsystem.overview');
    if (groupLabel === "Quản trị hệ thống") return t('sidebaradminsystem.system_administration');
    return groupLabel;
  };

  const getItemLabel = (itemKey, itemLabel) => {
    if (itemKey === 'admin-dashboard') return t('sidebaradminsystem.overview_page');
    if (itemKey === 'admin-users') return t('sidebaradminsystem.systemwide_account');
    if (itemKey === 'admin-market-approval') return t('sidebaradminsystem.market_approval');
    if (itemKey === 'admin-audit-logs') return t('sidebaradminsystem.activity_log');
    return itemLabel;
  };

  const isActive = (item) =>
    item.key === currentPage ||
    (item.childKeys && item.childKeys.includes(currentPage));

  return (
    <aside className="app-sidebar admin-sidebar">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo admin-logo">AS</div>
        <div className="brand-name">
          <span className="brand-title">MHMS</span>
          <span className="brand-subtitle">Admin System Console</span>
        </div>
      </div>

      {/* Navigation groups */}
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="sidebar-section-label">{getGroupLabel(group.label)}</p>
          <nav className="sidebar-menu">
            {group.items.map((item) => (
              <div
                key={item.key}
                className={`menu-item ${isActive(item) ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{getItemLabel(item.key, item.label)}</span>
              </div>
            ))}
          </nav>
        </div>
      ))}

      {/* Language Switcher */}
      <div style={{ padding: '8px 12px' }}>
        <LanguageSwitcher />
      </div>

      {/* Footer: current user info */}
      <div className="sidebar-footer">
        <div className="user-avatar admin-avatar">
          {user?.name ? user.name[0].toUpperCase() : 'A'}
        </div>
        <div className="user-info" style={{ flexGrow: 1 }}>
          <span className="user-name">{user?.name || 'System Admin'}</span>
          <span className="user-role">{user?.roleName || t('sidebaradminsystem.qun_tr_ti_cao')}</span>
        </div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="logout-icon-btn"
            title={t('sidebaradminsystem.sign_out')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}

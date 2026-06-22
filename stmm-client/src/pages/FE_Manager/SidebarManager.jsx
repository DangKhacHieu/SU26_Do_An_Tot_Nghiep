import './SidebarManager.css';

/**
 * SidebarManager — Thanh điều hướng bên trái của Manager Console.
 *
 * Props:
 *   currentPage  {string}    — trang đang active ('dashboard', 'users', ...)
 *   navigate     {function}  — hàm chuyển trang navigate(page, id?)
 *
 * Để thêm menu mới vào sidebar, chỉ cần thêm một phần tử vào mảng NAV_GROUPS bên dưới.
 */

// ─── Icon components ─────────────────────────────────────────────────────────
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

const IconContent = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconFaq = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconProfile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconMeter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <line x1="4" y1="10" x2="20" y2="10" />
    <circle cx="12" cy="15" r="2" />
    <line x1="12" y1="10" x2="12" y2="13" />
  </svg>
);

// ─── Navigation structure ─────────────────────────────────────────────────────
// Mỗi group có label và danh sách items.
// Mỗi item: { key, label, icon, childKeys? }
//   - key       : page name dùng để navigate
//   - childKeys : các page con cũng được tính là active khi mở
const NAV_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      {
        key: 'dashboard',
        label: 'Trang tổng quan',
        icon: <IconGrid />,
      },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      {
        key: 'users',
        label: 'Tài khoản thành viên',
        icon: <IconUsers />,
        childKeys: ['form', 'detail'],
      },
      {
        key: 'content',
        label: 'Tin tức & Thông báo',
        icon: <IconContent />,
        childKeys: ['content-form', 'content-detail'],
      },
      {
        key: 'faqs',
        label: 'Câu hỏi thường gặp',
        icon: <IconFaq />,
        childKeys: ['faq-form'],
      },
      {
        key: 'market-areas',
        label: 'Quản lý Mặt bằng',
        icon: <IconGrid />, // Using IconGrid for Market Areas
        childKeys: [],
      },
      {
        key: 'business-categories',
        label: 'Danh mục kinh doanh',
        icon: <IconContent />,
        childKeys: [],
      },
      {
        key: 'contracts',
        label: 'Quản lý Hợp đồng',
        icon: <IconContent />,
        childKeys: ['contract-form', 'contract-detail'],
      },
      {
        key: 'tasks',
        label: 'Tasks Management',
        icon: <IconContent />,
        childKeys: ['task-details'],
      },
      {
        key: 'requests',
        label: 'Quản lý Yêu cầu',
        icon: <IconContent />,
        childKeys: ['request-detail'],
      },
      {
        key: 'violations',
        label: 'Biên bản vi phạm',
        icon: <IconAlert />,
        childKeys: ['violation-details'],
      },
      {
        key: 'issues',
        label: 'Quản lý Sự cố',
        icon: <IconAlert />,
        childKeys: ['issue-details'],
      },
      {
        key: 'meters',
        label: 'Quản lý Công tơ',
        icon: <IconMeter />,
        childKeys: [],
      },
    ],
  },
];


// ─── Component ────────────────────────────────────────────────────────────────
export default function SidebarManager({ currentPage, navigate, user, onLogout }) {
  const isActive = (item) =>
    item.key === currentPage ||
    (item.childKeys && item.childKeys.includes(currentPage));

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo">MH</div>
        <div className="brand-name">
          <span className="brand-title">MHMS</span>
          <span className="brand-subtitle">Manager Console</span>
        </div>
      </div>

      {/* Navigation groups */}
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="sidebar-section-label">{group.label}</p>
          <nav className="sidebar-menu">
            {group.items.map((item) => (
              <div
                key={item.key}
                className={`menu-item ${isActive(item) ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
      ))}

      {/* Footer: current user info */}
      <div className="sidebar-footer">
        <div 
          className={`user-profile-summary ${currentPage === 'manager-profile' ? 'active' : ''}`}
          onClick={() => navigate('manager-profile')}
          title="Xem hồ sơ cá nhân"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            flexGrow: 1, 
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 'manager-profile') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'manager-profile') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div className="user-avatar">
            {user?.name ? user.name[0].toUpperCase() : 'M'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Manager'}</span>
            <span className="user-role">{user?.roleName || 'Quản trị viên'}</span>
          </div>
        </div>
        {onLogout && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            className="logout-icon-btn"
            title="Đăng xuất"
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

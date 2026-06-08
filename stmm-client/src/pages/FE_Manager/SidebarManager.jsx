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
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SidebarManager({ currentPage, navigate }) {
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
        <div className="user-avatar">M</div>
        <div className="user-info">
          <span className="user-name">Manager</span>
          <span className="user-role">Quản trị viên</span>
        </div>
      </div>
    </aside>
  );
}

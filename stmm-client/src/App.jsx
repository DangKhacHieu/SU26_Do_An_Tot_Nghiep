import { useState } from 'react';
import SidebarManager from './pages/FE_Manager/SidebarManager';
import DashboardManager from './pages/FE_Manager/DashboardManager';
import UserListManager from './pages/FE_Manager/UserListManager';
import UserFormManager from './pages/FE_Manager/UserFormManager';
import UserDetailManager from './pages/FE_Manager/UserDetailManager';
import './App.css';

const PAGE_TITLES = {
  dashboard: { title: 'Tổng quan hệ thống', sub: 'Thống kê tổng hợp và trạng thái hoạt động của MHMS.' },
  users:     { title: 'Quản lý Tài khoản', sub: 'Danh sách, phân quyền và quản trị tài khoản thành viên.' },
  form:      { title: 'Đăng ký / Chỉnh sửa Tài khoản', sub: 'Nhập đầy đủ thông tin để tạo hoặc cập nhật tài khoản.' },
  detail:    { title: 'Chi tiết Tài khoản', sub: 'Thông tin đầy đủ và lịch sử hoạt động của tài khoản.' },
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const navigate = (page, id = null) => {
    setCurrentUserId(id);
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardManager addToast={addToast} navigate={navigate} />;
      case 'users':     return <UserListManager navigate={navigate} addToast={addToast} />;
      case 'form':      return <UserFormManager userId={currentUserId} navigate={navigate} addToast={addToast} />;
      case 'detail':    return <UserDetailManager userId={currentUserId} navigate={navigate} addToast={addToast} />;
      default:          return <DashboardManager addToast={addToast} navigate={navigate} />;
    }
  };

  const pageInfo = PAGE_TITLES[currentPage] || PAGE_TITLES['dashboard'];

  const toastIcon = (type) => {
    if (type === 'success') return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
    if (type === 'error') return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  };

  return (
    <div className="app-container">
      {/* ── SIDEBAR ── */}
      <SidebarManager currentPage={currentPage} navigate={navigate} />

      {/* ── MAIN ── */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-title-section">
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.sub}</p>
          </div>
        </header>

        <div className="dashboard-content">
          {renderPage()}
        </div>
      </main>

      {/* ── TOASTS ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-message ${t.type}`}>
            <span className={`toast-icon ${t.type}`}>{toastIcon(t.type)}</span>
            <div className="toast-text">{t.message}</div>
            <button className="toast-close" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

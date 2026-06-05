import { useState } from 'react';
import SidebarManager from './pages/FE_Manager/SidebarManager';
import DashboardManager from './pages/FE_Manager/DashboardManager';
import UserListManager from './pages/FE_Manager/UserListManager';
import UserFormManager from './pages/FE_Manager/UserFormManager';
import UserDetailManager from './pages/FE_Manager/UserDetailManager';
import ContentListManager from './pages/FE_Manager/ContentListManager';
import ContentFormManager from './pages/FE_Manager/ContentFormManager';
import ContentDetailManager from './pages/FE_Manager/ContentDetailManager';
import FaqListManager from './pages/FE_Manager/FaqListManager';
import FaqFormManager from './pages/FE_Manager/FaqFormManager';

// Admin System Imports
import SidebarAdminSystem from './pages/FE_AdminSystem/SidebarAdminSystem';
import DashboardAdminSystem from './pages/FE_AdminSystem/DashboardAdminSystem';
import UserListAdminSystem from './pages/FE_AdminSystem/UserListAdminSystem';
import UserFormAdminSystem from './pages/FE_AdminSystem/UserFormAdminSystem';
import UserDetailAdminSystem from './pages/FE_AdminSystem/UserDetailAdminSystem';

import './App.css';

const PAGE_TITLES = {
  dashboard: { title: 'Tổng quan hệ thống', sub: 'Thống kê tổng hợp và trạng thái hoạt động của MHMS.' },
  users:     { title: 'Quản lý Tài khoản', sub: 'Danh sách, phân quyền và quản trị tài khoản thành viên.' },
  form:      { title: 'Đăng ký / Chỉnh sửa Tài khoản', sub: 'Nhập đầy đủ thông tin để tạo hoặc cập nhật tài khoản.' },
  detail:    { title: 'Chi tiết Tài khoản', sub: 'Thông tin đầy đủ và lịch sử hoạt động của tài khoản.' },
  content:   { title: 'Quản lý Tin tức & Thông báo', sub: 'Quản lý các bài viết trên trang chủ và thông báo theo vai trò.' },
  'content-form': { title: 'Tạo / Cập nhật Tin tức & Thông báo', sub: 'Nhập nội dung tiêu đề, phân loại và cấu hình gửi.' },
  'content-detail': { title: 'Chi tiết Tin tức & Thông báo', sub: 'Xem trước nội dung chi tiết bài viết hoặc thông báo đã gửi.' },
  faqs:      { title: 'Quản lý Câu hỏi thường gặp', sub: 'Xem, cập nhật, tạo mới danh sách FAQs hệ thống.' },
  'faq-form': { title: 'Tạo / Cập nhật FAQ', sub: 'Thêm hoặc chỉnh sửa thông tin câu hỏi thường gặp.' },
  
  // Admin System Titles
  'admin-dashboard': { title: 'Tổng quan hệ thống (Admin)', sub: 'Thống kê tổng hợp và quản trị toàn hệ thống.' },
  'admin-users':     { title: 'Quản lý Tài khoản (Admin)', sub: 'Danh sách và quản trị tài khoản toàn hệ thống.' },
  'admin-user-form': { title: 'Đăng ký / Chỉnh sửa Tài khoản (Admin)', sub: 'Nhập đầy đủ thông tin để tạo hoặc cập nhật tài khoản.' },
  'admin-user-detail': { title: 'Chi tiết Tài khoản (Admin)', sub: 'Thông tin đầy đủ và lịch sử hoạt động của tài khoản.' },
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
      case 'content':   return <ContentListManager navigate={navigate} addToast={addToast} />;
      case 'content-form': return <ContentFormManager contentId={currentUserId} navigate={navigate} addToast={addToast} />;
      case 'content-detail': return <ContentDetailManager contentId={currentUserId} navigate={navigate} addToast={addToast} />;
      case 'faqs':      return <FaqListManager navigate={navigate} addToast={addToast} />;
      case 'faq-form':  return <FaqFormManager faqId={currentUserId} navigate={navigate} addToast={addToast} />;
      
      // Admin System Pages
      case 'admin-dashboard': return <DashboardAdminSystem addToast={addToast} navigate={navigate} />;
      case 'admin-users':     return <UserListAdminSystem navigate={navigate} addToast={addToast} />;
      case 'admin-user-form': return <UserFormAdminSystem userId={currentUserId} navigate={navigate} addToast={addToast} />;
      case 'admin-user-detail': return <UserDetailAdminSystem userId={currentUserId} navigate={navigate} addToast={addToast} />;

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
      {currentPage.startsWith('admin-') ? (
        <SidebarAdminSystem currentPage={currentPage} navigate={navigate} />
      ) : (
        <SidebarManager currentPage={currentPage} navigate={navigate} />
      )}

      {/* ── MAIN ── */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-title-section">
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.sub}</p>
          </div>
          <div className="header-actions">
            <select
              value={currentPage.startsWith('admin-') ? 'admin' : 'manager'}
              onChange={(e) => {
                if (e.target.value === 'admin') {
                  navigate('admin-dashboard');
                } else {
                  navigate('dashboard');
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                background: '#f8fafc',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            >
              <option value="manager">Manager Console</option>
              <option value="admin">Admin System Console</option>
            </select>
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

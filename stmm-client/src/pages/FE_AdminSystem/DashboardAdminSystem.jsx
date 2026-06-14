import { useState, useEffect } from 'react';
import './DashboardAdminSystem.css';

const API_BASE = "http://localhost:5056/api/admin/users";

const STAT_CARDS = [
  { key: 'total',         label: 'Tổng Tài Khoản',        accent: '#8b5cf6', iconBg: '#f3e8ff',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: 'admin',         label: 'Admin System',          accent: '#a855f7', iconBg: '#f3e8ff',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg> },
  { key: 'manager',       label: 'Manager',               accent: '#f43f5e', iconBg: '#ffe4e6',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { key: 'staff',         label: 'Nhân Viên',              accent: '#2563eb', iconBg: '#dbeafe',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { key: 'accountant',    label: 'Kế Toán',               accent: '#7c3aed', iconBg: '#f3e8ff',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
];

export default function DashboardAdminSystem({ addToast, navigate }) {
  const [stats, setStats] = useState({ total: 0, admin: 0, manager: 0, staff: 0, accountant: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const users = await res.json();
        setStats({
          total:      users.length,
          admin:      users.filter(u => u.roleName.toLowerCase().includes('admin')).length,
          manager:    users.filter(u => u.roleName.toLowerCase() === 'manager').length,
          staff:      users.filter(u => u.roleName.toLowerCase() === 'staff').length,
          accountant: users.filter(u => u.roleName.toLowerCase() === 'accountant').length,
        });
      } else throw new Error();
    } catch {
      addToast('Không thể tải thống kê Admin. Đảm bảo Backend đã khởi động.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="stat-card" style={{ '--accent-color': card.accent, '--icon-bg': card.iconBg }}>
            <div className="stat-header">
              <span className="stat-title">{card.label}</span>
              <div className="stat-icon-wrap">{card.icon}</div>
            </div>
            <span className="stat-value">{loading ? '—' : stats[card.key]}</span>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="info-grid">
        {/* Task list */}
        <div className="info-card">
          <h3 className="info-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Nhiệm vụ của Admin System
          </h3>
          <ul className="task-list">
            <li><span className="task-bullet" />Quản trị, khởi tạo tài khoản của tất cả vai trò (Admin, Manager, Staff, v.v.) trong hệ thống.</li>
            <li><span className="task-bullet" />Khóa / Mở khóa và quản trị trạng thái của tất cả tài khoản.</li>
            <li><span className="task-bullet" />Hỗ trợ đặt lại mật khẩu trực tiếp cho thành viên khi cần thiết.</li>
            <li><span className="task-bullet" />Xem thông tin chi tiết và kiểm tra tính hợp lệ dữ liệu tài khoản.</li>
          </ul>
        </div>

        {/* System status */}
        <div className="info-card">
          <h3 className="info-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Trạng thái máy chủ
          </h3>
          <table className="sys-table">
            <tbody>
              <tr><td>Cơ sở dữ liệu</td><td><span className="sys-badge">PostgreSQL (Aiven)</span></td></tr>
              <tr><td>Backend API</td><td><span className="sys-badge font-admin-accent">ASP.NET Core 9 (Active)</span></td></tr>
              <tr><td>Phân hệ API</td><td><span className="sys-badge font-admin-accent">/api/admin/*</span></td></tr>
              <tr><td>Hồ sơ Admin</td><td><span className="sys-badge font-admin-accent">Toàn quyền (Superadmin)</span></td></tr>
              <tr><td>Dữ liệu</td><td><span className="sys-badge">Thời gian thực</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

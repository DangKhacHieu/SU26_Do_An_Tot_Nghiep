import { useState, useEffect } from 'react';
import './DashboardManager.css';

const API_BASE = "http://localhost:5056/api/manager/users";

const STAT_CARDS = [
  { key: 'total',     label: 'Tổng Tài Khoản',        accent: '#6366f1', iconBg: '#eef2ff',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: 'staff',     label: 'Nhân Viên',              accent: '#2563eb', iconBg: '#dbeafe',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { key: 'accountant',label: 'Kế Toán',               accent: '#7c3aed', iconBg: '#f3e8ff',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { key: 'vendor',    label: 'Tiểu Thương',            accent: '#0f766e', iconBg: '#ccfbf1',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: 'customer',  label: 'Người Dân',              accent: '#d97706', iconBg: '#fef9c3',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
];

export default function DashboardManager({ addToast, navigate }) {
  const [stats, setStats] = useState({ total: 0, staff: 0, accountant: 0, vendor: 0, customer: 0 });
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
          staff:      users.filter(u => u.roleName.toLowerCase() === 'staff').length,
          accountant: users.filter(u => u.roleName.toLowerCase() === 'accountant').length,
          vendor:     users.filter(u => u.roleName.toLowerCase() === 'vendor').length,
          customer:   users.filter(u => u.roleName.toLowerCase() === 'customer').length,
        });
      } else throw new Error();
    } catch {
      addToast('Không thể tải thống kê. Đảm bảo Backend đã khởi động.', 'error');
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
            Nhiệm vụ của Manager
          </h3>
          <ul className="task-list">
            <li><span className="task-bullet" />Đăng ký, khởi tạo tài khoản ban quản lý chợ và tiểu thương.</li>
            <li><span className="task-bullet" />Kiểm soát, chỉnh sửa thông tin người dùng và phân quyền vai trò.</li>
            <li><span className="task-bullet" />Khóa / Mở khóa tài khoản vi phạm nội quy.</li>
            <li><span className="task-bullet" />Xóa mềm (soft delete) người dùng để đảm bảo toàn vẹn dữ liệu lịch sử.</li>
          </ul>
        </div>

        {/* System status */}
        <div className="info-card">
          <h3 className="info-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Thông tin Hệ thống
          </h3>
          <table className="sys-table">
            <tbody>
              <tr><td>Cơ sở dữ liệu</td><td><span className="sys-badge">PostgreSQL</span></td></tr>
              <tr><td>Backend API</td><td><span className="sys-badge">ASP.NET Core 9</span></td></tr>
              <tr><td>Frontend</td><td><span className="sys-badge">React + Vite</span></td></tr>
              <tr><td>Bảo mật</td><td><span className="sys-badge">BCrypt</span></td></tr>
              <tr><td>Dữ liệu</td><td><span className="sys-badge">Live (No Mock)</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

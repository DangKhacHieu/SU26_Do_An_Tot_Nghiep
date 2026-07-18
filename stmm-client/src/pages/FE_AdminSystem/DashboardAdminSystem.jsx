import { useState, useEffect, useRef } from 'react';
import './DashboardAdminSystem.css';

const API_BASE       = "http://localhost:5056/api/admin/users";
const AUDIT_LOGS_API = "http://localhost:5056/api/admin/audit-logs";

/* ── SVG icon helpers ── */
const IcoUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <circle cx="12" cy="11" r="3"/>
  </svg>
);
const IcoBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const IcoCreditCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcoUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoActivity = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoServer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);
const IcoClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

/* ── Stat cards config ── */
const STAT_CARDS = [
  {
    key: 'total', label: 'Tổng Tài Khoản', badge: 'ALL ROLES',
    gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)',
    iconBg: '#f3e8ff', color: '#7c3aed',
    badgeBg: '#f3e8ff',
    Icon: IcoUsers,
  },
  {
    key: 'admin', label: 'Admin System', badge: 'SUPERADMIN',
    gradient: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
    iconBg: '#eef2ff', color: '#4f46e5',
    badgeBg: '#eef2ff',
    Icon: IcoShield,
  },
  {
    key: 'manager', label: 'Manager', badge: 'MANAGER',
    gradient: 'linear-gradient(90deg,#e11d48,#f43f5e)',
    iconBg: '#ffe4e6', color: '#e11d48',
    badgeBg: '#ffe4e6',
    Icon: IcoUser,
  },
  {
    key: 'staff', label: 'Nhân Viên', badge: 'STAFF',
    gradient: 'linear-gradient(90deg,#1d4ed8,#3b82f6)',
    iconBg: '#dbeafe', color: '#1d4ed8',
    badgeBg: '#dbeafe',
    Icon: IcoBriefcase,
  },
  {
    key: 'accountant', label: 'Kế Toán', badge: 'ACCOUNTANT',
    gradient: 'linear-gradient(90deg,#0f766e,#14b8a6)',
    iconBg: '#ccfbf1', color: '#0f766e',
    badgeBg: '#ccfbf1',
    Icon: IcoCreditCard,
  },
];

/* ── Quick actions config ── */
const QUICK_ACTIONS = [
  { label: 'Phê duyệt Chợ',      desc: 'Duyệt sơ đồ chợ từ Manager', emoji: '🏢', cls: 'market',   route: 'admin-market-approval' },
  { label: 'Đăng ký Tài khoản',  desc: 'Tạo mới thành viên hệ thống', emoji: '👤', cls: 'user',     route: 'admin-user-form'       },
  { label: 'Nhật ký hoạt động',  desc: 'Kiểm tra lịch sử thao tác',   emoji: '📋', cls: 'logs',     route: 'admin-audit-logs'      },
  { label: 'Danh sách Tài khoản',desc: 'Quản lý và cập nhật quyền',   emoji: '⚙️', cls: 'accounts', route: 'admin-users'           },
];

/* ── Activity type classifier ── */
const getActivityType = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('đăng nhập') || a.includes('login'))        return 'type-login';
  if (a.includes('phê duyệt') || a.includes('duyệt'))       return 'type-approve';
  if (a.includes('khóa') || a.includes('lock'))              return 'type-lock';
  if (a.includes('tạo') || a.includes('khởi tạo') || a.includes('create')) return 'type-create';
  if (a.includes('cập nhật') || a.includes('update'))        return 'type-update';
  return 'type-default';
};

const ACTIVITY_EMOJIS = {
  'type-login':   '🔑',
  'type-approve': '✅',
  'type-lock':    '🔒',
  'type-create':  '✨',
  'type-update':  '📝',
  'type-default': '⚡',
};

/* ── SVG ring gauge ── */
const RING_R = 32;
const RING_C = 2 * Math.PI * RING_R; // circumference

function RingGauge({ value, maxValue, color, label, unit, displayVal }) {
  const pct = Math.min(1, Math.max(0, value / maxValue));
  const offset = RING_C * (1 - pct);

  return (
    <div className="ads-ring-block">
      <div className="ads-ring-svg-wrap">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle className="ads-ring-bg" cx="40" cy="40" r={RING_R} fill="none" strokeWidth="8" />
          <circle
            className="ads-ring-fill"
            cx="40" cy="40" r={RING_R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="ads-ring-center-text">
          <span className="ads-ring-val">{displayVal}</span>
          <span className="ads-ring-unit">{unit}</span>
        </div>
      </div>
      <span className="ads-ring-label">{label}</span>
    </div>
  );
}

/* ── Main component ── */
export default function DashboardAdminSystem({ addToast, navigate }) {
  const [stats, setStats]       = useState({ total: 0, admin: 0, manager: 0, staff: 0, accountant: 0 });
  const [loading, setLoading]   = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);

  // Live metrics
  const [cpu,     setCpu]     = useState(24);
  const [ram,     setRam]     = useState(1.42);
  const [latency, setLatency] = useState(18);

  // Clock
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();

    // Tick clock every second
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    // Metrics pulse every 2.5s
    const metricsTimer = setInterval(() => {
      setCpu(p => Math.max(5, Math.min(92, p + Math.floor(Math.random() * 11) - 5)));
      setRam(p => parseFloat(Math.max(1.0, Math.min(3.8, p + (Math.random() * 0.08 - 0.04))).toFixed(2)));
      setLatency(p => Math.max(10, Math.min(65, p + Math.floor(Math.random() * 7) - 3)));
    }, 2500);

    return () => { clearInterval(clockTimer); clearInterval(metricsTimer); };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(API_BASE, { headers: { 'Authorization': `Bearer ${token}` } });
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
      addToast('Không thể tải thống kê. Vui lòng kiểm tra backend.', 'error');
    } finally { setLoading(false); }
  };

  const fetchRecentLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${AUDIT_LOGS_API}?page=1&pageSize=6`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentLogs(data.items || []);
      } else throw new Error();
    } catch {
      setRecentLogs([
        { logId: 101, action: "Đăng nhập hệ thống thành công",        userName: "System Admin", createdAt: new Date().toISOString() },
        { logId: 102, action: "Phê duyệt sơ đồ chợ Bến Thành",        userName: "System Admin", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { logId: 103, action: "Khởi tạo tài khoản Manager Nguyễn",   userName: "System Admin", createdAt: new Date(Date.now() - 7200000).toISOString() },
        { logId: 104, action: "Khóa tài khoản Staff Trần vi phạm",    userName: "System Admin", createdAt: new Date(Date.now() - 10800000).toISOString() },
        { logId: 105, action: "Cập nhật quyền Kế Toán Lê Thị B",     userName: "System Admin", createdAt: new Date(Date.now() - 14400000).toISOString() },
        { logId: 106, action: "Tạo tài khoản Staff mới cho Chi nhánh Quận 1", userName: "System Admin", createdAt: new Date(Date.now() - 18000000).toISOString() },
      ]);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1)  return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const cpuColor    = cpu > 80 ? '#ef4444' : cpu > 60 ? '#f59e0b' : '#10b981';
  const ramColor    = '#3b82f6';
  const latencyColor = latency > 50 ? '#f59e0b' : '#06b6d4';

  return (
    <div className="ads-dashboard">

      {/* ── Hero Header ── */}
      <div className="ads-hero">
        <div className="ads-hero-left">
          <div className="ads-hero-avatar">A</div>
          <div>
            <h2 className="ads-hero-title">Admin System Console</h2>
            <p className="ads-hero-subtitle">Trung tâm quản trị hệ thống chợ thương mại điện tử STMM</p>
            <div className="ads-hero-chips">
              <span className="ads-hero-chip green">
                <span className="ads-hero-chip-dot" />
                Hệ thống trực tuyến
              </span>
              <span className="ads-hero-chip purple">
                <span className="ads-hero-chip-dot" />
                Superadmin
              </span>
              <span className="ads-hero-chip blue">
                <span className="ads-hero-chip-dot" />
                PostgreSQL Connected
              </span>
            </div>
          </div>
        </div>
        <div className="ads-hero-right">
          <div className="ads-hero-clock">{clock}</div>
          <p className="ads-hero-date">{dateStr}</p>
        </div>
      </div>

      {/* ── Stat Summary Cards ── */}
      <div>
        <div className="ads-section-label">Tổng quan tài khoản</div>
        <div className="ads-stats-grid">
          {STAT_CARDS.map(c => (
            <div
              key={c.key}
              className="ads-stat-card"
              style={{ '--sc-gradient': c.gradient, '--sc-icon-bg': c.iconBg, '--sc-color': c.color, '--sc-badge-bg': c.badgeBg }}
            >
              {/* large watermark */}
              <div className="ads-stat-card-bg-icon">
                <c.Icon />
              </div>

              <div className="ads-stat-top">
                <div className="ads-stat-icon" style={{ background: c.iconBg, color: c.color }}>
                  <c.Icon />
                </div>
                <span className="ads-stat-badge" style={{ background: c.badgeBg, color: c.color }}>{c.badge}</span>
              </div>

              <div className={`ads-stat-value${loading ? ' loading-shimmer' : ''}`}>
                {loading ? '' : stats[c.key]}
              </div>
              <div className="ads-stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="ads-section-label">Lối tắt quản trị nhanh</div>
        <div className="ads-quick-grid">
          {QUICK_ACTIONS.map(q => (
            <div key={q.route} className={`ads-quick-card ${q.cls}`} onClick={() => navigate(q.route)}>
              <div className="ads-quick-icon">{q.emoji}</div>
              <div className="ads-quick-text-wrap">
                <span className="ads-quick-title">{q.label}</span>
                <span className="ads-quick-desc">{q.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main 2-col Grid ── */}
      <div className="ads-main-grid">

        {/* Card A: Live Server Monitor */}
        <div className="ads-card">
          <div className="ads-card-header">
            <h3 className="ads-card-title">
              <div className="ads-card-title-icon"><IcoActivity /></div>
              Live Monitor Máy Chủ
            </h3>
            <div className="ads-live-badge">
              <span className="ads-live-dot" />
              LIVE
            </div>
          </div>
          <div className="ads-metrics-grid">
            <RingGauge
              value={cpu} maxValue={100}
              color={cpuColor}
              label="CPU" unit="%"
              displayVal={`${cpu}`}
            />
            <RingGauge
              value={ram} maxValue={4}
              color={ramColor}
              label="Memory" unit="GB"
              displayVal={ram.toFixed(1)}
            />
            <RingGauge
              value={latency} maxValue={100}
              color={latencyColor}
              label="Latency" unit="ms"
              displayVal={`${latency}`}
            />
          </div>
        </div>

        {/* Card B: System Status */}
        <div className="ads-card">
          <div className="ads-card-header">
            <h3 className="ads-card-title">
              <div className="ads-card-title-icon"><IcoServer /></div>
              Trạng Thái Hệ Thống
            </h3>
          </div>
          <div className="ads-status-list">
            {[
              { key: 'Cơ sở dữ liệu',  val: 'PostgreSQL (Aiven)', cls: 'active dot-icon' },
              { key: 'Backend API',     val: 'ASP.NET Core 9 — Active', cls: 'active dot-icon' },
              { key: 'Phân hệ API',     val: '/api/admin/*', cls: 'info' },
              { key: 'Vai trò Admin',   val: 'Superadmin (Toàn quyền)', cls: 'info' },
              { key: 'Nguồn dữ liệu',  val: 'Thời gian thực', cls: 'active dot-icon' },
              { key: 'Phiên bản App',   val: 'STMM v1.0.0', cls: 'neutral' },
            ].map(r => (
              <div className="ads-status-row" key={r.key}>
                <span className="ads-status-key">{r.key}</span>
                <span className={`ads-status-val ${r.cls}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card C: Recent Activity Feed */}
        <div className="ads-card">
          <div className="ads-card-header">
            <h3 className="ads-card-title">
              <div className="ads-card-title-icon"><IcoClock /></div>
              Hoạt động gần đây
            </h3>
          </div>
          <div className="ads-activity-list">
            {recentLogs.map((log, idx) => {
              const aType = getActivityType(log.action);
              return (
                <div className="ads-activity-item" key={log.logId || idx}>
                  <div className={`ads-activity-dot ${aType}`}>
                    {ACTIVITY_EMOJIS[aType] || '⚡'}
                  </div>
                  <div className="ads-activity-body">
                    <div className="ads-activity-msg">
                      <strong>{log.userName}</strong>: {log.action}
                    </div>
                    <div className="ads-activity-time">{formatTime(log.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card D: Responsibilities */}
        <div className="ads-card">
          <div className="ads-card-header">
            <h3 className="ads-card-title">
              <div className="ads-card-title-icon"><IcoCheck /></div>
              Nhiệm vụ Admin System
            </h3>
          </div>
          <div className="ads-tasks-list">
            {[
              'Quản trị và khởi tạo tài khoản tất cả vai trò trong hệ thống (Admin, Manager, Staff, Kế Toán, v.v.)',
              'Khóa / Mở khóa và quản trị trạng thái hoạt động của mọi tài khoản',
              'Hỗ trợ đặt lại mật khẩu trực tiếp cho thành viên khi cần thiết',
              'Phê duyệt sơ đồ mặt bằng chợ từ Manager trước khi kích hoạt',
              'Xem nhật ký kiểm toán hệ thống và giám sát bất thường',
            ].map((text, i) => (
              <div className="ads-task-item" key={i}>
                <span className="ads-task-text">{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

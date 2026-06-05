import "../AppDashboard.css";

function AdminDashboard({ user, onBack, onLogout }) {
  const displayName = user?.name || user?.email || "Admin";

  return (
    <main className="role-dashboard-page">
      <section className="role-dashboard-card">
        <div className="role-dashboard-logo">A</div>

        <p className="role-dashboard-badge">ADMIN</p>

        <h1>Admin Dashboard</h1>

        <p className="role-dashboard-desc">
          Đây là dashboard giả định cho Admin. Dùng để test chuyển trang sau khi
          đăng nhập.
        </p>

        <div className="role-dashboard-user">
          <span>Current user</span>
          <strong>{displayName}</strong>
        </div>

        <div className="role-dashboard-menu">
          <div>Quản lý người dùng</div>
          <div>Quản lý phân quyền</div>
          <div>Quản lý hệ thống</div>
          <div>Xem báo cáo tổng quan</div>
        </div>

        <div className="role-dashboard-actions">
          <button
            type="button"
            className="role-dashboard-primary-btn"
            onClick={onBack}
          >
            Về Home
          </button>

          <button
            type="button"
            className="role-dashboard-light-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;

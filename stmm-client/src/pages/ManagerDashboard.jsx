import "../AppDashboard.css";

function ManagerDashboard({ user, onBack, onLogout }) {
  const displayName = user?.name || user?.email || "Manager";

  return (
    <main className="role-dashboard-page">
      <section className="role-dashboard-card">
        <div className="role-dashboard-logo">M</div>

        <p className="role-dashboard-badge">MANAGER</p>

        <h1>Manager Dashboard</h1>

        <p className="role-dashboard-desc">
          Đây là dashboard giả định cho Manager. Dùng để test tài khoản quản lý.
        </p>

        <div className="role-dashboard-user">
          <span>Current user</span>
          <strong>{displayName}</strong>
        </div>

        <div className="role-dashboard-menu">
          <div>Duyệt sản phẩm</div>
          <div>Duyệt gian hàng</div>
          <div>Theo dõi nhân viên</div>
          <div>Xem báo cáo vận hành</div>
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

export default ManagerDashboard;

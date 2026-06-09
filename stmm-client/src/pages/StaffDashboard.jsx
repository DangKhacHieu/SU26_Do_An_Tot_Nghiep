import "../AppDashboard.css";

function StaffDashboard({ user, onBack, onLogout }) {
  const displayName = user?.name || user?.email || "Staff";

  return (
    <main className="role-dashboard-page">
      <section className="role-dashboard-card">
        <div className="role-dashboard-logo">S</div>

        <p className="role-dashboard-badge">STAFF</p>

        <h1>Staff Dashboard</h1>

        <p className="role-dashboard-desc">
          Đây là dashboard giả định cho Staff. Dùng để test tài khoản nhân viên.
        </p>

        <div className="role-dashboard-user">
          <span>Current user</span>
          <strong>{displayName}</strong>
        </div>

        <div className="role-dashboard-menu">
          <div>Xử lý đơn hàng</div>
          <div>Kiểm tra sản phẩm</div>
          <div>Hỗ trợ khách hàng</div>
          <div>Cập nhật trạng thái đơn</div>
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

export default StaffDashboard;

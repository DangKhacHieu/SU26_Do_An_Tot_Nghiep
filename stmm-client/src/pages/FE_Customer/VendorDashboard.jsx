import "../../AppDashboard.css";

function VendorDashboard({ user, onBack, onLogout }) {
  const displayName = user?.name || user?.email || "Vendor";

  return (
    <main className="role-dashboard-page">
      <section className="role-dashboard-card">
        <div className="role-dashboard-logo">V</div>

        <p className="role-dashboard-badge">VENDOR</p>

        <h1>Vendor Dashboard</h1>

        <p className="role-dashboard-desc">
          Đây là dashboard giả định cho Vendor. Dùng để test tài khoản nhà bán
          hàng.
        </p>

        <div className="role-dashboard-user">
          <span>Current user</span>
          <strong>{displayName}</strong>
        </div>

        <div className="role-dashboard-menu">
          <div>Quản lý gian hàng</div>
          <div>Quản lý sản phẩm</div>
          <div>Quản lý đơn hàng</div>
          <div>Xem doanh thu</div>
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

export default VendorDashboard;

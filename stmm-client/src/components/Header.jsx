import "./Header.css";

export default function Header({ user, onGoToLogin, onGoToProfile, onLogout }) {
  return (
    <header className="site-header">
      <div className="header-brand">Smart Market</div>

      <nav className="header-nav">
        <button type="button" className="nav-link active">
          Overview
        </button>
        <button type="button" className="nav-link">
          Stall Map
        </button>
        <button type="button" className="nav-link">
          News
        </button>
        <button type="button" className="nav-link">
          Dashboard
        </button>
      </nav>

      <div className="header-actions">
        <div className="search-box">
          <input type="text" placeholder="Search stalls..." />
        </div>
        <button type="button" className="icon-btn" aria-label="Notifications">
          🔔
        </button>
        {user ? (
          <div className="profile-group">
            <button
              type="button"
              className="avatar-btn"
              onClick={onGoToProfile}
              aria-label="View profile"
              title="View profile"
            >
              {user.name
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </button>
            <button type="button" className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button type="button" className="login-btn" onClick={onGoToLogin}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}

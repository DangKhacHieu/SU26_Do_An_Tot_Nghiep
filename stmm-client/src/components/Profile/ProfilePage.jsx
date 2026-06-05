import Header from "../Header";
import Footer from "../Footer";
import "./ProfilePage.css";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfilePage({
  user,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onGoToEditProfile,
  onGoToChangePassword,
  onLogout,
}) {
  if (!user) {
    return (
      <>
        <Header
          user={user}
          onGoToLogin={onGoToLogin}
          onGoToProfile={onGoToProfile}
          onLogout={onLogout}
        />
        <main className="profile-page profile-page-empty">
          <section className="profile-empty-card">
            <h2>Không tìm thấy người dùng</h2>
            <button
              type="button"
              className="profile-empty-back"
              onClick={onBack}
            >
              Quay lại
            </button>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const initials = getInitials(user.name);
  const firstName = user.name?.split(" ")[0] || user.name;

  const notifications = [
    {
      title: "Weekend Offer: 20% Off Organic Produce",
      description: "Only 2 days left to claim your discount at Stall #05.",
      time: "2 hours ago",
    },
    {
      title: "Transaction Successful",
      description:
        "You have successfully topped up 2,000,000 VND into STMM Wallet.",
      time: "Yesterday",
    },
    {
      title: "+150 Reward Points",
      description: "Thank you for your feedback on StallMap services.",
      time: "3 days ago",
    },
  ];

  return (
    <>
      <Header
        user={user}
        onGoToLogin={onGoToLogin}
        onGoToProfile={onGoToProfile}
        onLogout={onLogout}
      />
      <main className="profile-page">
        <div className="profile-page-shell">
          <div className="profile-page-header">
            <div>
              <p className="profile-page-tag">Smart Market</p>
              <h1>Good morning, {firstName}!</h1>
              <p className="profile-page-copy">
                Check today&apos;s market updates and offers for you.
              </p>
            </div>
            <button type="button" className="profile-back-btn" onClick={onBack}>
              Back to homepage
            </button>
          </div>

          <div className="profile-summary-grid">
            <article className="summary-card wallet-card">
              <div className="summary-card-top">
                <span>STMM Wallet</span>
                <strong>Available Balance</strong>
              </div>
              <div className="summary-card-value">12,850,000 VND</div>
              <button type="button" className="summary-card-action">
                Top Up
              </button>
            </article>

            <article className="summary-card points-card">
              <div className="summary-card-top">
                <span>Reward Points</span>
                <strong>Last 6 months</strong>
              </div>
              <div className="summary-card-value">2,450</div>
              <p className="summary-card-note">+12% this month</p>
            </article>

            <article className="summary-card notification-card">
              <div className="summary-card-top">
                <span>Latest Notifications</span>
                <strong>4 new alerts</strong>
              </div>
              <p className="summary-card-note">
                Review your recent activity and important messages.
              </p>
            </article>
          </div>

          <div className="profile-page-grid">
            <section className="profile-detail-card">
              <div className="profile-detail-head">
                <div className="profile-avatar-large">{initials}</div>
                <div>
                  <span className="profile-role-badge">{user.roleName}</span>
                  <h2>{user.name}</h2>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="profile-detail-list">
                <div className="profile-detail-item">
                  <span>Phone number</span>
                  <strong>{user.phone || "Chưa cập nhật"}</strong>
                </div>
                <div className="profile-detail-item">
                  <span>Account status</span>
                  <strong>{user.status || "Active"}</strong>
                </div>
                <div className="profile-detail-item">
                  <span>Member ID</span>
                  <strong>{user.userId}</strong>
                </div>
              </div>

              <div className="profile-detail-actions">
                <button
                  type="button"
                  onClick={onBack}
                  className="profile-action-btn"
                >
                  Back to homepage
                </button>
                <button
                  type="button"
                  onClick={onGoToEditProfile}
                  className="profile-action-btn profile-action-primary"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={onGoToChangePassword}
                  className="profile-action-btn profile-action-secondary"
                >
                  Change Password
                </button>
              </div>
            </section>

            <section className="profile-activity-card">
              <div className="activity-header">
                <div>
                  <h3>Latest Notifications</h3>
                  <p>Recent events and reminders for your account.</p>
                </div>
                <button type="button" className="link-button">
                  View all
                </button>
              </div>

              <ul className="activity-list">
                {notifications.map((item, index) => (
                  <li className="activity-item" key={index}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                    <span>{item.time}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import notificationService from "../../services/notificationService";
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
  onGoToNotifications,
  onLogout,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoti, setSelectedNoti] = useState(null);

  const handleSelectNotification = async (item) => {
    setSelectedNoti(item);
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.notiId);
        setNotifications((prev) =>
          prev.map((n) => (n.notiId === item.notiId ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    }
  };

  const displayedNotifications = notifications.slice(0, 3);

  useEffect(() => {
    if (user && user.userId) {
      notificationService
        .getNotifications(user.userId, user.roleName)
        .then((data) => {
          const sorted = (data || []).sort((a, b) => {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });
          setNotifications(sorted);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi khi lấy thông báo:", err);
          setLoading(false);
        });
    }
  }, [user]);

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
                <strong>{notifications.filter(n => !n.isRead).length} new alerts</strong>
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
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="link-button"
                    onClick={onGoToNotifications}
                  >
                    Xem tất cả
                  </button>
                )}
              </div>

              <ul className="activity-list">
                {loading ? (
                  <li className="activity-item-empty">
                    <span>Đang tải thông báo...</span>
                  </li>
                ) : notifications.length === 0 ? (
                  <li className="activity-item-empty">
                    <span>Không có thông báo nào.</span>
                  </li>
                ) : (
                  displayedNotifications.map((item, index) => (
                    <li
                      className={`activity-item ${item.isRead ? "" : "unread"}`}
                      key={item.notiId || index}
                      onClick={() => handleSelectNotification(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="activity-item-header">
                        <div className="activity-item-title-row">
                          {!item.isRead && <span className="unread-dot" title="Chưa đọc"></span>}
                          <h4 className="activity-item-title">{item.title}</h4>
                        </div>
                        {item.notiType && (
                          <span className={`activity-item-tag ${item.notiType.toLowerCase()}`}>
                            {item.notiType}
                          </span>
                        )}
                      </div>
                      <p className="activity-item-content">{item.content}</p>
                      <span className="activity-item-time">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      </main>

      {selectedNoti && (
        <div className="noti-modal-overlay" onClick={() => setSelectedNoti(null)}>
          <div className="noti-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="noti-modal-header">
              <span className={`activity-item-tag ${selectedNoti.notiType ? selectedNoti.notiType.toLowerCase() : "default"}`}>
                {selectedNoti.notiType || "Thông báo"}
              </span>
              <button className="noti-modal-close" onClick={() => setSelectedNoti(null)}>
                &times;
              </button>
            </div>
            <h3 className="noti-modal-title">{selectedNoti.title}</h3>
            <p className="noti-modal-body">{selectedNoti.content}</p>
            <div className="noti-modal-footer">
              <span className="noti-modal-time">
                Nhận lúc: {selectedNoti.createdAt ? new Date(selectedNoti.createdAt).toLocaleString("vi-VN") : ""}
              </span>
              <button className="noti-modal-btn" onClick={() => setSelectedNoti(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

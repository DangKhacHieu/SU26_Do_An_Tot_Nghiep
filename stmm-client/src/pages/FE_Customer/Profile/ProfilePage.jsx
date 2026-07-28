import { useTranslation } from 'react-i18next';
import { useEffect, useState } from "react";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import notificationService from "../../../services/notificationService";
import "./ProfilePage.css";

function getInitials(name) {
  const { t } = useTranslation();

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
  onGoToStallsMap,
  onLogout,
}) {
  const { t } = useTranslation();
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
        console.error(t('profilepage.error_when_marking_read'), err);
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
          console.error(t('profilepage.error_while_getting_notification'), err);
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
          onGoToNotifications={onGoToNotifications}
          onGoToStallsMap={onGoToStallsMap}
          onLogout={onLogout}
        />
        <main className="profile-page profile-page-empty">
          <section className="profile-empty-card">
            <h2>{t("profilepage.user_not_found")}</h2>
            <button
              type="button"
              className="profile-empty-back"
              onClick={onBack}
            >
              {t("common.back")}
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
        onGoToNotifications={onGoToNotifications}
        onGoToStallsMap={onGoToStallsMap}
        onLogout={onLogout}
      />
      <main className="profile-page">
        <div className="profile-page-shell">
          <div className="profile-page-header">
            <div>
              <p className="profile-page-tag">{t("profilepage.smart_market")}</p>
              <h1>{t("profilepage.greeting", { name: firstName })}</h1>
              <p className="profile-page-copy">
                {t("profilepage.header_subtitle")}
              </p>
            </div>

            <button type="button" className="profile-back-btn" onClick={onBack}>
              {t("profilepage.back_to_home")}
            </button>
          </div>

          <div className="profile-page-grid">
            {/* Left Column: User Profile Card */}
            <section className="profile-detail-card">
              <div className="profile-detail-head">
                <div className="profile-avatar-large">{initials}</div>
                <div className="profile-head-info">
                  <div className="profile-badges-row">
                    <span className="profile-role-badge">{user.roleName || "Customer"}</span>
                    <span className="profile-status-badge">
                      <span className="status-dot"></span>
                      {user.status || t("profilepage.active")}
                    </span>
                  </div>
                  <h2>{user.name}</h2>
                  <p className="profile-email-text">{user.email}</p>
                </div>
              </div>

              <div className="profile-detail-list">
                <div className="profile-detail-item">
                  <div className="item-label-group">
                    <span className="item-icon">📱</span>
                    <span>{t("profilepage.phone_number")}</span>
                  </div>
                  <strong>{user.phone || t("profilepage.not_updated")}</strong>
                </div>

                <div className="profile-detail-item">
                  <div className="item-label-group">
                    <span className="item-icon">🪪</span>
                    <span>{t("profilepage.member_id")}</span>
                  </div>
                  <strong>#{user.userId}</strong>
                </div>
              </div>

              <div className="profile-detail-actions">
                <button
                  type="button"
                  onClick={onGoToEditProfile}
                  className="profile-action-btn profile-action-primary"
                >
                  ✏️ {t("profilepage.edit_profile")}
                </button>
                <button
                  type="button"
                  onClick={onGoToChangePassword}
                  className="profile-action-btn profile-action-secondary"
                >
                  🔒 {t("profilepage.change_password")}
                </button>
              </div>
            </section>

            {/* Right Column: Notifications & Activity Card */}
            <section className="profile-activity-card">
              <div className="activity-header">
                <div>
                  <h3>🔔 {t("profilepage.latest_notifications")}</h3>
                  <p>{t("profilepage.notifications_desc")}</p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="link-button"
                    onClick={onGoToNotifications}
                  >
                    {t("profilepage.view_all")} →
                  </button>
                )}
              </div>

              <ul className="activity-list">
                {loading ? (
                  <li className="activity-item-empty">
                    <span>{t("profilepage.loading_notifications")}</span>
                  </li>
                ) : notifications.length === 0 ? (
                  <li className="activity-item-empty">
                    <span>{t("profilepage.no_notifications")}</span>
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
                          {!item.isRead && <span className="unread-dot" title="Unread"></span>}
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
                          ? new Date(item.createdAt).toLocaleString()
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
                {selectedNoti.notiType || "Notification"}
              </span>
              <button className="noti-modal-close" onClick={() => setSelectedNoti(null)}>
                &times;
              </button>
            </div>
            <h3 className="noti-modal-title">{selectedNoti.title}</h3>
            <p className="noti-modal-body">{selectedNoti.content}</p>
            <div className="noti-modal-footer">
              <span className="noti-modal-time">
                {t("profilepage.received_at")} {selectedNoti.createdAt ? new Date(selectedNoti.createdAt).toLocaleString() : ""}
              </span>
              <button className="noti-modal-btn" onClick={() => setSelectedNoti(null)}>
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

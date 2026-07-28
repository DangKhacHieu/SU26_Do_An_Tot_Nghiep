import { useTranslation } from 'react-i18next';
import { useEffect, useState } from "react";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import notificationService from "../../../services/notificationService";
import "./NotificationListPage.css";

function TrashIcon() {
  const { t } = useTranslation();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

export default function NotificationListPage({
  user,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onGoToStallsMap,
  onLogout,
}) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoti, setSelectedNoti] = useState(null);

  const fetchNotifications = () => {
    if (user && user.userId) {
      setLoading(true);
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
          console.error(t('notificationlistpage.error_while_getting_notification'), err);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleSelectNotification = async (item) => {
    setSelectedNoti(item);
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.notiId);
        setNotifications((prev) =>
          prev.map((n) => (n.notiId === item.notiId ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error(t('notificationlistpage.error_when_marking_read'), err);
      }
    }
  };

  const handleDeleteNotification = async (e, item) => {
    e.stopPropagation(); // Prevents selection overlay from popping up
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        await notificationService.deleteNotification(item.notiId);
        setNotifications((prev) => prev.filter((n) => n.notiId !== item.notiId));
        if (selectedNoti && selectedNoti.notiId === item.notiId) {
          setSelectedNoti(null);
        }
      } catch (err) {
        console.error(t('notificationlistpage.error_when_deleting_notification'), err);
        alert(err instanceof Error ? err.message : "Failed to delete notification");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !user.userId) return;
    try {
      await notificationService.markAllAsRead(user.userId, user.roleName);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(t('notificationlistpage.error_marking_all_read'), err);
      alert(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    // Status filter
    if (filter === "unread" && item.isRead) return false;
    if (filter === "read" && !item.isRead) return false;

    // Search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(query);
      const contentMatch = item.content?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    }

    return true;
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  if (!user) {
    return (
      <>
        <Header
          user={user}
          onGoToLogin={onGoToLogin}
          onGoToProfile={onGoToProfile}
          onGoToStallsMap={onGoToStallsMap}
          onLogout={onLogout}
        />
        <main className="noti-list-page empty-page">
          <section className="noti-empty-card">
            <h2>User not found</h2>
            <button type="button" className="btn-back" onClick={onBack}>
              Back
            </button>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header
        user={user}
        onGoToLogin={onGoToLogin}
        onGoToProfile={onGoToProfile}
        onGoToStallsMap={onGoToStallsMap}
        onLogout={onLogout}
      />
      <main className="noti-list-page">
        <div className="noti-list-shell">
          <div className="noti-list-header">
            <div>
              <p className="noti-page-tag">Smart Market</p>
              <h1>All your notifications</h1>
              <p className="noti-page-copy">
                Manage and track all news, updates, and alerts from the system.
              </p>
            </div>
            <button type="button" className="btn-back" onClick={onGoToProfile}>
              ← Back to Profile
            </button>
          </div>

          <div className="noti-filter-bar">
            <div className="noti-filter-left">
              <div className="noti-status-filters">
                <button
                  type="button"
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filter === "unread" ? "active" : ""}`}
                  onClick={() => setFilter("unread")}
                >
                  Unread ({notifications.filter(n => !n.isRead).length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filter === "read" ? "active" : ""}`}
                  onClick={() => setFilter("read")}
                >
                  Read ({notifications.filter(n => n.isRead).length})
                </button>
              </div>
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                disabled={!hasUnread}
              >
                Mark all as read
              </button>
            </div>

            <div className="noti-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <section className="noti-list-card">
            <ul className="noti-full-list">
              {loading ? (
                <li className="noti-list-empty">Loading notifications list...</li>
              ) : filteredNotifications.length === 0 ? (
                <li className="noti-list-empty">No notifications found.</li>
              ) : (
                filteredNotifications.map((item, index) => (
                  <li
                    className={`noti-list-item ${item.isRead ? "" : "unread"}`}
                    key={item.notiId || index}
                    onClick={() => handleSelectNotification(item)}
                  >
                    <div className="noti-item-accent"></div>
                    <div className="noti-item-main">
                      <div className="noti-item-top">
                        <div className="noti-title-row">
                          {!item.isRead && <span className="noti-unread-dot"></span>}
                          <h3 className="noti-title">{item.title}</h3>
                        </div>
                        <div className="noti-item-actions">
                          {item.notiType && (
                            <span className={`noti-badge-tag ${item.notiType.toLowerCase()}`}>
                              {item.notiType}
                            </span>
                          )}
                          <button
                            type="button"
                            className="noti-delete-btn"
                            onClick={(e) => handleDeleteNotification(e, item)}
                            title="Delete notification"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      <p className="noti-content-preview">{item.content}</p>
                      <span className="noti-time-stamp">
                        Received at: {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                          : ""}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
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
                Received at: {selectedNoti.createdAt ? new Date(selectedNoti.createdAt).toLocaleString("en-US") : ""}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="noti-modal-btn noti-modal-delete-btn"
                  onClick={(e) => {
                    handleDeleteNotification(e, selectedNoti);
                  }}
                >
                  Delete
                </button>
                <button className="noti-modal-btn" onClick={() => setSelectedNoti(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}



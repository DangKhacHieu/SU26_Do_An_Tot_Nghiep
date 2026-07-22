import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Inbox, X } from "lucide-react";
import notificationService from "../../services/notificationService";
import "./StaffNotifications.css";

const formatDateTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function StaffNotifications({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const latestNotifications = useMemo(
    () =>
      [...notifications]
        .sort(
          (left, right) =>
            new Date(right.createdAt || 0) - new Date(left.createdAt || 0),
        )
        .slice(0, 5),
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const items = await notificationService.getNotifications();
      setNotifications(Array.isArray(items) ? items : []);
    } catch (loadError) {
      console.error("Unable to load Staff notifications:", loadError);
      setError(loadError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [onUnreadChange, unreadCount]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleOpen = async (item) => {
    if (item.isRead) return;

    try {
      await notificationService.markAsRead(item.notiId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.notiId === item.notiId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (markError) {
      console.error("Unable to mark Staff notification as read:", markError);
      setError(markError.message || "Unable to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    } catch (markError) {
      console.error("Unable to mark all Staff notifications as read:", markError);
      setError(markError.message || "Unable to mark all notifications as read.");
    }
  };

  return (
    <>
      <button
        type="button"
        className="staff-notification-popover-backdrop"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <section className="staff-notification-popover" role="dialog" aria-label="Notifications">
        <header>
          <div>
            <h2>Notifications</h2>
            <span>{unreadCount} unread</span>
          </div>
          <button type="button" className="staff-notification-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="staff-notification-popover-actions">
          <span>Latest updates</span>
          <button type="button" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={15} />
            Mark all as read
          </button>
        </div>

        {error ? <div className="staff-notification-error">{error}</div> : null}

        <div className="staff-notification-popover-list">
          {loading ? <div className="staff-notification-empty">Loading notifications...</div> : null}
          {!loading && latestNotifications.length === 0 ? (
            <div className="staff-notification-empty">
              <Inbox size={32} />
              <strong>No notifications yet</strong>
              <span>New task updates will appear here.</span>
            </div>
          ) : null}
          {!loading
            ? latestNotifications.map((item) => (
                <button
                  type="button"
                  key={item.notiId}
                  className={`staff-notification-item ${item.isRead ? "read" : "unread"}`}
                  onClick={() => handleOpen(item)}
                >
                  <span className="staff-notification-icon"><Bell size={16} /></span>
                  <span className="staff-notification-content">
                    <span className="staff-notification-heading">
                      <strong>{item.title || "Notification"}</strong>
                      {!item.isRead ? <span className="staff-unread-dot" /> : null}
                    </span>
                    <span className="staff-notification-message">{item.content}</span>
                    <span className="staff-notification-time">{formatDateTime(item.createdAt)}</span>
                  </span>
                </button>
              ))
            : null}
        </div>
      </section>
    </>
  );
}

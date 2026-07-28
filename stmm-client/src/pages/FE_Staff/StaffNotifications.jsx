import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Inbox, X } from "lucide-react";
import notificationService from "../../services/notificationService";
import "./StaffNotifications.css";

const formatDateTime = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (e) {
    console.error(e);
    return new Date(value).toLocaleString();
  }
};

export default function StaffNotifications({ onClose, onUnreadChange }) {
  const { t } = useTranslation();

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
      console.error(t('staffnotifications.unable_to_load_staff'), loadError);
      setError(loadError.message || t('staffnotifications.unable_to_load_notifications'));
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
      if (event.key === t('staffnotifications.escape')) onClose?.();
    };
    window.addEventListener(t('staffnotifications.keydown'), closeOnEscape);
    return () => window.removeEventListener(t('staffnotifications.keydown'), closeOnEscape);
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
      console.error(t('staffnotifications.unable_to_mark_staff'), markError);
      setError(markError.message || t('staffnotifications.unable_to_mark_notification'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    } catch (markError) {
      console.error(t('staffnotifications.unable_to_mark_all'), markError);
      setError(markError.message || t('staffnotifications.unable_to_mark_all'));
    }
  };

  return (
    <>
      <button
        type="button"
        className="staff-notification-popover-backdrop"
        aria-label={t('staffnotifications.close_notifications')}
        onClick={onClose}
      />
      <section className="staff-notification-popover" role={t('staffnotifications.dialog')} aria-label={t('staffnotifications.notifications')}>
        <header>
          <div>
            <h2>{t('staffnotifications.notifications')}</h2>
            <span>{unreadCount} unread</span>
          </div>
          <button type="button" className="staff-notification-close" onClick={onClose} aria-label={t('staffnotifications.close')}>
            <X size={18} />
          </button>
        </header>

        <div className="staff-notification-popover-actions">
          <span>{t('staffnotifications.latest_updates')}</span>
          <button type="button" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={15} />
            {t('staffnotifications.mark_all_as_read')}</button>
        </div>

        {error ? <div className="staff-notification-error">{error}</div> : null}

        <div className="staff-notification-popover-list">
          {loading ? <div className="staff-notification-empty">{t('staffnotifications.loading_notifications')}</div> : null}
          {!loading && latestNotifications.length === 0 ? (
            <div className="staff-notification-empty">
              <Inbox size={32} />
              <strong>{t('staffnotifications.no_notifications_yet')}</strong>
              <span>{t('staffnotifications.new_task_updates_will')}</span>
            </div>
          ) : null}
          {!loading
            ? latestNotifications.map((item) => (
                <button
                  type="button"
                  key={item.notiId}
                  className={`staff-notification-item ${item.isRead ? t('staffnotifications.read') : t('staffnotifications.unread')}`}
                  onClick={() => handleOpen(item)}
                >
                  <span className="staff-notification-icon"><Bell size={16} /></span>
                  <span className="staff-notification-content">
                    <span className="staff-notification-heading">
                      <strong>{item.title || t('staffnotifications.notification')}</strong>
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

import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Check, Inbox, Trash2, X, Calendar, Info, Search, ShieldAlert, AlertTriangle, ClipboardCheck } from "lucide-react";
import notificationService from "../../services/notificationService";
import { showConfirm, showError, showToast } from "../../utils/alert";
import "./StaffNotifications.css";

const formatDateTime = (value, locale) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (e) {
    console.error(e);
    return new Date(value).toLocaleString();
  }
};

const getNotificationIcon = (type) => {
  const t = String(type || '').toUpperCase();
  if (t.includes('TASK')) return <ClipboardCheck size={18} className="noti-icon-task" />;
  if (t.includes('VIOLATION')) return <ShieldAlert size={18} className="noti-icon-violation" />;
  if (t.includes('ISSUE')) return <AlertTriangle size={18} className="noti-icon-issue" />;
  return <Bell size={18} className="noti-icon-general" />;
};

export default function StaffNotifications({ onUnreadChange }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    if (filter === "unread") {
      list = list.filter((n) => !n.isRead);
    } else if (filter === "read") {
      list = list.filter((n) => n.isRead);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q)),
      );
    }

    return list.sort(
      (left, right) =>
        new Date(right.createdAt || 0) - new Date(left.createdAt || 0),
    );
  }, [notifications, filter, searchQuery]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setErrorKey("");
      const items = await notificationService.getNotifications();
      setNotifications(Array.isArray(items) ? items : []);
    } catch (loadError) {
      console.error("Unable to load staff notifications", loadError);
      setErrorKey('staffnotifications.unable_to_load_notifications');
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
      if (event.key === 'Escape' && selectedNotification) {
        setSelectedNotification(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedNotification]);

  const handleOpenDetail = async (item) => {
    setSelectedNotification(item);
    if (!item.isRead) {
      await handleMarkAsRead(item.notiId);
    }
  };

  const handleMarkAsRead = async (notiId, e) => {
    if (e) e.stopPropagation();
    try {
      setErrorKey("");
      await notificationService.markAsRead(notiId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.notiId === notiId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      if (selectedNotification?.notiId === notiId) {
        setSelectedNotification((prev) => prev ? { ...prev, isRead: true } : null);
      }
    } catch (markError) {
      console.error("Unable to mark notification as read", markError);
      setErrorKey('staffnotifications.unable_to_mark_notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setErrorKey("");
      await notificationService.markAllAsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
    } catch (markError) {
      console.error("Unable to mark all read", markError);
      setErrorKey('staffnotifications.unable_to_mark_all');
    }
  };

  const handleDelete = async (notiId, e) => {
    if (e) e.stopPropagation();
    const result = await showConfirm(
      t('staffnotifications.confirm_delete', 'Bạn có chắc chắn muốn xóa thông báo này?'),
      ''
    );
    if (!result.isConfirmed) return;

    try {
      setErrorKey("");
      setDeletingId(notiId);
      await notificationService.deleteNotification(notiId);
      setNotifications((current) =>
        current.filter((n) => n.notiId !== notiId),
      );
      if (selectedNotification?.notiId === notiId) {
        setSelectedNotification(null);
      }
      showToast(t('staffnotifications.deleted_successfully', 'Đã xóa thông báo thành công'), 'success');
    } catch (delError) {
      console.error("Unable to delete notification", delError);
      showError(t('staffnotifications.unable_to_delete', 'Không thể xóa thông báo'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="staff-notifications-page">
      {/* Header Banner */}
      <header className="staff-notifications-hero">
        <div className="staff-notifications-hero-content">
          <div className="staff-notifications-title-row">
            <h1>{t('staffnotifications.notifications', 'Thông báo')}</h1>
            {unreadCount > 0 && (
              <span className="unread-count-badge">
                {t('staffnotifications.unread_count', { count: unreadCount, defaultValue: `${unreadCount} chưa đọc` })}
              </span>
            )}
          </div>
          <p className="staff-notifications-subtitle">
            {t('staffnotifications.page_subtitle', 'Xem và quản lý tất cả các thông báo công việc, sự cố và vi phạm.')}
          </p>
        </div>
      </header>

      {/* Control Bar: Search, Filters, Mark All Read */}
      <div className="staff-notifications-controls">
        <div className="staff-notifications-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={t('staffnotifications.search_placeholder', 'Tìm kiếm thông báo...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="staff-notifications-actions-group">
          <div className="staff-notifications-tabs">
            <button
              type="button"
              className={`staff-noti-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('staffnotifications.all', 'Tất cả')} ({notifications.length})
            </button>
            <button
              type="button"
              className={`staff-noti-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              {t('staffnotifications.unread', 'Chưa đọc')} ({unreadCount})
            </button>
            <button
              type="button"
              className={`staff-noti-tab ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              {t('staffnotifications.read', 'Đã đọc')} ({notifications.length - unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="staff-noti-readall-btn"
              onClick={handleMarkAllRead}
              title={t('staffnotifications.mark_all_as_read', 'Đánh dấu tất cả đã đọc')}
            >
              <CheckCheck size={16} />
              <span>{t('staffnotifications.mark_all_as_read', 'Đánh dấu tất cả đã đọc')}</span>
            </button>
          )}
        </div>
      </div>

      {errorKey ? <div className="staff-notification-error">{t(errorKey)}</div> : null}

      {/* List of Notifications */}
      <section className="staff-notifications-list-container">
        {loading ? (
          <div className="staff-notification-empty">
            <div className="loading-spinner" />
            <span>{t('staffnotifications.loading_notifications', 'Đang tải thông báo...')}</span>
          </div>
        ) : null}

        {!loading && filteredNotifications.length === 0 ? (
          <div className="staff-notification-empty">
            <Inbox size={40} className="empty-icon" />
            <strong>
              {searchQuery
                ? t('staffnotifications.no_search_results', 'Không tìm thấy thông báo phù hợp')
                : filter === 'unread'
                ? t('staffnotifications.no_unread', 'Không có thông báo chưa đọc')
                : t('staffnotifications.no_notifications_yet', 'Chưa có thông báo nào')}
            </strong>
            <span>
              {t('staffnotifications.new_task_updates_will', 'Cập nhật về công việc và hệ thống sẽ xuất hiện ở đây.')}
            </span>
          </div>
        ) : null}

        {!loading && filteredNotifications.length > 0 ? (
          <div className="staff-notifications-grid">
            {filteredNotifications.map((item) => (
              <article
                key={item.notiId}
                className={`staff-notification-card ${item.isRead ? 'read' : 'unread'} ${deletingId === item.notiId ? 'deleting' : ''}`}
                onClick={() => handleOpenDetail(item)}
              >
                <div className="staff-notification-card-icon">
                  {getNotificationIcon(item.notiType)}
                </div>

                <div className="staff-notification-card-body">
                  <div className="staff-notification-card-header">
                    <h3 className="staff-notification-card-title">
                      {item.title || t('staffnotifications.notification', 'Thông báo')}
                    </h3>
                    {!item.isRead && (
                      <span className="staff-unread-dot" title={t('staffnotifications.unread', 'Chưa đọc')} />
                    )}
                  </div>
                  <p className="staff-notification-card-message">{item.content}</p>
                  <div className="staff-notification-card-meta">
                    <span className="staff-notification-card-time">
                      <Calendar size={13} /> {formatDateTime(item.createdAt, locale)}
                    </span>
                  </div>
                </div>

                <div className="staff-notification-card-actions" onClick={(e) => e.stopPropagation()}>
                  {!item.isRead && (
                    <button
                      type="button"
                      className="staff-noti-action-btn check"
                      title={t('staffnotifications.mark_read', 'Đánh dấu đã đọc')}
                      onClick={(e) => handleMarkAsRead(item.notiId, e)}
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="staff-noti-action-btn delete"
                    title={t('staffnotifications.delete', 'Xóa thông báo')}
                    onClick={(e) => handleDelete(item.notiId, e)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {/* Detail View Modal */}
      {selectedNotification && (
        <div className="staff-noti-detail-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="staff-noti-detail-modal" onClick={(e) => e.stopPropagation()}>
            <header className="staff-noti-detail-header">
              <div className="staff-noti-detail-title-group">
                <span className="staff-noti-detail-icon">
                  {getNotificationIcon(selectedNotification.notiType)}
                </span>
                <h3>{selectedNotification.title || t('staffnotifications.notification_details', 'Chi tiết thông báo')}</h3>
              </div>
              <button
                type="button"
                className="staff-notification-close"
                onClick={() => setSelectedNotification(null)}
                aria-label={t('staffnotifications.close', 'Đóng')}
              >
                <X size={18} />
              </button>
            </header>

            <div className="staff-noti-detail-meta">
              <span><Calendar size={14} /> {formatDateTime(selectedNotification.createdAt, locale)}</span>
              {selectedNotification.isRead ? (
                <span className="badge-read">{t('staffnotifications.read', 'Đã đọc')}</span>
              ) : (
                <span className="badge-unread">{t('staffnotifications.new', 'Mới')}</span>
              )}
            </div>

            <div className="staff-noti-detail-body">
              <p>{selectedNotification.content}</p>
            </div>

            <footer className="staff-noti-detail-footer">
              <button
                type="button"
                className="staff-btn-delete"
                onClick={(e) => handleDelete(selectedNotification.notiId, e)}
              >
                <Trash2 size={15} />
                <span>{t('staffnotifications.delete', 'Xóa')}</span>
              </button>
              <button
                type="button"
                className="staff-btn-close"
                onClick={() => setSelectedNotification(null)}
              >
                {t('staffnotifications.close', 'Đóng')}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}


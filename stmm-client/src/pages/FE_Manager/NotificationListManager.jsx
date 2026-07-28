import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import notificationService from "../../services/notificationService";
import "./NotificationListManager.css";

/* ── Inline Svg Icons for Premium Visuals ── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconCheckAll = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L7 17l-5-5" />
    <path d="M22 10l-7.5 7.5-3.5-3.5" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconBell = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconMailOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function NotificationListManager({ navigate, addToast }) {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoti, setSelectedNoti] = useState(null);
  
  // Custom Modal Confirmation state
  const [notiToDelete, setNotiToDelete] = useState(null);

  // Set Page Metadata
  useEffect(() => {
    const originalTitle = document.title;
    document.title = t('notificationlistmanager.stmm_system_notifications');

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", t('notificationlistmanager.notification_mailbox_of_mhms'));

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute("content", originalDesc);
        } else {
          metaDesc.remove();
        }
      }
    };
  }, []);

  // Fetch Notifications
  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      // Sorted descending by creation date
      const sorted = (data || []).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Error loading notifications:", err);
      addToast(err instanceof Error ? err.message : t('notificationlistmanager.unable_to_load_notification'), "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Select Notification & Mark as read automatically
  const handleSelectNoti = async (item) => {
    setSelectedNoti(item);
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.notiId);
        // Silent update local state to avoid flickering
        setNotifications((prev) =>
          prev.map((n) => (n.notiId === item.notiId ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount === 0) return;

    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Update selected if applicable
      if (selectedNoti && !selectedNoti.isRead) {
        setSelectedNoti({ ...selectedNoti, isRead: true });
      }
      addToast(`Đã đánh dấu ${unreadCount} thông báo là đã đọc.`, "success");
    } catch (err) {
      console.error("Error marking all as read:", err);
      addToast(err instanceof Error ? err.message : t('notificationlistmanager.failed_to_mark_all'), "error");
    }
  };

  // Trigger Delete Confirmation Modal
  const openDeleteConfirm = (e, item) => {
    e.stopPropagation(); // Avoid selecting item when clicking delete
    setNotiToDelete(item);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!notiToDelete) return;
    try {
      await notificationService.deleteNotification(notiToDelete.notiId);
      
      // Update list
      setNotifications((prev) => prev.filter((n) => n.notiId !== notiToDelete.notiId));
      
      // If deleted item is currently selected, clear selection
      if (selectedNoti && selectedNoti.notiId === notiToDelete.notiId) {
        setSelectedNoti(null);
      }
      
      addToast("Xóa thông báo thành công.", "success");
    } catch (err) {
      console.error("Error deleting notification:", err);
      addToast(err instanceof Error ? err.message : t('notificationlistmanager.delete_failure_message'), "error");
    } finally {
      setNotiToDelete(null);
    }
  };

  // Filtering Logic
  const filteredNotifications = notifications.filter((item) => {
    // Filter status
    if (filter === "unread" && item.isRead) return false;
    if (filter === "read" && !item.isRead) return false;

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const contentMatch = item.content?.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    }
    return true;
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Format Time Helper
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get Badges for Notification Types
  const renderTypeBadge = (type) => {
    if (!type) return null;
    const cleanType = type.trim().toUpperCase();
    let badgeClass = "badge-info";
    let text = type;

    if (cleanType === "WARNING") {
      badgeClass = "badge-warning";
      text = t('notificationlistmanager.warning');
    } else if (cleanType === "ALERT" || cleanType === "DANGER" || cleanType === "VIOLATION") {
      badgeClass = "badge-danger";
      text = t('notificationlistmanager.urgent');
    } else if (cleanType === "SYSTEM" || cleanType === "INFO") {
      badgeClass = "badge-info";
      text = t('notificationlistmanager.system');
    } else if (cleanType === "UTILITYREADING") {
      badgeClass = "badge-success";
      text = t('notificationlistmanager.write_down_electricity_and');
    } else if (cleanType === "CASHCOLLECTION") {
      badgeClass = "badge-purple";
      text = t('notificationlistmanager.collect_cash');
    } else if (cleanType === "CONTRACT" || cleanType === "LEASE") {
      badgeClass = "badge-orange";
      text = t('notificationlistmanager.contract');
    }

    return <span className={`noti-badge ${badgeClass}`}>{text}</span>;
  };

  return (
    <div className="noti-manager-container" id="noti-manager-container-id">
      {/* Upper toolbar controls */}
      <div className="noti-upper-actions">
        <div className="noti-tabs">
          <button
            type="button"
            className={`tab-item ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            className={`tab-item ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Chưa đọc ({unreadNotifications.length})
          </button>
          <button
            type="button"
            className={`tab-item ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Đã đọc ({notifications.length - unreadNotifications.length})
          </button>
        </div>

        <button
          type="button"
          className="btn-mark-all"
          disabled={unreadNotifications.length === 0}
          onClick={handleMarkAllAsRead}
        >
          <IconCheckAll />
          {t('notificationlistmanager.mark_all_as_read')}</button>
      </div>

      <div className="noti-workspace-split">
        {/* LEFT COLUMN: Search and List */}
        <div className="noti-list-side">
          <div className="noti-search-box-container">
            <div className="search-input-wrap">
              <IconSearch />
              <input
                type="text"
                className="search-field"
                placeholder={t('notificationlistmanager.search_for_notifications_title')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="noti-items-scrollable">
            {loading ? (
              <div className="noti-state-message">
                <div className="spinner-loader"></div>
                <p>{t('notificationlistmanager.loading_notification_list')}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="noti-state-message empty">
                <IconBell size={32} />
                <p>{t('notificationlistmanager.no_notifications_found')}</p>
                {searchQuery && <span className="small-sub text-muted">{t('notificationlistmanager.try_searching_with_other')}</span>}
              </div>
            ) : (
              <div className="noti-items-list">
                {filteredNotifications.map((item) => {
                  const isSelected = selectedNoti?.notiId === item.notiId;
                  return (
                    <div
                      key={item.notiId}
                      className={`noti-card-item ${isSelected ? "selected" : ""} ${
                        item.isRead ? "read" : "unread"
                      }`}
                      onClick={() => handleSelectNoti(item)}
                    >
                      <div className="card-sidebar-stripe"></div>
                      <div className="card-item-body">
                        <div className="card-item-header">
                          <div className="header-meta-group">
                            {!item.isRead && <span className="unread-dot-badge"></span>}
                            <span className="card-item-time">{formatTime(item.createdAt)}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-delete-card"
                            onClick={(e) => openDeleteConfirm(e, item)}
                            title={t('notificationlistmanager.delete_notification')}
                          >
                            <IconTrash />
                          </button>
                        </div>
                        <h4 className="card-item-title">{item.title}</h4>
                        <p className="card-item-preview">{item.content}</p>
                        <div className="card-item-footer">
                          {renderTypeBadge(item.notiType)}
                          {!item.isRead && (
                            <span className="card-unread-pill">{t('notificationlistmanager.new')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail Pane */}
        <div className="noti-details-side">
          {selectedNoti ? (
            <div className="noti-detail-wrapper animate-fade-in">
              <div className="detail-header">
                <div className="detail-meta">
                  {renderTypeBadge(selectedNoti.notiType)}
                  <span className="detail-timestamp">
                    Gửi lúc: {formatTime(selectedNoti.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-delete-detail"
                  onClick={(e) => openDeleteConfirm(e, selectedNoti)}
                >
                  <IconTrash /> {t('notificationlistmanager.delete_notification')}</button>
              </div>

              <h2 className="detail-title">{selectedNoti.title}</h2>

              <div className="detail-divider"></div>

              <div className="detail-body-container">
                <p className="detail-body-text">{selectedNoti.content}</p>
              </div>

              <div className="detail-footer">
                <div className="detail-sender-info">
                  <span className="sender-avatar">
                    <IconMailOpen />
                  </span>
                  <div className="sender-meta">
                    <span className="sender-name">{t('notificationlistmanager.notifications_from_the_mhms')}</span>
                    <span className="sender-sub">{selectedNoti.targetRole === 'Public' ? t('notificationlistmanager.entire_system') : `${t('notificationlistmanager.for')}: ${selectedNoti.targetRole}`}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="noti-detail-empty-state">
              <div className="empty-bell-circle animate-pulse">
                <IconBell size={48} />
              </div>
              <h3>{t('notificationlistmanager.notification_mailbox')}</h3>
              <p>{t('notificationlistmanager.select_any_notification_from')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Styled Confirmation Modal */}
      {notiToDelete && (
        <div className="custom-confirm-overlay">
          <div className="custom-confirm-card">
            <div className="confirm-header">
              <span className="confirm-icon-warning">⚠️</span>
              <h3>{t('notificationlistmanager.confirm_deletion_of_notification')}</h3>
            </div>
            <div className="confirm-body">
              <p>{t('notificationlistmanager.are_you_sure_you')}</p>
              <div className="confirm-noti-quote">
                <strong>{notiToDelete.title}</strong>
                <p>{notiToDelete.content?.substring(0, 80)}...</p>
              </div>
              <p className="confirm-warning-desc">{t('notificationlistmanager.this_action_cannot_be')}</p>
            </div>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => setNotiToDelete(null)}
              >
                {t('notificationlistmanager.cancel')}</button>
              <button
                type="button"
                className="btn-confirm-danger"
                onClick={confirmDelete}
              >
                {t('notificationlistmanager.delete_now')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import notificationService from "../../services/notificationService";
import "./NotificationListPage.css";

export default function NotificationListPage({
  user,
  onBack,
  onGoToLogin,
  onGoToProfile,
  onLogout,
}) {
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
          console.error("Lỗi khi lấy thông báo:", err);
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
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
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

  if (!user) {
    return (
      <>
        <Header
          user={user}
          onGoToLogin={onGoToLogin}
          onGoToProfile={onGoToProfile}
          onLogout={onLogout}
        />
        <main className="noti-list-page empty-page">
          <section className="noti-empty-card">
            <h2>Không tìm thấy người dùng</h2>
            <button type="button" className="btn-back" onClick={onBack}>
              Quay lại
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
        onLogout={onLogout}
      />
      <main className="noti-list-page">
        <div className="noti-list-shell">
          <div className="noti-list-header">
            <div>
              <p className="noti-page-tag">Smart Market</p>
              <h1>Tất cả thông báo của bạn</h1>
              <p className="noti-page-copy">
                Quản lý và theo dõi tất cả các tin tức, cập nhật và cảnh báo từ hệ thống.
              </p>
            </div>
            <button type="button" className="btn-back" onClick={onGoToProfile}>
              ← Quay lại Profile
            </button>
          </div>

          <div className="noti-filter-bar">
            <div className="noti-status-filters">
              <button
                type="button"
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === "unread" ? "active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                Chưa đọc ({notifications.filter(n => !n.isRead).length})
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === "read" ? "active" : ""}`}
                onClick={() => setFilter("read")}
              >
                Đã đọc ({notifications.filter(n => n.isRead).length})
              </button>
            </div>

            <div className="noti-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <section className="noti-list-card">
            <ul className="noti-full-list">
              {loading ? (
                <li className="noti-list-empty">Đang tải danh sách thông báo...</li>
              ) : filteredNotifications.length === 0 ? (
                <li className="noti-list-empty">Không tìm thấy thông báo nào.</li>
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
                        {item.notiType && (
                          <span className={`noti-badge-tag ${item.notiType.toLowerCase()}`}>
                            {item.notiType}
                          </span>
                        )}
                      </div>
                      <p className="noti-content-preview">{item.content}</p>
                      <span className="noti-time-stamp">
                        Nhận lúc: {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("vi-VN", {
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

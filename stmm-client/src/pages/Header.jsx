import { useEffect, useState, useRef } from "react";
import notificationService from "../services/notificationService";
import "./Header.css";

export default function Header({ user, onGoToLogin, onGoToProfile, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNoti, setSelectedNoti] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

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
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    onGoToProfile();
  };

  const handleLogoClick = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleItemClick = async (item) => {
    setIsOpen(false);
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="site-header">
        <div 
          className="header-brand" 
          onClick={handleLogoClick} 
          style={{ cursor: "pointer" }}
        >
          Smart Market
        </div>

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

          {user && (
            <div className="notification-container" ref={dropdownRef}>
              <button
                type="button"
                className="icon-btn"
                aria-label="Notifications"
                onClick={toggleDropdown}
              >
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {isOpen && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h4>Thông báo</h4>
                    {unreadCount > 0 && <span className="unread-count-badge">{unreadCount} chưa đọc</span>}
                  </div>
                  <ul className="dropdown-list">
                    {loading ? (
                      <li className="dropdown-item-empty">Đang tải...</li>
                    ) : notifications.length === 0 ? (
                      <li className="dropdown-item-empty">Không có thông báo mới</li>
                    ) : (
                      notifications.slice(0, 5).map((item, index) => (
                        <li
                          className={`dropdown-item ${item.isRead ? "" : "unread"}`}
                          key={item.notiId || index}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="dropdown-item-title-row">
                            <span className="item-title">{item.title}</span>
                            {!item.isRead && <span className="item-unread-dot"></span>}
                          </div>
                          <p className="item-content">{item.content}</p>
                          <span className="item-time">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                })
                              : ""}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="dropdown-footer">
                    <button type="button" className="view-all-btn" onClick={handleViewAll}>
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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

      {/* Popup Modal mờ hiển thị chi tiết thông báo trên tất cả các trang */}
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
    </>
  );
}

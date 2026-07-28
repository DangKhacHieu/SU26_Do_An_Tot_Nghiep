import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from "react";
import LanguageSwitcher from '../../../components/layout/LanguageSwitcher';
import notificationService from "../../../services/notificationService";
import { getAllMarkets } from "../../../services/marketApi";
import "./Header.css";

export default function Header({
  user,
  onGoToLogin,
  onGoToProfile,
  onGoToNotifications,
  onGoToStallsMap,
  onLogout,
}) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNoti, setSelectedNoti] = useState(null);
  const dropdownRef = useRef(null);

  const [markets, setMarkets] = useState([]);
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
  const marketDropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    getAllMarkets()
      .then((data) => {
        if (active) {
          setMarkets(data || []);
        }
      })
      .catch((err) => {
        console.error("Error loading markets in header:", err);
      });
    return () => {
      active = false;
    };
  }, []);

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
        console.error(t('header.error_while_getting_notification'), err);
        setLoading(false);
      });
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (
        marketDropdownRef.current &&
        !marketDropdownRef.current.contains(event.target)
      ) {
        setIsMarketDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
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
    if (onGoToNotifications) {
      onGoToNotifications();
    } else {
      onGoToProfile();
    }
  };

  const handleLogoClick = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleOverviewClick = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleStallsMapClick = () => {
    if (onGoToStallsMap) {
      onGoToStallsMap();
    } else {
      window.history.pushState({}, "", "/stalls-map");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleMarketClick = (marketId) => {
    setIsMarketDropdownOpen(false);
    if (onGoToStallsMap) {
      onGoToStallsMap(marketId);
    } else {
      window.history.pushState({}, "", `/stalls-map?marketId=${marketId}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleItemClick = async (item) => {
    setIsOpen(false);
    setSelectedNoti(item);
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.notiId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notiId === item.notiId ? { ...n, isRead: true } : n,
          ),
        );
      } catch (err) {
        console.error(t('header.error_when_marking_read'), err);
      }
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLogout) {
      onLogout();
    }
  };

  const handleSearchSuggestionClick = (marketId) => {
    setSearchQuery("");
    setShowSearchSuggestions(false);
    handleMarketClick(marketId);
  };

  const activeMarkets = markets.filter(
    (m) => (m.status || m.Status || "").toLowerCase() === "active"
  );

  const filteredMarkets = searchQuery.trim()
    ? activeMarkets.filter((m) =>
        m.marketName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="site-header">
        <div className="header-container">
          <div
            className="header-brand"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
          >
            Smart Market
          </div>

          <nav className="header-nav">
            <button
              type="button"
              className={`nav-link ${
                window.location.pathname === "/" ||
                window.location.pathname === ""
                  ? "active"
                  : ""
              }`}
              onClick={handleOverviewClick}
            >
              {t('header.overview')}
            </button>
            <div className="market-dropdown-container" ref={marketDropdownRef}>
              <button
                type="button"
                className={`nav-link dropdown-toggle ${
                  window.location.pathname.startsWith("/stalls-map") ? "active" : ""
                }`}
                onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
              >
                {t('header.market_map')}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`dropdown-arrow-svg ${isMarketDropdownOpen ? "open" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isMarketDropdownOpen && (
                <ul className="market-dropdown-menu">
                  {activeMarkets.length === 0 ? (
                    <li className="market-item-empty">{t('header.no_markets_available')}</li>
                  ) : (
                    activeMarkets.map((market) => (
                      <li
                        key={market.marketId}
                        className="market-item"
                        onClick={() => handleMarketClick(market.marketId)}
                      >
                        {market.marketName}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </nav>

          <div className="header-actions">
            <div className="search-box-container" ref={searchRef} style={{ position: "relative" }}>
              <div className="search-box">
                <input
                  type="text"
                  placeholder={t('header.search_markets')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                />
              </div>
              {showSearchSuggestions && filteredMarkets.length > 0 && (
                <ul className="search-suggestions-list">
                  {filteredMarkets.map((market) => (
                    <li
                      key={market.marketId}
                      onClick={() => handleSearchSuggestionClick(market.marketId)}
                    >
                      <div className="suggestion-info">
                        <strong>{market.marketName}</strong>
                        <span>{market.address}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {user && (
              <div className="notification-container" ref={dropdownRef}>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Notifications"
                  onClick={toggleDropdown}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {isOpen && (
                  <div className="notification-dropdown">
                    <div className="dropdown-header">
                      <h4>{t('header.notifications')}</h4>
                      {unreadCount > 0 && (
                        <span className="unread-count-badge">
                          {unreadCount} {t('header.unread')}
                        </span>
                      )}
                    </div>
                    <ul className="dropdown-list">
                      {loading ? (
                        <li className="dropdown-item-empty">{t('header.loading')}</li>
                      ) : notifications.length === 0 ? (
                        <li className="dropdown-item-empty">
                          {t('header.no_new_notifications')}
                        </li>
                      ) : (
                        notifications.slice(0, 5).map((item, index) => (
                          <li
                            className={`dropdown-item ${item.isRead ? "" : "unread"}`}
                            key={item.notiId || index}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="dropdown-item-title-row">
                              <span className="item-title">{item.title}</span>
                              {!item.isRead && (
                                <span className="item-unread-dot"></span>
                              )}
                            </div>
                            <p className="item-content">{item.content}</p>
                            <span className="item-time">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleString(
                                    i18n.language,
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                    },
                                  )
                                : ""}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="dropdown-footer">
                      <button
                        type="button"
                        className="view-all-btn"
                        onClick={handleViewAll}
                      >
                        {t('header.view_all_notifications')}
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
                  aria-label={t('header.view_profile')}
                  title={t('header.view_profile')}
                >
                  {user.name
                    .split(" ")
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </button>
                <button type="button" className="logout-btn" onClick={handleLogoutClick}>
                  {t('header.logout')}
                </button>
              </div>
            ) : (
              <button type="button" className="login-btn" onClick={onGoToLogin}>
                {t('header.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      {selectedNoti && (
        <div
          className="noti-modal-overlay"
          onClick={() => setSelectedNoti(null)}
        >
          <div
            className="noti-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="noti-modal-header">
              <span
                className={`activity-item-tag ${
                  selectedNoti.notiType
                    ? selectedNoti.notiType.toLowerCase()
                    : "default"
                }`}
              >
                {selectedNoti.notiType || t('header.notification_type')}
              </span>
              <button
                className="noti-modal-close"
                onClick={() => setSelectedNoti(null)}
              >
                &times;
              </button>
            </div>
            <h3 className="noti-modal-title">{selectedNoti.title}</h3>
            <p className="noti-modal-body">{selectedNoti.content}</p>
            <div className="noti-modal-footer">
              <span className="noti-modal-time">
                {t('header.received_at')}{" "}
                {selectedNoti.createdAt
                  ? new Date(selectedNoti.createdAt).toLocaleString(i18n.language)
                  : ""}
              </span>
              <button
                className="noti-modal-btn"
                onClick={() => setSelectedNoti(null)}
              >
                {t('header.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

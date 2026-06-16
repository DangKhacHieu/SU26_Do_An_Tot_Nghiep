import { useEffect, useState } from "react";
import "./App.css";
import "./AppDashboard.css";
import "./pages/FE_Staff/FE_Staff.css";

import HomePage from "./pages/FE_Customer/HomePage.jsx";
import LoginForm from "./pages/FE_Customer/LoginForm.jsx";
import RegisterForm from "./pages/FE_Customer/RegisterForm.jsx";
import ForgotPasswordForm from "./pages/FE_Customer/ForgotPasswordForm.jsx";
import ProfilePage from "./pages/FE_Customer/Profile/ProfilePage.jsx";
import ChangePasswordForm from "./pages/FE_Customer/Profile/ChangePasswordForm.jsx";
import EditProfileForm from "./pages/FE_Customer/Profile/EditProfileForm.jsx";
import NotificationListPage from "./pages/FE_Customer/Profile/NotificationListPage.jsx";

import authService from "./services/authService";

import VendorDashboard from "./pages/FE_Vendor/VendorDashboard.jsx";

// FE Staff Imports
import ViolationList from "./pages/FE_Staff/ViolationList";
import ViolationDetails from "./pages/FE_Staff/ViolationDetails";
import CreateViolationModal from "./pages/FE_Staff/CreateViolationModal";
import MeterReadingHistory from "./pages/FE_Staff/MeterReadingHistory";
import MeterDetail from "./pages/FE_Staff/MeterDetail";
import RecordMeterReadingModal from "./pages/FE_Staff/RecordMeterReadingModal";
import IssueList from "./pages/FE_Staff/IssueList";
import IssueDetails from "./pages/FE_Staff/IssueDetails";
import CreateIssueModal from "./pages/FE_Staff/CreateIssueModal";

// FE Manager Imports
import SidebarManager from "./pages/FE_Manager/SidebarManager";
import DashboardManager from "./pages/FE_Manager/DashboardManager";
import UserListManager from "./pages/FE_Manager/UserListManager";
import UserFormManager from "./pages/FE_Manager/UserFormManager";
import UserDetailManager from "./pages/FE_Manager/UserDetailManager";
import ContentListManager from "./pages/FE_Manager/ContentListManager";
import ContentFormManager from "./pages/FE_Manager/ContentFormManager";
import ContentDetailManager from "./pages/FE_Manager/ContentDetailManager";
import FaqListManager from "./pages/FE_Manager/FaqListManager";
import FaqFormManager from "./pages/FE_Manager/FaqFormManager";
import MarketAreaList from "./pages/FE_Manager/MarketArea/components/MarketAreaList";
import BusinessCategoryListManager from "./pages/FE_Manager/BusinessCategoryListManager";
import ContractListManager from "./pages/FE_Manager/ContractListManager";
import ContractDetailManager from "./pages/FE_Manager/ContractDetailManager";
import ContractFormManager from "./pages/FE_Manager/ContractFormManager";
import ProfileManager from "./pages/FE_Manager/ProfileManager";


// FE Admin System Imports
import SidebarAdminSystem from "./pages/FE_AdminSystem/SidebarAdminSystem";
import DashboardAdminSystem from "./pages/FE_AdminSystem/DashboardAdminSystem";
import UserListAdminSystem from "./pages/FE_AdminSystem/UserListAdminSystem";
import UserFormAdminSystem from "./pages/FE_AdminSystem/UserFormAdminSystem";
import UserDetailAdminSystem from "./pages/FE_AdminSystem/UserDetailAdminSystem";

const PAGE_TITLES = {
  dashboard: {
    title: "Tổng quan hệ thống",
    sub: "Thống kê tổng hợp và trạng thái hoạt động của MHMS.",
  },
  users: {
    title: "Quản lý Tài khoản",
    sub: "Danh sách, phân quyền và quản trị tài khoản thành viên.",
  },
  form: {
    title: "Đăng ký / Chỉnh sửa Tài khoản",
    sub: "Nhập đầy đủ thông tin để tạo hoặc cập nhật tài khoản.",
  },
  detail: {
    title: "Chi tiết Tài khoản",
    sub: "Thông tin đầy đủ và lịch sử hoạt động của tài khoản.",
  },
  content: {
    title: "Quản lý Tin tức & Thông báo",
    sub: "Quản lý các bài viết trên trang chủ và thông báo theo vai trò.",
  },
  "content-form": {
    title: "Tạo / Cập nhật Tin tức & Thông báo",
    sub: "Nhập nội dung tiêu đề, phân loại và cấu hình gửi.",
  },
  "content-detail": {
    title: "Chi tiết Tin tức & Thông báo",
    sub: "Xem trước nội dung chi tiết bài viết hoặc thông báo đã gửi.",
  },
  faqs: {
    title: "Quản lý Câu hỏi thường gặp",
    sub: "Xem, cập nhật, tạo mới danh sách FAQs hệ thống.",
  },
  "faq-form": {
    title: "Tạo / Cập nhật FAQ",
    sub: "Thêm hoặc chỉnh sửa thông tin câu hỏi thường gặp.",
  },
  "market-areas": {
    title: "Quản lý Mặt bằng",
    sub: "Thiết kế sơ đồ mặt bằng và quản lý các sạp hàng.",
  },
  "business-categories": {
    title: "Quản lý Danh mục Kinh doanh",
    sub: "Quản lý danh mục ngành hàng, hàng hóa kinh doanh tại quầy sạp chợ.",
  },
  contracts: {
    title: "Quản lý Hợp đồng",
    sub: "Quản lý, gia hạn, chấm dứt và in hợp đồng thuê ki-ốt.",
  },
  "contract-form": {
    title: "Tạo Hợp đồng Mới",
    sub: "Nhập thông tin chi tiết để tạo hợp đồng thuê sạp.",
  },
  "contract-detail": {
    title: "Chi tiết Hợp đồng",
    sub: "Xem thông tin chi tiết, xuất in bản cứng, hoặc đính kèm bản quét ký tên.",
  },
  "manager-profile": {
    title: "Thông tin cá nhân",
    sub: "Xem và cập nhật thông tin cá nhân hoặc thay đổi mật khẩu tài khoản.",
  },


  "admin-dashboard": {
    title: "Tổng quan hệ thống (Admin)",
    sub: "Thống kê tổng hợp và quản trị toàn hệ thống.",
  },
  "admin-users": {
    title: "Quản lý Tài khoản (Admin)",
    sub: "Danh sách và quản trị tài khoản toàn hệ thống.",
  },
  "admin-user-form": {
    title: "Đăng ký / Chỉnh sửa Tài khoản (Admin)",
    sub: "Nhập đầy đủ thông tin để tạo hoặc cập nhật tài khoản.",
  },
  "admin-user-detail": {
    title: "Chi tiết Tài khoản (Admin)",
    sub: "Thông tin đầy đủ và lịch sử hoạt động của tài khoản.",
  },
};

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState(authService.getUser());

  const navigatePath = (to) => {
    window.history.pushState({}, "", to);
    setPath(to);
  };

  useEffect(() => {
    setUser(authService.getUser());

    const handlePopState = () => {
      setPath(window.location.pathname);
      setUser(authService.getUser());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleLoginSuccess = (loginResult) => {
    const loginUser = loginResult?.user || null;
    const redirectPath = loginResult?.redirectUrl || "/";

    setUser(loginUser);
    navigatePath(redirectPath);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigatePath("/");
  };

  // =========================
  // Manager / Admin Console State
  // =========================
  const getInitialConsolePage = (currentPath) => {
    if (currentPath.startsWith("/admin")) {
      const parts = currentPath.split("/");
      const sub = parts[2];
      if (!sub) return "admin-dashboard";
      if (sub.startsWith("admin-")) return sub;
      return "admin-" + sub;
    }
    if (currentPath.startsWith("/manager")) {
      const parts = currentPath.split("/");
      const sub = parts[2];
      return sub || "dashboard";
    }
    return "dashboard";
  };

  const [currentPage, setCurrentPage] = useState(getInitialConsolePage(path));
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (path.startsWith("/admin") || path.startsWith("/manager")) {
      setCurrentPage(getInitialConsolePage(path));
    }
  }, [path]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const navigateConsole = (page, id = null) => {
    setCurrentUserId(id);
    setCurrentPage(page);

    let newPath = "";
    if (page.startsWith("admin-")) {
      const sub = page.substring(6); // e.g. "admin-users" -> "users"
      newPath = `/admin/${sub}`;
    } else {
      newPath = `/manager/${page}`;
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, "", newPath);
      setPath(newPath);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "manager-profile":
        return (
          <ProfileManager navigate={navigateConsole} addToast={addToast} />
        );

      case "dashboard":
        return (
          <DashboardManager addToast={addToast} navigate={navigateConsole} />
        );

      case "market-areas":
        return <MarketAreaList />;

      case "business-categories":
        return (
          <BusinessCategoryListManager
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "contracts":
        return (
          <ContractListManager
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "contract-form":
        return (
          <ContractFormManager
            contractId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "contract-detail":
        return (
          <ContractDetailManager
            contractId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );


      case "users":
        return (
          <UserListManager navigate={navigateConsole} addToast={addToast} />
        );

      case "form":
        return (
          <UserFormManager
            userId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "detail":
        return (
          <UserDetailManager
            userId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "content":
        return (
          <ContentListManager navigate={navigateConsole} addToast={addToast} />
        );

      case "content-form":
        return (
          <ContentFormManager
            contentId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "content-detail":
        return (
          <ContentDetailManager
            contentId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "faqs":
        return (
          <FaqListManager navigate={navigateConsole} addToast={addToast} />
        );

      case "faq-form":
        return (
          <FaqFormManager
            faqId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "admin-dashboard":
        return (
          <DashboardAdminSystem
            addToast={addToast}
            navigate={navigateConsole}
          />
        );

      case "admin-users":
        return (
          <UserListAdminSystem navigate={navigateConsole} addToast={addToast} />
        );

      case "admin-user-form":
        return (
          <UserFormAdminSystem
            userId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      case "admin-user-detail":
        return (
          <UserDetailAdminSystem
            userId={currentUserId}
            navigate={navigateConsole}
            addToast={addToast}
          />
        );

      default:
        return (
          <DashboardManager addToast={addToast} navigate={navigateConsole} />
        );
    }
  };

  const pageInfo = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;

  const toastIcon = (type) => {
    if (type === "success") {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }

    if (type === "error") {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    }

    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  };

  const renderManagerOrAdminConsole = () => {
    return (
      <div className="app-container">
        {currentPage.startsWith("admin-") ? (
          <SidebarAdminSystem
            currentPage={currentPage}
            navigate={navigateConsole}
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <SidebarManager
            currentPage={currentPage}
            navigate={navigateConsole}
            user={user}
            onLogout={handleLogout}
          />
        )}

        <main className="app-main">
          <header className="app-header">
            <div className="header-title-section">
              <h1>{pageInfo.title}</h1>
              <p>{pageInfo.sub}</p>
            </div>
          </header>

          <div className="dashboard-content">{renderPage()}</div>
        </main>

        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-message ${t.type}`}>
              <span className={`toast-icon ${t.type}`}>
                {toastIcon(t.type)}
              </span>
              <div className="toast-text">{t.message}</div>
              <button
                className="toast-close"
                onClick={() =>
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================
  // Staff Console State
  // =========================
  const [currentStaffView, setCurrentStaffView] = useState("dashboard");
  const [selectedViolationId, setSelectedViolationId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);

  const [selectedStallIdForMeters, setSelectedStallIdForMeters] = useState(1);
  const [selectedMeterIdForDetail, setSelectedMeterIdForDetail] =
    useState(null);
  const [showRecordReadingModal, setShowRecordReadingModal] = useState(false);

  const [userId, setUserId] = useState(1);
  const [baseUrl, setBaseUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:5056",
  );
  const [notification, setNotification] = useState(null);

  const handleShowNotification = (message, type = "success") => {
    setNotification({ message, type });

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleViewDetails = (id) => {
    setSelectedViolationId(id);
    setCurrentStaffView("violation-details");
  };

  const handleCreateSuccess = (newViolation) => {
    setShowCreateModal(false);
    handleShowNotification(
      `Successfully logged Violation: VIO-${newViolation.violationId}`,
    );

    if (currentStaffView === "violations") {
      setCurrentStaffView("temp");
      setTimeout(() => setCurrentStaffView("violations"), 10);
    } else {
      setCurrentStaffView("violations");
    }
  };

  const handleViewIssueDetails = (id) => {
    setSelectedIssueId(id);
    setCurrentStaffView("issue-details");
  };

  const handleCreateIssueSuccess = (newIssue) => {
    setShowCreateIssueModal(false);
    handleShowNotification(
      `Successfully logged Issue: ISS-${newIssue.issueId}`,
    );

    if (currentStaffView === "issues") {
      setCurrentStaffView("temp");
      setTimeout(() => setCurrentStaffView("issues"), 10);
    } else {
      setCurrentStaffView("issues");
    }
  };

  const renderStaffConsoleSwitcher = () => {
    return (
      <div className="header-actions">
        <select
          value="staff"
          onChange={(e) => {
            const mode = e.target.value;

            if (mode === "admin") {
              setCurrentPage("admin-dashboard");
              navigatePath("/admin/dashboard");
            }

            if (mode === "manager") {
              setCurrentPage("dashboard");
              navigatePath("/manager/dashboard");
            }

            if (mode === "staff") {
              navigatePath("/staff/dashboard");
            }
          }}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            background: "#f8fafc",
            color: "var(--text-main)",
            outline: "none",
          }}
        >
          <option value="manager">Manager Console</option>
          <option value="admin">Admin System Console</option>
          <option value="staff">Staff Console</option>
        </select>
      </div>
    );
  };

  const renderStaffConsole = () => {
    return (
      <div className="app-shell">
        <header className="dev-config-header">
          <div className="dev-logo-section">
            <strong>MHMS Staff Console</strong>{" "}
            <span className="dev-badge">TESTING TOOL</span>
          </div>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div className="dev-inputs-section">
              <div className="dev-input-group">
                <label>API Base URL:</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="e.g. http://localhost:5056"
                />
              </div>

              <div className="dev-input-group">
                <label>Current Staff ID:</label>
                <input
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>

              <div className="dev-input-group">
                <label>Stall ID for Meters:</label>
                <input
                  type="number"
                  value={selectedStallIdForMeters}
                  onChange={(e) =>
                    setSelectedStallIdForMeters(parseInt(e.target.value) || 1)
                  }
                  min="1"
                />
              </div>
            </div>

            {renderStaffConsoleSwitcher()}
          </div>
        </header>

        {notification && (
          <div className={`global-toast-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="app-body">
          <aside className="app-sidebar">
            <div className="sidebar-brand-section">
              <h2 className="sidebar-brand">MHMS STAFF</h2>
              <span className="sidebar-brand-sub">MANAGEMENT CONSOLE</span>
            </div>

            <nav className="sidebar-nav">
              <button
                className={`sidebar-nav-item ${currentStaffView === "dashboard" ? "active" : ""
                  }`}
                onClick={() => setCurrentStaffView("dashboard")}
              >
                <span className="sidebar-nav-icon">📊</span> Dashboard
              </button>

              <button
                className={`sidebar-nav-item ${currentStaffView === "tasks" ? "active" : ""
                  }`}
                onClick={() => setCurrentStaffView("tasks")}
              >
                <span className="sidebar-nav-icon">📋</span> Tasks
              </button>

              <button
                className={`sidebar-nav-item ${["meters", "meter-details"].includes(currentStaffView)
                  ? "active"
                  : ""
                  }`}
                onClick={() => setCurrentStaffView("meters")}
              >
                <span className="sidebar-nav-icon">⚡</span> Meters
              </button>

              <button
                className={`sidebar-nav-item ${["violations", "violation-details"].includes(currentStaffView)
                  ? "active"
                  : ""
                  }`}
                onClick={() => setCurrentStaffView("violations")}
              >
                <span className="sidebar-nav-icon">⚠️</span> Violations
              </button>

              <button
                className={`sidebar-nav-item ${["issues", "issue-details"].includes(currentStaffView)
                  ? "active"
                  : ""
                  }`}
                onClick={() => setCurrentStaffView("issues")}
              >
                <span className="sidebar-nav-icon">🔧</span> Issues
              </button>

              <button
                className={`sidebar-nav-item ${currentStaffView === "stall-list" ? "active" : ""
                  }`}
                onClick={() => setCurrentStaffView("stall-list")}
              >
                <span className="sidebar-nav-icon">🏪</span> List Stall
              </button>
            </nav>

            <div className="sidebar-footer">
              <button
                className="sidebar-nav-item logout-btn"
                onClick={handleLogout}
              >
                <span className="sidebar-nav-icon">🚪</span> LOGOUT
              </button>
            </div>
          </aside>

          <main className="app-main-content">
            <div className="main-top-navbar">
              <div className="navbar-title">Market Management</div>

              <div className="navbar-search-placeholder">
                <input type="text" placeholder="Search system..." disabled />
              </div>

              <div className="navbar-icons-placeholder">
                <span className="nav-icon" title="Notifications">
                  🔔
                </span>
                <span className="nav-icon" title="Help">
                  ❓
                </span>
                <span className="nav-icon" title="Settings">
                  ⚙️
                </span>
                <div className="user-profile-circle">
                  <span>SU</span>
                </div>
              </div>
            </div>

            <div className="main-content-scroll">
              {currentStaffView === "dashboard" && (
                <div className="mock-view">
                  <h1>📊 Staff Dashboard</h1>
                  <p>
                    Welcome to the Market Hall Management System MHMS staff
                    console.
                  </p>

                  <div className="mock-grid">
                    <div className="mock-card">
                      <h3>My Reported Violations</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentStaffView("violations")}
                      >
                        Go to Violations
                      </button>
                    </div>

                    <div className="mock-card">
                      <h3>Meter Readings</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentStaffView("meters")}
                      >
                        Go to Meters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStaffView === "tasks" && (
                <div className="mock-view">
                  <h1>📋 Tasks List</h1>
                  <p>Tasks assigned by management are listed here.</p>
                </div>
              )}

              {currentStaffView === "violations" && (
                <ViolationList
                  userId={userId}
                  baseUrl={baseUrl}
                  onViewDetails={handleViewDetails}
                  onOpenCreateModal={() => setShowCreateModal(true)}
                />
              )}

              {currentStaffView === "violation-details" && (
                <ViolationDetails
                  violationId={selectedViolationId}
                  userId={userId}
                  baseUrl={baseUrl}
                  onBack={() => setCurrentStaffView("violations")}
                />
              )}

              {currentStaffView === "meters" && (
                <MeterReadingHistory
                  stallId={selectedStallIdForMeters}
                  baseUrl={baseUrl}
                  userId={userId}
                  onViewMeterDetail={(meterId) => {
                    setSelectedMeterIdForDetail(meterId);
                    setCurrentStaffView("meter-details");
                  }}
                  onOpenRecordModal={() => setShowRecordReadingModal(true)}
                  onBack={() => setCurrentStaffView("dashboard")}
                />
              )}

              {currentStaffView === "meter-details" && (
                <MeterDetail
                  meterId={selectedMeterIdForDetail}
                  baseUrl={baseUrl}
                  onBack={() => setCurrentStaffView("meters")}
                />
              )}

              {currentStaffView === "issues" && (
                <IssueList
                  userId={userId}
                  baseUrl={baseUrl}
                  onViewDetails={handleViewIssueDetails}
                  onOpenCreateModal={() => setShowCreateIssueModal(true)}
                />
              )}

              {currentStaffView === "issue-details" && (
                <IssueDetails
                  issueId={selectedIssueId}
                  userId={userId}
                  baseUrl={baseUrl}
                  onBack={() => setCurrentStaffView("issues")}
                />
              )}

              {currentStaffView === "stall-list" && (
                <div className="mock-view">
                  <h1>🏪 Stalls Directory</h1>
                  <p>View layouts and categories of stalls in the market.</p>
                </div>
              )}

              {currentStaffView === "temp" && (
                <div className="loading-state">Loading...</div>
              )}
            </div>
          </main>
        </div>

        {showCreateModal && (
          <CreateViolationModal
            userId={userId}
            baseUrl={baseUrl}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {showCreateIssueModal && (
          <CreateIssueModal
            userId={userId}
            baseUrl={baseUrl}
            onClose={() => setShowCreateIssueModal(false)}
            onSuccess={handleCreateIssueSuccess}
          />
        )}

        {showRecordReadingModal && (
          <RecordMeterReadingModal
            stallId={selectedStallIdForMeters}
            baseUrl={baseUrl}
            userId={userId}
            onClose={() => setShowRecordReadingModal(false)}
            onSuccess={(newReading) => {
              setShowRecordReadingModal(false);
              handleShowNotification(
                `Successfully recorded reading: ${newReading.newValue} for meter ${newReading.meterSerialNumber}`,
              );

              if (currentStaffView === "meters") {
                setCurrentStaffView("temp");
                setTimeout(() => setCurrentStaffView("meters"), 10);
              }
            }}
          />
        )}
      </div>
    );
  };

  // =========================
  // Main Routes
  // =========================
  if (path === "/login") {
    return (
      <LoginForm
        onBack={() => navigatePath("/")}
        onGoToRegister={() => navigatePath("/register")}
        onGoToForgotPassword={() => navigatePath("/forgot-password")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (path === "/forgot-password") {
    return (
      <ForgotPasswordForm
        onBack={() => navigatePath("/login")}
        onGoToLogin={() => navigatePath("/login")}
      />
    );
  }

  if (path === "/register") {
    return (
      <RegisterForm
        onBack={() => navigatePath("/")}
        onGoToLogin={() => navigatePath("/login")}
        onRegistered={(loginResult) => {
          const loginUser = loginResult?.user || loginResult || null;
          const redirectPath = loginResult?.redirectUrl || "/";

          if (loginUser) {
            setUser(loginUser);
          }

          navigatePath(redirectPath);
        }}
      />
    );
  }

  if (path === "/profile") {
    return (
      <ProfilePage
        user={user}
        onBack={() => navigatePath("/")}
        onGoToLogin={() => navigatePath("/login")}
        onGoToProfile={() => navigatePath("/profile")}
        onGoToEditProfile={() => navigatePath("/edit-profile")}
        onGoToChangePassword={() => navigatePath("/change-password")}
        onGoToNotifications={() => navigatePath("/notifications")}
        onLogout={handleLogout}
      />
    );
  }

  if (path === "/notifications") {
    return (
      <NotificationListPage
        user={user}
        onBack={() => navigatePath("/")}
        onGoToLogin={() => navigatePath("/login")}
        onGoToProfile={() => navigatePath("/profile")}
        onLogout={handleLogout}
      />
    );
  }

  if (path === "/change-password") {
    return (
      <ChangePasswordForm
        onBack={() => navigatePath("/")}
        onPasswordChanged={() => navigatePath("/")}
      />
    );
  }

  if (path === "/edit-profile") {
    return (
      <EditProfileForm
        user={user}
        onBack={() => navigatePath("/profile")}
        onGoToLogin={() => navigatePath("/login")}
        onGoToProfile={() => navigatePath("/profile")}
        onLogout={handleLogout}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          navigatePath("/profile");
        }}
      />
    );
  }

  if (path.startsWith("/admin")) {
    return renderManagerOrAdminConsole();
  }

  if (path.startsWith("/manager")) {
    return renderManagerOrAdminConsole();
  }

  if (path === "/staff/dashboard") {
    return renderStaffConsole();
  }

  if (path === "/vendor/dashboard") {
    return (
      <VendorDashboard
        user={user}
        onBack={() => navigatePath("/")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <HomePage
      user={user}
      onGoToLogin={() => navigatePath("/login")}
      onGoToRegister={() => navigatePath("/register")}
      onGoToProfile={() => navigatePath("/profile")}
      onGoToChangePassword={() => navigatePath("/change-password")}
      onLogout={handleLogout}
    />
  );
}

export default App;

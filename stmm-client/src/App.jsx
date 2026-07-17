import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import "./App.css";
import "./AppDashboard.css";
import "./pages/FE_Staff/FE_Staff.css";

// FE Customer / Auth Imports
import HomePage from "./pages/FE_Customer/HomePage.jsx";
import LoginForm from "./pages/FE_Customer/Auth/LoginForm.jsx";
import RegisterForm from "./pages/FE_Customer/Auth/RegisterForm.jsx";
import ForgotPasswordForm from "./pages/FE_Customer/Auth/ForgotPasswordForm.jsx";
import ProfilePage from "./pages/FE_Customer/Profile/ProfilePage.jsx";
import ChangePasswordForm from "./pages/FE_Customer/Profile/ChangePasswordForm.jsx";
import EditProfileForm from "./pages/FE_Customer/Profile/EditProfileForm.jsx";
import NotificationListPage from "./pages/FE_Customer/Profile/NotificationListPage.jsx";
import MarketMapPage from "./pages/FE_Customer/Market/MarketMapPage.jsx";
import StallDetailPage from "./pages/FE_Customer/Market/StallDetailPage.jsx";

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
import StallList from "./pages/FE_Staff/StallList";
import StallInvoiceDetail from "./pages/FE_Staff/StallInvoiceDetail";
import TaskList from "./pages/FE_Staff/TaskList";
import TaskDetail from "./pages/FE_Staff/TaskDetail";
import TaskMapView from "./pages/FE_Staff/TaskMapView";
import SidebarStaff from "./pages/FE_Staff/SidebarStaff";
import ProfileStaff from "./pages/FE_Staff/ProfileStaff";

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
import TaskListManager from "./pages/FE_Manager/TaskListManager";
import TaskDetailManager from "./pages/FE_Manager/TaskDetailManager";
import MarketAreaList from "./pages/FE_Manager/MarketArea/components/MarketAreaList";
import MarketRoot from "./pages/FE_Manager/MarketArea/components/MarketRoot";
import BusinessCategoryListManager from "./pages/FE_Manager/BusinessCategoryListManager";
import ContractListManager from "./pages/FE_Manager/ContractListManager";
import ContractDetailManager from "./pages/FE_Manager/ContractDetailManager";
import ContractFormManager from "./pages/FE_Manager/ContractFormManager";
import ProfileManager from "./pages/FE_Manager/ProfileManager";
import RequestListManager from "./pages/FE_Manager/RequestListManager";
import RequestDetailManager from "./pages/FE_Manager/RequestDetailManager";
import ViolationListManager from "./pages/FE_Manager/ViolationListManager";
import ViolationDetailsManager from "./pages/FE_Manager/ViolationDetailsManager";
import IssueListManager from "./pages/FE_Manager/IssueListManager";
import IssueDetailManager from "./pages/FE_Manager/IssueDetailManager";
import MeterManagement from "./pages/FE_Manager/MeterManagement";
import NotificationListManager from "./pages/FE_Manager/NotificationListManager";

// FE Admin System Imports
import SidebarAdminSystem from "./pages/FE_AdminSystem/SidebarAdminSystem";
import DashboardAdminSystem from "./pages/FE_AdminSystem/DashboardAdminSystem";
import UserListAdminSystem from "./pages/FE_AdminSystem/UserListAdminSystem";
import UserFormAdminSystem from "./pages/FE_AdminSystem/UserFormAdminSystem";
import UserDetailAdminSystem from "./pages/FE_AdminSystem/UserDetailAdminSystem";
import MarketApprovalListAdminSystem from "./pages/FE_AdminSystem/MarketApprovalListAdminSystem";
import AuditLogListAdminSystem from "./pages/FE_AdminSystem/AuditLogListAdminSystem";

// Accountant Layout & Pages
import AccountantLayout from './components/layout/AccountantLayout';
import Dashboard from './pages/accountant/Dashboard';
import FinancialConfig from './pages/accountant/FinancialConfig';
import PeriodicInvoices from './pages/accountant/PeriodicInvoices';
import ViolationsPenalties from './pages/accountant/ViolationsPenalties';
import RepairPrice from './pages/accountant/RepairPrice';
import PaymentVerification from './pages/accountant/PaymentVerification';
import ProfileManagement from './pages/accountant/ProfileManagement';

// Guard components
function ProtectedRoute({ allowedRoles }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.includes(user.roleName)) {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

const PAGE_TITLES = {
  dashboard: {
    title: "Tổng quan hệ thống",
    sub: "Thống kê tổng hợp và trạng thái hoạt động của MHMS.",
  },
  notifications: {
    title: "Thông báo hệ thống",
    sub: "Quản lý và xem các thông báo, cập nhật từ hệ thống gửi tới ban quản lý.",
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
  "markets": {
    title: "Danh sách Chợ",
    sub: "Quản lý danh sách các chợ, tạo và thiết kế bản đồ chợ mới.",
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
  tasks: {
    title: "Tasks Management",
    sub: "Monitor, assign, and track all operational tasks.",
  },
  "task-details": {
    title: "Task Details",
    sub: "Full view of task summary, technical details, and log timeline.",
  },
  requests: {
    title: "Quản lý Yêu cầu",
    sub: "Xem và xử lý danh sách yêu cầu, kháng nghị từ tiểu thương.",
  },
  "request-detail": {
    title: "Chi tiết Yêu cầu",
    sub: "Xem thông tin chi tiết, báo giá và đánh giá của yêu cầu.",
  },
  violations: {
    title: "Danh sách Biên bản Vi phạm",
    sub: "Quản lý và giải quyết các biên bản vi phạm của quầy sạp.",
  },
  "violation-details": {
    title: "Chi tiết Biên bản Vi phạm",
    sub: "Xem thông tin chi tiết và xử lý kháng nghị của biên bản vi phạm.",
  },
  issues: {
    title: "Quản lý Sự cố Hạ tầng",
    sub: "Xem và xử lý danh sách sự cố báo cáo từ sạp hàng.",
  },
  "issue-details": {
    title: "Chi tiết Sự cố Hạ tầng",
    sub: "Chi tiết sự cố và thông tin xử lý/bàn giao tác vụ sửa chữa.",
  },
  meters: {
    title: "Quản lý Công tơ",
    sub: "Quản lý kho công tơ Điện/Nước khả dụng trong cùng chợ để tạo sạp.",
  },

  meters: {
    title: "Quản lý Công tơ",
    sub: "Quản lý kho công tơ Điện/Nước khả dụng trong cùng chợ để tạo sạp.",
  },

  // Admin System Titles
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
  "admin-audit-logs": {
    title: "Nhật ký hoạt động (Admin)",
    sub: "Giám sát lịch sử thao tác của các tài khoản quản trị.",
  },
};

const STAFF_PAGE_TITLES = {
  dashboard: {
    title: "Staff Dashboard",
    sub: "Welcome back! Here is your daily overview.",
  },
  tasks: {
    title: "Daily Tasks",
    sub: "View and update your assigned repair and maintenance tasks.",
  },
  "task-details": {
    title: "Task Details",
    sub: "Review task requirements, submit materials or report completion.",
  },
  meters: {
    title: "Stalls Utility Meters",
    sub: "Digitize and record electric and water meter readings.",
  },
  "meter-details": {
    title: "Meter Details",
    sub: "Detailed history and serial number tracking for utility meters.",
  },
  violations: {
    title: "Violations Log",
    sub: "Report and manage merchant rule compliance records.",
  },
  "violation-details": {
    title: "Violation Details",
    sub: "Full audit of logged merchant violation report.",
  },
  issues: {
    title: "Infrastructure Issues",
    sub: "Report and monitor facilities incidents.",
  },
  "issue-details": {
    title: "Issue Details",
    sub: "Detailed breakdown of facilities issue and repair status.",
  },
  "stall-list": {
    title: "Stalls Directory",
    sub: "Track stalls operations, debts, and invoice payments.",
  },
  "stall-invoices": {
    title: "Invoice Details",
    sub: "View service fee breakdown and record cash collection.",
  },
  profile: {
    title: "Staff Profile",
    sub: "View and update your personal information or change your password.",
  },
};

function StallDetailWrapper({ user, onLogout, navigatePath }) {
  const { id } = useParams();
  const stallId = parseInt(id) || 0;
  return (
    <StallDetailPage
      user={user}
      stallId={stallId}
      onBack={() => navigatePath("/stalls-map")}
      onGoToLogin={() => navigatePath("/login")}
      onGoToProfile={() => navigatePath("/profile")}
      onGoToNotifications={() => navigatePath("/notifications")}
      onGoToStallsMap={(mid) =>
        navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
      }
      onLogout={onLogout}
    />
  );
}

function MarketMapWrapper({ user, onLogout, navigatePath }) {
  const [searchParams] = useSearchParams();
  const marketId = parseInt(searchParams.get("marketId")) || 1;
  return (
    <MarketMapPage
      user={user}
      marketId={marketId}
      onBack={() => navigatePath("/")}
      onGoToLogin={() => navigatePath("/login")}
      onGoToProfile={() => navigatePath("/profile")}
      onGoToNotifications={() => navigatePath("/notifications")}
      onGoToStallsMap={(mid) =>
        navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
      }
      onGoToStallDetail={(id) => navigatePath("/stalls/" + id)}
      onLogout={onLogout}
    />
  );
}

function AppContent() {
  const routerNavigate = useNavigate();
  const [path, setPath] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);
  const [user, setUser] = useState(authService.getUser());

  const navigatePath = (to, replace = false) => {
    routerNavigate(to, { replace });
    setPath(to.split("?")[0]);
    setSearch(to.includes("?") ? to.substring(to.indexOf("?")) : "");
  };

  useEffect(() => {
    setUser(authService.getUser());

    const handlePopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
      setUser(authService.getUser());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Auto-redirect console roles (admin, manager, staff) to their respective dashboards if they try to access customer pages or auth pages
  useEffect(() => {
    if (user) {
      const role = user.roleName?.toLowerCase();
      const isAdmin = role === "admin" || role === "systemadmin" || role?.includes("admin");
      if (isAdmin && !path.startsWith("/admin/")) {
        navigatePath("/admin/dashboard", true);
      } else if (role === "manager" && !path.startsWith("/manager/")) {
        navigatePath("/manager/dashboard", true);
      } else if (role === "staff" && !path.startsWith("/staff/")) {
        navigatePath("/staff/dashboard", true);
      } else if (role === "vendor" && ["/login", "/register", "/forgot-password"].includes(path)) {
        navigatePath("/vendor/dashboard", true);
      } else if (role === "customer" && ["/login", "/register", "/forgot-password"].includes(path)) {
        navigatePath("/", true);
      }
    }
  }, [user, path]);

  const handleLoginSuccess = (loginResult) => {
    const loginUser = loginResult?.user || null;
    let redirectPath = loginResult?.redirectUrl || "/";

    if (loginUser?.roleName?.toLowerCase() === "vendor" && redirectPath === "/") {
      redirectPath = "/vendor/dashboard";
    }

    setUser(loginUser);
    navigatePath(redirectPath, true); // Clean up the login entry in the history stack
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigatePath("/", true); // Clean up the session entry in the history stack
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

  const navigate = (page, id = null) => {
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

  // =========================
  // Staff Console State
  // =========================
  const [currentStaffView, setCurrentStaffView] = useState("dashboard");
  const [selectedViolationId, setSelectedViolationId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskViewOrigin, setTaskViewOrigin] = useState("tasks");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Issue state
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);

  // Meter readings state
  const [selectedStallIdForMeters, setSelectedStallIdForMeters] = useState(1);
  const [selectedMeterIdForDetail, setSelectedMeterIdForDetail] =
    useState(null);
  const [showRecordReadingModal, setShowRecordReadingModal] = useState(false);

  // Invoice states
  const [selectedStallIdForInvoices, setSelectedStallIdForInvoices] =
    useState(null);
  const [selectedStallCodeForInvoices, setSelectedStallCodeForInvoices] =
    useState("");

  // Developer configuration testing tools
  const [userId, setUserId] = useState(user?.userId || 1);

  // Sync userId when logged in user updates
  useEffect(() => {
    if (user && user.userId) {
      setUserId(user.userId);
    }
  }, [user]);

  const [baseUrl, setBaseUrl] = useState(
    (import.meta.env.VITE_API_URL || "http://localhost:5056").replace(
      /\/api\/?$/,
      "",
    ),
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
      `Successfully logged Violation: ${newViolation.violationId}`,
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
    handleShowNotification(`Successfully logged Issue: ${newIssue.issueId}`);
    if (currentStaffView === "issues") {
      setCurrentStaffView("temp");
      setTimeout(() => setCurrentStaffView("issues"), 10);
    } else {
      setCurrentStaffView("issues");
    }
  };

  // Manager / Admin Render
  const renderPage = () => {
    switch (currentPage) {
      case "manager-profile":
        return <ProfileManager navigate={navigate} addToast={addToast} />;
      case "dashboard":
        return <DashboardManager addToast={addToast} navigate={navigate} baseUrl={baseUrl} user={user} />;
      case "notifications":
        return <NotificationListManager navigate={navigate} addToast={addToast} />;
      case "market-areas":
        return <MarketAreaList user={user} />;
      case "markets":
        return <MarketRoot user={user} />;
      case "business-categories":
        return (
          <BusinessCategoryListManager
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "contracts":
        return <ContractListManager navigate={navigate} addToast={addToast} />;
      case "contract-form":
        return (
          <ContractFormManager
            contractId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "contract-detail":
        return (
          <ContractDetailManager
            contractId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "users":
        return <UserListManager navigate={navigate} addToast={addToast} />;
      case "requests":
        return <RequestListManager navigate={navigate} addToast={addToast} />;
      case "request-detail":
        return (
          <RequestDetailManager
            requestId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "violations":
        return <ViolationListManager navigate={navigate} addToast={addToast} />;
      case "violation-details":
        return (
          <ViolationDetailsManager
            violationId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "issues":
        return (
          <IssueListManager
            userId={userId}
            baseUrl={baseUrl}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "issue-details":
        return (
          <IssueDetailManager
            issueId={currentUserId}
            userId={userId}
            baseUrl={baseUrl}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "meters":
        return <MeterManagement navigate={navigate} addToast={addToast} />;
      case "form":
        return (
          <UserFormManager
            userId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "detail":
        return (
          <UserDetailManager
            userId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "content":
        return <ContentListManager navigate={navigate} addToast={addToast} />;
      case "content-form":
        return (
          <ContentFormManager
            contentId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "content-detail":
        return (
          <ContentDetailManager
            contentId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "faqs":
        return <FaqListManager navigate={navigate} addToast={addToast} />;
      case "faq-form":
        return (
          <FaqFormManager
            faqId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "tasks":
        return (
          <TaskListManager
            userId={userId}
            baseUrl={baseUrl}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "task-details":
        return (
          <TaskDetailManager
            taskId={currentUserId}
            userId={userId}
            baseUrl={baseUrl}
            onBack={() => navigate("tasks")}
            addToast={addToast}
            navigate={navigate}
          />
        );

      // Admin System Pages
      case "admin-dashboard":
        return <DashboardAdminSystem addToast={addToast} navigate={navigate} />;
      case "admin-users":
        return <UserListAdminSystem navigate={navigate} addToast={addToast} />;
      case "admin-user-form":
        return (
          <UserFormAdminSystem
            userId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "admin-user-detail":
        return (
          <UserDetailAdminSystem
            userId={currentUserId}
            navigate={navigate}
            addToast={addToast}
          />
        );
      case "admin-market-approval":
        return <MarketApprovalListAdminSystem navigate={navigate} addToast={addToast} />;
      case "admin-audit-logs":
        return <AuditLogListAdminSystem navigate={navigate} addToast={addToast} />;

      default:
        return <DashboardManager addToast={addToast} navigate={navigate} />;
    }
  };

  const pageInfo = PAGE_TITLES[currentPage] || PAGE_TITLES["dashboard"];

  const toastIcon = (type) => {
    if (type === "success")
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
    if (type === "error")
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

  const renderConsoleSwitcher = (activeMode) => {
    return (
      <div className="header-actions">
        <select
          value={activeMode}
          onChange={(e) => {
            const mode = e.target.value;
            if (mode === "admin") {
              setCurrentPage("admin-dashboard");
              navigatePath("/admin/dashboard");
            } else if (mode === "manager") {
              setCurrentPage("dashboard");
              navigatePath("/manager/dashboard");
            } else if (mode === "staff") {
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

  const renderManagerOrAdminConsole = () => {
    return (
      <div className="app-container">
        {currentPage.startsWith("admin-") ? (
          <SidebarAdminSystem
            currentPage={currentPage}
            navigate={navigate}
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <SidebarManager
            currentPage={currentPage}
            navigate={navigate}
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

  const renderStaffConsole = () => {
    const staffPageInfo =
      STAFF_PAGE_TITLES[currentStaffView] || STAFF_PAGE_TITLES["dashboard"];

    return (
      <div className="app-shell">
        {/* Global Notifications */}
        {notification && (
          <div className={`global-toast-notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="app-body">
          {/* Sidebar Layout */}
          <SidebarStaff
            currentView={currentStaffView}
            setView={setCurrentStaffView}
            user={user}
            onLogout={handleLogout}
          />


          <main className="app-main-content">
            <div className="main-top-navbar">
              <div
                className="header-title-section"
                style={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    margin: 0,
                    color: "var(--color-text-primary)",
                    textAlign: "left",
                  }}
                >
                  {staffPageInfo?.title || "Staff Console"}
                </h1>
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "12.5px",
                    margin: "3px 0 0 0",
                    textAlign: "left",
                  }}
                >
                  {staffPageInfo?.sub || "Market Hall Management System."}
                </p>
              </div>
              <div className="navbar-icons-placeholder">
                <span
                  className="nav-icon"
                  title="Notifications"
                  onClick={() => navigatePath("/notifications")}
                >
                  🔔
                </span>
                <span className="nav-icon" title="Help">
                  ❓
                </span>
                <span
                  className="nav-icon"
                  title="Profile"
                  onClick={() => setCurrentStaffView("profile")}
                >
                  👤
                </span>
                <div
                  className="user-profile-circle"
                  onClick={() => setCurrentStaffView("profile")}
                  style={{ cursor: "pointer" }}
                >
                  <span>
                    {user?.name
                      ? user.name.substring(0, 2).toUpperCase()
                      : "SU"}
                  </span>
                </div>
              </div>
            </div>

            <div className="main-content-scroll">
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
                  onBack={() => setCurrentStaffView("stall-list")}
                />
              )}

              {currentStaffView === "meter-details" && (
                <MeterDetail
                  meterId={selectedMeterIdForDetail}
                  baseUrl={baseUrl}
                  onBack={() => setCurrentStaffView("meters")}
                />
              )}

              {currentStaffView === "dashboard" && (
                <div className="mock-view">
                  <h1>📊 Staff Dashboard</h1>
                  <p>
                    Welcome back, {user?.name || "Staff"}! Here is your daily
                    overview.
                  </p>
                  <div className="mock-grid">
                    <div className="mock-card">
                      <h3>My Daily Tasks</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentStaffView("tasks")}
                      >
                        Go to Tasks
                      </button>
                    </div>
                    <div className="mock-card">
                      <h3>Stalls Directory</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentStaffView("stall-list")}
                      >
                        Go to Stalls
                      </button>
                    </div>
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
                      <h3>Facilities Incidents</h3>
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentStaffView("issues")}
                      >
                        Go to Issues
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStaffView === "tasks" && (
                <TaskList
                  userId={userId}
                  baseUrl={baseUrl}
                  onViewDetails={(id) => {
                    setSelectedTaskId(id);
                    setTaskViewOrigin("tasks");
                    setCurrentStaffView("task-details");
                  }}
                  onViewMap={() => setCurrentStaffView("task-map")}
                />
              )}

              {currentStaffView === "task-map" && (
                <TaskMapView
                  userId={userId}
                  baseUrl={baseUrl}
                  onBack={() => setCurrentStaffView("tasks")}
                  onViewDetails={(id) => {
                    setSelectedTaskId(id);
                    setTaskViewOrigin("task-map");
                    setCurrentStaffView("task-details");
                  }}
                />
              )}

              {currentStaffView === "task-details" && (
                <TaskDetail
                  taskId={selectedTaskId}
                  userId={userId}
                  baseUrl={baseUrl}
                  onBack={() => setCurrentStaffView(taskViewOrigin)}
                  onShowNotification={handleShowNotification}
                  onViewIssueDetails={handleViewIssueDetails}
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
                <StallList
                  baseUrl={baseUrl}
                  userId={userId}
                  onShowNotification={handleShowNotification}
                  onViewMeterHistory={(stallId) => {
                    setSelectedStallIdForMeters(stallId);
                    setCurrentStaffView("meters");
                  }}
                  onViewInvoices={(stallId, stallCode) => {
                    setSelectedStallIdForInvoices(stallId);
                    setSelectedStallCodeForInvoices(stallCode);
                    setCurrentStaffView("stall-invoices");
                  }}
                />
              )}

              {currentStaffView === "stall-invoices" && (
                <StallInvoiceDetail
                  stallId={selectedStallIdForInvoices}
                  stallCode={selectedStallCodeForInvoices}
                  baseUrl={baseUrl}
                  userId={userId}
                  onBack={() => setCurrentStaffView("stall-list")}
                  onShowNotification={handleShowNotification}
                />
              )}

              {currentStaffView === "profile" && (
                <ProfileStaff
                  userId={userId}
                  baseUrl={baseUrl}
                  onShowNotification={handleShowNotification}
                />
              )}

              {currentStaffView === "temp" && (
                <div className="loading-state">Loading...</div>
              )}
            </div>
          </main>
        </div>

        {/* Create Violation Modal */}
        {showCreateModal && (
          <CreateViolationModal
            userId={userId}
            baseUrl={baseUrl}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {/* Create Issue Modal */}
        {showCreateIssueModal && (
          <CreateIssueModal
            userId={userId}
            baseUrl={baseUrl}
            onClose={() => setShowCreateIssueModal(false)}
            onSuccess={handleCreateIssueSuccess}
          />
        )}

        {/* Record Meter Reading Modal */}
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
  // Main Routes Rendering
  // =========================
  // Synchronous route guards to prevent rendering customer pages for console roles (admin, manager, staff)
  if (user) {
    const role = user.roleName?.toLowerCase();
    const isAdmin = role === "admin" || role === "systemadmin" || role?.includes("admin");
    const isManager = role === "manager";
    const isStaff = role === "staff";

    if (isAdmin && !path.startsWith("/admin/")) {
      return <div className="loading-state">Đang chuyển hướng đến trang Admin...</div>;
    }
    if (isManager && !path.startsWith("/manager/")) {
      return <div className="loading-state">Đang chuyển hướng đến trang Manager...</div>;
    }
    if (isStaff && !path.startsWith("/staff/")) {
      return <div className="loading-state">Đang chuyển hướng đến trang Nhân viên...</div>;
    }
    
    // Prevent logged-in users from seeing auth pages
    if ((role === "customer" || role === "vendor") && ["/login", "/register", "/forgot-password"].includes(path)) {
      return <div className="loading-state">Đang chuyển hướng...</div>;
    }
  }

  return (
    <Routes>
      {/* 1. Public Auth Routing */}
      <Route path="/login" element={
        <LoginForm
          onBack={() => navigatePath("/")}
          onGoToRegister={() => navigatePath("/register")}
          onGoToForgotPassword={() => navigatePath("/forgot-password")}
          onLoginSuccess={handleLoginSuccess}
        />
      } />

      <Route path="/forgot-password" element={
        <ForgotPasswordForm
          onBack={() => navigatePath("/login")}
          onGoToLogin={() => navigatePath("/login")}
        />
      } />

      <Route path="/register" element={
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
      } />

      {/* 2. Customer Profile Routing */}
      <Route path="/profile" element={
        <ProfilePage
          user={user}
          onBack={() => navigatePath("/")}
          onGoToLogin={() => navigatePath("/login")}
          onGoToProfile={() => navigatePath("/profile")}
          onGoToEditProfile={() => navigatePath("/edit-profile")}
          onGoToChangePassword={() => navigatePath("/change-password")}
          onGoToNotifications={() => navigatePath("/notifications")}
          onGoToStallsMap={(mid) =>
            navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
          }
          onLogout={handleLogout}
        />
      } />

      <Route path="/notifications" element={
        <NotificationListPage
          user={user}
          onBack={() => navigatePath("/")}
          onGoToLogin={() => navigatePath("/login")}
          onGoToProfile={() => navigatePath("/profile")}
          onGoToStallsMap={(mid) =>
            navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
          }
          onLogout={handleLogout}
        />
      } />

      <Route path="/change-password" element={
        <ChangePasswordForm
          user={user}
          onBack={() => navigatePath("/profile")}
          onGoToLogin={() => navigatePath("/login")}
          onGoToProfile={() => navigatePath("/profile")}
          onGoToNotifications={() => navigatePath("/notifications")}
          onGoToStallsMap={(mid) =>
            navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
          }
          onLogout={handleLogout}
          onPasswordChanged={() => navigatePath("/profile")}
        />
      } />

      <Route path="/edit-profile" element={
        <EditProfileForm
          user={user}
          onBack={() => navigatePath("/profile")}
          onGoToLogin={() => navigatePath("/login")}
          onGoToProfile={() => navigatePath("/profile")}
          onGoToNotifications={() => navigatePath("/notifications")}
          onGoToStallsMap={(mid) =>
            navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
          }
          onLogout={handleLogout}
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
            navigatePath("/profile");
          }}
        />
      } />

      {/* Map & Stall Details Routing */}
      <Route path="/stalls-map" element={<MarketMapWrapper user={user} onLogout={handleLogout} navigatePath={navigatePath} />} />
      <Route path="/stalls/:id" element={<StallDetailWrapper user={user} onLogout={handleLogout} navigatePath={navigatePath} />} />

      {/* 3. Admin & Manager & Staff & Vendor Console Routes */}
      <Route path="/admin/dashboard" element={renderManagerOrAdminConsole()} />
      <Route path="/manager/dashboard" element={renderManagerOrAdminConsole()} />
      <Route path="/staff/dashboard" element={renderStaffConsole()} />
      
      {/* Vendor Portal Route */}
      <Route element={<ProtectedRoute allowedRoles={["Vendor"]} />}>
        <Route path="/vendor/dashboard" element={
          <VendorDashboard
            user={user}
            onBack={() => navigatePath("/")}
            onLogout={handleLogout}
          />
        } />
      </Route>

      {/* 4. Protected Accountant Portal Routing */}
      <Route element={<ProtectedRoute allowedRoles={["Accountant"]} />}>
        <Route path="/accountant" element={<AccountantLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="financial-config" element={<FinancialConfig />} />
          <Route path="periodic-invoices" element={<PeriodicInvoices />} />
          <Route path="violations-penalties" element={<ViolationsPenalties />} />
          <Route path="repair-price" element={<RepairPrice />} />
          <Route path="payment-verification" element={<PaymentVerification />} />
          <Route path="profile-management" element={<ProfileManagement />} />
        </Route>
      </Route>

      {/* 5. Default Public Homepage */}
      <Route path="/" element={
        <HomePage
          user={user}
          onGoToLogin={() => navigatePath("/login")}
          onGoToRegister={() => navigatePath("/register")}
          onGoToProfile={() => navigatePath("/profile")}
          onGoToChangePassword={() => navigatePath("/change-password")}
          onGoToNotifications={() => navigatePath("/notifications")}
          onGoToStallsMap={(mid) =>
            navigatePath(mid ? "/stalls-map?marketId=" + mid : "/stalls-map")
          }
          onGoToStallDetail={(id) => navigatePath("/stalls/" + id)}
          onLogout={handleLogout}
        />
      } />

      {/* Catch-all fallback redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

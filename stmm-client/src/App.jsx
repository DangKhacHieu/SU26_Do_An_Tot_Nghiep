import { useEffect, useState } from "react";
import "./App.css";
import "./AppDashboard.css";

import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ProfilePage from "./components/Profile/ProfilePage.jsx";
import ChangePasswordForm from "./components/Profile/ChangePasswordForm.jsx";
import EditProfileForm from "./components/Profile/EditProfileForm.jsx";
import authService from "./services/authService";
import AdminDashboard from "./components/AdminDashboard";
import VendorDashboard from "./components/VendorDashboard";
import StaffDashboard from "./components/StaffDashboard";
import ManagerDashboard from "./components/ManagerDashboard";

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState(authService.getUser());

  const navigate = (to) => {
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
    navigate(redirectPath);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate("/");
  };

  if (path === "/login") {
    return (
      <LoginForm
        onBack={() => navigate("/")}
        onGoToRegister={() => navigate("/register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (path === "/register") {
    return (
      <RegisterForm
        onBack={() => navigate("/")}
        onGoToLogin={() => navigate("/login")}
        onRegistered={(loginResult) => {
          const loginUser = loginResult?.user || loginResult || null;
          const redirectPath = loginResult?.redirectUrl || "/";

          if (loginUser) {
            setUser(loginUser);
          }

          navigate(redirectPath);
        }}
      />
    );
  }

  if (path === "/profile") {
    return (
      <ProfilePage
        user={user}
        onBack={() => navigate("/")}
        onGoToLogin={() => navigate("/login")}
        onGoToProfile={() => navigate("/profile")}
        onGoToEditProfile={() => navigate("/edit-profile")}
        onGoToChangePassword={() => navigate("/change-password")}
        onLogout={handleLogout}
      />
    );
  }

  if (path === "/change-password") {
    return (
      <ChangePasswordForm
        onBack={() => navigate("/")}
        onPasswordChanged={() => navigate("/")}
      />
    );
  }

  if (path === "/edit-profile") {
    return (
      <EditProfileForm
        user={user}
        onBack={() => navigate("/profile")}
        onGoToLogin={() => navigate("/login")}
        onGoToProfile={() => navigate("/profile")}
        onLogout={handleLogout}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          navigate("/profile");
        }}
      />
    );
  }

  if (path === "/admin/dashboard") {
    return (
      <AdminDashboard
        user={user}
        onBack={() => navigate("/")}
        onLogout={handleLogout}
      />
    );
  }

  if (path === "/vendor/dashboard") {
    return (
      <VendorDashboard
        user={user}
        onBack={() => navigate("/")}
        onLogout={handleLogout}
      />
    );
  }

  if (path === "/staff/dashboard") {
    return (
      <StaffDashboard
        user={user}
        onBack={() => navigate("/")}
        onLogout={handleLogout}
      />
    );
  }

  if (path === "/manager/dashboard") {
    return (
      <ManagerDashboard
        user={user}
        onBack={() => navigate("/")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <HomePage
      user={user}
      onGoToLogin={() => navigate("/login")}
      onGoToRegister={() => navigate("/register")}
      onGoToProfile={() => navigate("/profile")}
      onGoToChangePassword={() => navigate("/change-password")}
      onLogout={handleLogout}
    />
  );
}

export default App;

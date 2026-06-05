import { useState } from "react";
import authService from "../services/authService";
import "./LoginForm.css";

export default function LoginForm({ onBack, onGoToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(email, password);

      // Gửi nguyên response lên App.jsx để App.jsx lấy user + redirectUrl
      onLoginSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-modern-page">
      <section className="auth-modern-card">
        <div className="auth-modern-left">
          <button type="button" className="auth-logo" onClick={onBack}>
            <span className="auth-logo-icon">S</span>
            <span>STMM</span>
          </button>

          <div className="auth-left-content">
            <span className="auth-badge">WELCOME BACK</span>

            <h1>
              Login to your <br />
              Smart Market
            </h1>

            <p>
              Đăng nhập để quản lý tài khoản, xem hồ sơ cá nhân và tiếp tục sử
              dụng các chức năng trong hệ thống STMM.
            </p>

            <div className="auth-mini-list">
              <div>
                <strong>01</strong>
                <span>Secure account login</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Fast profile management</span>
              </div>

              <div>
                <strong>03</strong>
                <span>Modern market experience</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-modern-right">
          <div className="auth-form-header">
            <button type="button" className="auth-back-btn" onClick={onBack}>
              ← Back home
            </button>

            <div>
              <h2>Đăng nhập</h2>
              <p>Nhập email và mật khẩu để tiếp tục</p>
            </div>
          </div>

          <form className="auth-modern-form" onSubmit={handleSubmit}>
            <div className="modern-input-group">
              <label>Email address</label>

              <div className="modern-input">
                <span>✉</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="modern-input-group">
              <label>Password</label>

              <div className="modern-input">
                <span>🔒</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  required
                />

                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <label>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button type="button">Forgot password?</button>
            </div>

            {error && <div className="modern-message error">{error}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Login"}
              <span>→</span>
            </button>
          </form>

          <p className="auth-switch-text">
            Chưa có tài khoản?{" "}
            <button type="button" onClick={onGoToRegister}>
              Register now
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

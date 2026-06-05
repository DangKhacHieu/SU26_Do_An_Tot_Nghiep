import { useState } from "react";
import authService from "../services/authService";
import "./RegisterForm.css";

export default function RegisterForm({ onBack, onGoToLogin, onRegistered }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cccd, setCccd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await authService.register({
        name,
        email,
        password,
        phone,
        cccd,
      });

      setSuccess("Đăng ký thành công.");

      setTimeout(() => {
        if (onRegistered) {
          onRegistered(res.user || res);
        }
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-modern-page">
      <section className="register-modern-card">
        <div className="register-modern-left">
          <button type="button" className="register-logo" onClick={onBack}>
            <span className="register-logo-icon">S</span>
            <span>STMM</span>
          </button>

          <div className="register-left-content">
            <span className="register-badge">CREATE ACCOUNT</span>

            <h1>
              Join Smart <br />
              Market System
            </h1>

            <p>
              Tạo tài khoản mới để sử dụng hệ thống quản lý chợ thông minh, quản
              lý hồ sơ và trải nghiệm các chức năng của STMM.
            </p>

            <div className="register-mini-list">
              <div>
                <strong>01</strong>
                <span>Register your account</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Verify user information</span>
              </div>

              <div>
                <strong>03</strong>
                <span>Start using STMM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="register-modern-right">
          <div className="register-form-header">
            <button
              type="button"
              className="register-back-btn"
              onClick={onBack}
            >
              ← Back home
            </button>

            <div>
              <h2>Đăng ký</h2>
              <p>Điền thông tin để tạo tài khoản mới</p>
            </div>
          </div>

          <form className="register-modern-form" onSubmit={handleSubmit}>
            <div className="register-input-group">
              <label>Full name</label>
              <div className="register-input">
                <span>👤</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

            <div className="register-input-group">
              <label>Email address</label>
              <div className="register-input">
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

            <div className="register-two-cols">
              <div className="register-input-group">
                <label>Phone number</label>
                <div className="register-input">
                  <span>☎</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0900000000"
                    required
                  />
                </div>
              </div>

              <div className="register-input-group">
                <label>CCCD</label>
                <div className="register-input">
                  <span>▣</span>
                  <input
                    value={cccd}
                    onChange={(e) => setCccd(e.target.value)}
                    placeholder="Nhập CCCD"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="register-input-group">
              <label>Password</label>
              <div className="register-input">
                <span>🔒</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Tạo mật khẩu"
                  required
                />

                <button
                  type="button"
                  className="register-show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <div className="register-message error">{error}</div>}
            {success && (
              <div className="register-message success">{success}</div>
            )}

            <button
              type="submit"
              className="register-submit-btn"
              disabled={loading}
            >
              {loading ? "Đang tạo tài khoản..." : "Create account"}
              <span>→</span>
            </button>
          </form>

          <p className="register-switch-text">
            Đã có tài khoản?{" "}
            <button type="button" onClick={onGoToLogin}>
              Login
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

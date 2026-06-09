import { useEffect, useState } from "react";
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

  // Email verification states
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (needsVerification) return; // Don't init google if on verification screen

    const initGoogle = () => {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "733979401918-egmrcldjnt2o2o30t7u3v1rskep1lhre.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      const btnEl = document.getElementById("google-register-btn");
      if (btnEl) {
        window.google?.accounts.id.renderButton(btnEl, {
          theme: "outline",
          size: "large",
          width: "100%",
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, [needsVerification]);

  const handleGoogleLogin = async (response) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await authService.loginWithGoogle(response.credential);
      setSuccess("Đăng nhập bằng Google thành công.");
      setTimeout(() => {
        if (onRegistered) {
          onRegistered(res.user || res);
        }
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

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

      setSuccess(res.message || "Đăng ký thành công! Vui lòng kiểm tra OTP xác thực email.");
      setVerificationEmail(res.email || email);
      setNeedsVerification(true);
      setOtpCode(""); // clear any input
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await authService.verifyEmail(verificationEmail, otpCode);
      setSuccess("Xác thực email thành công! Đang chuyển hướng...");

      setTimeout(() => {
        if (onRegistered) {
          onRegistered(res.user || res);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác thực mã OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      await authService.resendVerificationCode(verificationEmail);
      setSuccess("Mã xác thực OTP mới đã được gửi!");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại mã xác thực");
    } finally {
      setResendLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <main className="register-modern-page">
        <section className="register-modern-card">
          <div className="register-modern-left">
            <button type="button" className="register-logo" onClick={onBack}>
              <span className="register-logo-icon">S</span>
              <span>STMM</span>
            </button>

            <div className="register-left-content">
              <span className="register-badge">EMAIL VERIFICATION</span>

              <h1>
                Xác thực <br />
                Tài khoản
              </h1>

              <p>
                Hệ thống đã gửi một mã xác thực OTP 6 chữ số tới địa chỉ email{" "}
                <strong>{verificationEmail}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác) và nhập mã để kích hoạt tài khoản.
              </p>

              <div className="register-mini-list">
                <div>
                  <strong>01</strong>
                  <span>Tạo tài khoản thành công</span>
                </div>

                <div style={{ borderColor: "#f6f0d7" }}>
                  <strong style={{ background: "rgba(246, 240, 215, 0.4)" }}>02</strong>
                  <span style={{ color: "#f6f0d7" }}>Nhập mã OTP xác thực email</span>
                </div>

                <div>
                  <strong>03</strong>
                  <span>Trải nghiệm hệ thống Smart Market</span>
                </div>
              </div>
            </div>
          </div>

          <div className="register-modern-right">
            <div className="register-form-header">
              <button
                type="button"
                className="register-back-btn"
                onClick={() => {
                  setNeedsVerification(false);
                  setError("");
                  setSuccess("");
                }}
              >
                ← Trở lại đăng ký
              </button>

              <div>
                <h2>Xác nhận OTP</h2>
                <p>Nhập mã xác thực của bạn để tiếp tục</p>
              </div>
            </div>

            <form className="register-modern-form" onSubmit={handleVerifySubmit}>
              <div className="register-input-group">
                <label>Mã OTP (6 chữ số)</label>
                <div className="otp-input-container">
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="------"
                    className="otp-code-input"
                    maxLength={6}
                    required
                    autoFocus
                  />
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
                {loading ? "Đang xác thực..." : "Kích hoạt tài khoản"}
                <span>→</span>
              </button>
            </form>

            <div className="otp-resend-container">
              <p>Không nhận được mã xác thực?</p>
              <button
                type="button"
                className="otp-resend-btn"
                disabled={resendLoading || resendCooldown > 0}
                onClick={handleResendCode}
              >
                {resendLoading
                  ? "Đang gửi..."
                  : resendCooldown > 0
                  ? `Gửi lại sau (${resendCooldown}s)`
                  : "Gửi lại mã OTP mới"}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

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

          <div className="auth-divider">
            <span>Hoặc</span>
          </div>

          <div id="google-register-btn" className="google-btn-container"></div>

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

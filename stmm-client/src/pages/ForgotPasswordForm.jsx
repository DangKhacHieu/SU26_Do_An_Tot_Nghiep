import { useEffect, useState } from "react";
import authService from "../services/authService";
import "./ForgotPasswordForm.css";

export default function ForgotPasswordForm({ onBack, onGoToLogin }) {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Verify OTP, 3: Reset password
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP resend states
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess("Mã xác thực OTP đã được gửi tới email của bạn.");
      setStep(2);
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yêu cầu khôi phục mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.verifyResetOtp(email, otpCode);
      setSuccess("Xác thực mã OTP thành công!");
      setTimeout(() => {
        setSuccess("");
        setStep(3);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xác thực mã OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, otpCode, newPassword);
      setSuccess("Đặt lại mật khẩu thành công! Quay lại đăng nhập sau vài giây...");
      setTimeout(() => {
        onGoToLogin();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess("Mã xác thực OTP mới đã được gửi!");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại mã");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="forgot-modern-page">
      <section className="forgot-modern-card">
        <div className="forgot-modern-left">
          <button type="button" className="forgot-logo" onClick={onBack}>
            <span className="forgot-logo-icon">S</span>
            <span>STMM</span>
          </button>

          <div className="forgot-left-content">
            <span className="forgot-badge">PASSWORD RECOVERY</span>

            <h1>
              Khôi phục <br />
              Mật khẩu
            </h1>

            <p>
              Đặt lại mật khẩu của bạn thông qua xác thực email. Hệ thống sẽ gửi một mã OTP gồm 6 chữ số để xác minh chủ tài khoản.
            </p>

            <div className="forgot-mini-list">
              <div style={step === 1 ? { borderColor: "#f6f0d7" } : {}}>
                <strong style={step === 1 ? { background: "rgba(246, 240, 215, 0.4)" } : {}}>01</strong>
                <span style={step === 1 ? { color: "#f6f0d7" } : {}}>Nhập Email nhận mã</span>
              </div>

              <div style={step === 2 ? { borderColor: "#f6f0d7" } : {}}>
                <strong style={step === 2 ? { background: "rgba(246, 240, 215, 0.4)" } : {}}>02</strong>
                <span style={step === 2 ? { color: "#f6f0d7" } : {}}>Xác thực mã OTP</span>
              </div>

              <div style={step === 3 ? { borderColor: "#f6f0d7" } : {}}>
                <strong style={step === 3 ? { background: "rgba(246, 240, 215, 0.4)" } : {}}>03</strong>
                <span style={step === 3 ? { color: "#f6f0d7" } : {}}>Đặt lại mật khẩu mới</span>
              </div>
            </div>
          </div>
        </div>

        <div className="forgot-modern-right">
          <div className="forgot-form-header">
            <button
              type="button"
              className="forgot-back-btn"
              onClick={
                step === 3
                  ? () => setStep(2)
                  : step === 2
                  ? () => setStep(1)
                  : onBack
              }
            >
              ← Quay lại
            </button>

            <div>
              <h2>Quên mật khẩu</h2>
              <p>
                {step === 1
                  ? "Nhập email đã đăng ký để nhận mã OTP khôi phục"
                  : step === 2
                  ? "Nhập mã OTP gồm 6 chữ số đã được gửi tới email"
                  : "Thiết lập mật khẩu mới cho tài khoản của bạn"}
              </p>
            </div>
          </div>

          {step === 1 && (
            <form className="forgot-modern-form" onSubmit={handleRequestOtp}>
              <div className="forgot-input-group">
                <label>Email address</label>
                <div className="forgot-input">
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

              {error && <div className="forgot-message error">{error}</div>}
              {success && (
                <div className="forgot-message success">{success}</div>
              )}

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? "Đang gửi mã..." : "Gửi mã xác thực OTP"}
                <span>→</span>
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="forgot-modern-form" onSubmit={handleVerifyOtp}>
              <div className="forgot-input-group">
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

              {error && <div className="forgot-message error">{error}</div>}
              {success && (
                <div className="forgot-message success">{success}</div>
              )}

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? "Đang xác thực..." : "Xác thực mã OTP"}
                <span>→</span>
              </button>
            </form>
          )}

          {step === 3 && (
            <form className="forgot-modern-form" onSubmit={handleResetPassword}>
              <div className="forgot-input-group">
                <label>Mật khẩu mới</label>
                <div className="forgot-input">
                  <span>🔒</span>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                </div>
              </div>

              <div className="forgot-input-group">
                <label>Xác nhận mật khẩu</label>
                <div className="forgot-input">
                  <span>🔒</span>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu mới"
                    required
                  />
                  <button
                    type="button"
                    className="forgot-show-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && <div className="forgot-message error">{error}</div>}
              {success && (
                <div className="forgot-message success">{success}</div>
              )}

              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu mới"}
                <span>→</span>
              </button>
            </form>
          )}

          {step === 2 && (
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
          )}

          <p className="forgot-switch-text">
            Quay lại trang{" "}
            <button type="button" onClick={onGoToLogin}>
              Đăng nhập
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

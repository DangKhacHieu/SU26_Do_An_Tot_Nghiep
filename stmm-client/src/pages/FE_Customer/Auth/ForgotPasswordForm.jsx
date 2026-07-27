import { useEffect, useState } from "react";
import authService from "../../../services/authService";
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
      setSuccess("OTP verification code has been sent to your email.");
      setStep(2);
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password recovery request failed");
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
      setSuccess("OTP code verified successfully!");
      setTimeout(() => {
        setSuccess("");
        setStep(3);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP code verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Confirm password does not match!");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, otpCode, newPassword);
      setSuccess("Reset password successful! Returning to login in a few seconds...");
      setTimeout(() => {
        onGoToLogin();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset password failed");
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
      setSuccess("New OTP verification code has been sent!");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend code");
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
              Recover <br />
              Password
            </h1>

            <p>
              Reset your password via email verification. The system will send a 6-digit OTP to verify the account owner.
            </p>

            <div className="forgot-mini-list">
              <div style={step === 1 ? { borderColor: "#f6f0d7" } : {}}>
                <strong style={step === 1 ? { background: "rgba(246, 240, 215, 0.4)" } : {}}>01</strong>
                <span style={step === 1 ? { color: "#f6f0d7" } : {}}>Enter Email to receive code</span>
              </div>

              <div style={step === 2 ? { borderColor: "#f6f0d7" } : {}}>
                <strong style={step === 2 ? { background: "rgba(246, 240, 215, 0.4)" } : {}}>02</strong>
                <span style={step === 2 ? { color: "#f6f0d7" } : {}}>Verify OTP code</span>
              </div>

              <div style={step === 3 ? { borderColor: "#f6f0d7" } : {}}>
                <strong style={step === 3 ? { background: "rgba(246, 240, 215, 0.4)" } : {}}>03</strong>
                <span style={step === 3 ? { color: "#f6f0d7" } : {}}>Reset new password</span>
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
              ← Back
            </button>

            <div>
              <h2>Forgot Password</h2>
              <p>
                {step === 1
                  ? "Enter registered email to receive recovery OTP code"
                  : step === 2
                     ? "Enter the 6-digit OTP code sent to your email"
                     : "Set up a new password for your account"}
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
                {loading ? "Sending code..." : "Send OTP verification code"}
                <span>→</span>
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="forgot-modern-form" onSubmit={handleVerifyOtp}>
              <div className="forgot-input-group">
                <label>OTP Code (6 digits)</label>
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
                {loading ? "Verifying..." : "Verify OTP code"}
                <span>→</span>
              </button>
            </form>
          )}

          {step === 3 && (
            <form className="forgot-modern-form" onSubmit={handleResetPassword}>
              <div className="forgot-input-group">
                <label>New password</label>
                <div className="forgot-input">
                  <span>🔒</span>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>

              <div className="forgot-input-group">
                <label>Confirm password</label>
                <div className="forgot-input">
                  <span>🔒</span>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
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
                {loading ? "Resetting..." : "Reset new password"}
                <span>→</span>
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="otp-resend-container">
              <p>Didn't receive the verification code?</p>
              <button
                type="button"
                className="otp-resend-btn"
                disabled={resendLoading || resendCooldown > 0}
                onClick={handleResendCode}
              >
                {resendLoading
                  ? "Sending..."
                  : resendCooldown > 0
                     ? `Resend in (${resendCooldown}s)`
                     : "Resend new OTP code"}
              </button>
            </div>
          )}

          <p className="forgot-switch-text">
            Go back to{" "}
            <button type="button" onClick={onGoToLogin}>
              Login
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

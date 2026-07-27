import { useEffect, useState } from "react";
import authService from "../../../services/authService";
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
      setSuccess("Google login successful.");
      setTimeout(() => {
        if (onRegistered) {
          onRegistered(res.user || res);
        }
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
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

      setSuccess(res.message || "Registration successful! Please check your email for the verification OTP.");
      setVerificationEmail(res.email || email);
      setNeedsVerification(true);
      setOtpCode(""); // clear any input
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
      setSuccess("Email verified successfully! Redirecting...");

      setTimeout(() => {
        if (onRegistered) {
          onRegistered(res.user || res);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP code verification failed");
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
      setSuccess("New OTP verification code has been sent!");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend verification code");
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
                Verify <br />
                Account
              </h1>

              <p>
                The system has sent a 6-digit OTP verification code to the email address{" "}
                <strong>{verificationEmail}</strong>. Please check your inbox (or spam folder) and enter the code to activate your account.
              </p>

              <div className="register-mini-list">
                <div>
                  <strong>01</strong>
                  <span>Account created successfully</span>
                </div>

                <div style={{ borderColor: "#f6f0d7" }}>
                  <strong style={{ background: "rgba(246, 240, 215, 0.4)" }}>02</strong>
                  <span style={{ color: "#f6f0d7" }}>Enter OTP code to verify email</span>
                </div>

                <div>
                  <strong>03</strong>
                  <span>Experience Smart Market system</span>
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
                ← Back to register
              </button>

              <div>
                <h2>Confirm OTP</h2>
                <p>Enter your verification code to continue</p>
              </div>
            </div>

            <form className="register-modern-form" onSubmit={handleVerifySubmit}>
              <div className="register-input-group">
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

              {error && <div className="register-message error">{error}</div>}
              {success && (
                <div className="register-message success">{success}</div>
              )}

              <button
                type="submit"
                className="register-submit-btn"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Activate account"}
                <span>→</span>
              </button>
            </form>

            <div className="otp-resend-container">
              <p>Didn't receive verification code?</p>
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
              Create a new account to use the smart market management system, manage
              your profile, and experience the functions of STMM.
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
              <h2>Register</h2>
              <p>Fill in the information to create a new account</p>
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
                  placeholder="John Doe"
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
                    placeholder="Enter National ID/CCCD"
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
                  placeholder="Create password"
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
              {loading ? "Creating account..." : "Create account"}
              <span>→</span>
            </button>
          </form>

          <div className="auth-divider">
            <span>Or</span>
          </div>

          <div id="google-register-btn" className="google-btn-container"></div>

          <p className="register-switch-text">
            Already have an account?{" "}
            <button type="button" onClick={onGoToLogin}>
              Login
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import authService from "../../../services/authService";
import "./LoginForm.css";

export default function LoginForm({ onBack, onGoToRegister, onGoToForgotPassword, onLoginSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initGoogle = () => {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "733979401918-egmrcldjnt2o2o30t7u3v1rskep1lhre.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client?hl=en";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleLogin = async (response) => {
    setError("");
    setLoading(true);
    try {
      const res = await authService.loginWithGoogle(response.credential);
      onLoginSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginform.google_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(email, password);

      // Gửi nguyên response lên App.jsx để App.jsx lấy user + redirectUrl
      onLoginSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginform.login_failed'));
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
            <span className="auth-badge">{t('loginform.welcome_back')}</span>

            <h1>
              {t('loginform.login_to_your')} <br />
              {t('loginform.smart_market')}
            </h1>

            <p>
              {t('loginform.login_desc')}
            </p>

            <div className="auth-mini-list">
              <div>
                <strong>01</strong>
                <span>{t('loginform.secure_login')}</span>
              </div>

              <div>
                <strong>02</strong>
                <span>{t('loginform.fast_profile')}</span>
              </div>

              <div>
                <strong>03</strong>
                <span>{t('loginform.modern_experience')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-modern-right">
          <div className="auth-form-header">
            <button type="button" className="auth-back-btn" onClick={onBack}>
              ← {t('loginform.back_home')}
            </button>

            <div>
              <h2>{t('loginform.login')}</h2>
              <p>{t('loginform.enter_credentials')}</p>
            </div>
          </div>

          <form className="auth-modern-form" onSubmit={handleSubmit}>
            <div className="modern-input-group">
              <label>{t('loginform.email_address')}</label>

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
              <label>{t('loginform.password')}</label>

              <div className="modern-input">
                <span>🔒</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder={t('loginform.enter_password')}
                  required
                />

                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? t('loginform.hide') : t('loginform.show')}
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <label>
                <input type="checkbox" />
                <span>{t('loginform.remember_me')}</span>
              </label>

              <button type="button" onClick={onGoToForgotPassword}>{t('loginform.forgot_password')}</button>
            </div>

            {error && <div className="modern-message error">{error}</div>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? t('loginform.logging_in') : t('loginform.login')}
              <span>→</span>
            </button>
          </form>

          <div className="auth-divider">
            <span>{t('loginform.or')}</span>
          </div>

          <div id="google-login-btn" className="google-btn-container"></div>

          <p className="auth-switch-text">
            {t('loginform.no_account')}{" "}
            <button type="button" onClick={onGoToRegister}>
              {t('loginform.register_now')}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

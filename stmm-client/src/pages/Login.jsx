import { useTranslation } from 'react-i18next';
import { translateError } from '../utils/translateError';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';
import {
  Building2,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  TrendingUp,
  Shield
} from 'lucide-react';

const MOCK_ACCOUNTS = [
  { email: 'ketoan.caikhe@stmm.vn', password: '123456', name: 'Kế Toán Chợ Cái Khế', roleName: 'Accountant', userId: 5, roleId: 3 },
  { email: 'binhlt.accountant@stmm.vn', password: '123456', name: 'Lê Thanh Bình', roleName: 'Accountant', userId: 1, roleId: 3 },
  { email: 'admin@stmm.vn', password: '123456', name: 'Nguyễn Văn Trị', roleName: 'Admin', userId: 2, roleId: 1 }
];

export default function Login() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleMockClick = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t('login.please_enter_full_email'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('http://localhost:5056/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || t('login.email_or_password_is'));
      }

      const data = await res.json();
      // Save tokens using the standard keys that marketApi.js and authService.ts expect
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Also save user_session for backward compatibility with other components
      localStorage.setItem('user_session', JSON.stringify({
        userId: data.user?.userId, name: data.user?.name, email: data.user?.email,
        roleId: data.user?.roleId, roleName: data.user?.roleName, token: data.accessToken,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
      }));

      const userName = data.user?.name || t('login.friend');
      setSuccess(t('login.hello_username_changing_direction'));
      const redirectPath = data.redirectUrl || '/dashboard';
      setTimeout(() => navigate(redirectPath), 1000);

    } catch (err) {
      const matched = MOCK_ACCOUNTS.find(
        a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
      );

      if (matched) {
        const mockToken = `mock-${matched.userId}-${Date.now()}`;
        // Save tokens using the standard keys
        localStorage.setItem('accessToken', mockToken);
        localStorage.setItem('user', JSON.stringify({
          userId: matched.userId, name: matched.name, email: matched.email,
          roleId: matched.roleId, roleName: matched.roleName
        }));
        localStorage.setItem('user_session', JSON.stringify({
          userId: matched.userId, name: matched.name, email: matched.email,
          roleId: matched.roleId, roleName: matched.roleName,
          token: mockToken,
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
        }));
        setSuccess(t('login.hello_matchedname_test_mode'));
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setError(err.message || t('login.email_or_password_is'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg-base)'
    }}>
      {/* ---- Left Panel: Branding ---- */}
      <div style={{
        flex: '0 0 44%',
        background: 'linear-gradient(160deg, #0f2342 0%, #1a3a6e 45%, #1a56db 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(26,86,219,0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(56,189,248,0.15) 0%, transparent 40%)`,
          pointerEvents: 'none'
        }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          pointerEvents: 'none'
        }} />

        {/* Top: Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '48px'
          }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>MHMS Portal</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{t('login.market_management_system')}</div>
            </div>
          </div>

          {/* Main headline */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              marginBottom: 20,
              border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <Shield size={12} color="rgba(255,255,255,0.8)" />
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: '0.04em' }}>
                CỔng THÔNG TIN KẾ TOÁN NỘI BỘ
              </span>
            </div>

            <h1 style={{
              fontSize: 38, fontWeight: 900, color: 'white',
              letterSpacing: '-0.04em', lineHeight: 1.1,
              marginBottom: 16
            }}>
              {t('login.financial_management')}<br />
              <span style={{ color: '#93c5fd' }}>{t('login.smart')}</span>
            </h1>

            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.65, maxWidth: 340
            }}>
              {t('login.centralized_accounting_system_for')}</p>
          </div>
        </div>

        {/* Bottom: Stats */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 14
          }}>
            {[
              { value: '250+', label: t('login.kiosk_is_working') },
              { value: '98.5%', label: t('login.ontime_fee_collection_rate') },
              { value: '24/7', label: t('login.continuous_monitoring') }
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Right Panel: Login Form ---- */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Language Switcher - top right */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <LanguageSwitcher />
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 800,
              color: 'var(--text-title)',
              letterSpacing: '-0.04em',
              marginBottom: 8
            }}>
              {t('login.login_to_the_system')}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t('login.please_authenticate_your_identity')}</p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              borderRadius: 10, marginBottom: 20,
              color: 'var(--danger)', fontSize: 13.5,
              animation: 'slideIn 0.2s ease'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{translateError(error, t)}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              background: 'var(--success-light)',
              border: '1px solid var(--success-border)',
              borderRadius: 10, marginBottom: 20,
              color: 'var(--success)', fontSize: 13.5
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-main)', marginBottom: 7
              }}>
                {t('login.work_email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none'
                }} />
                <input
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  disabled={loading}
                  required
                  placeholder="ten.nv@stmm.vn"
                  style={{
                    width: '100%',
                    padding: '10.5px 13px 10.5px 38px',
                    border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 10,
                    background: 'var(--bg-input)',
                    fontSize: 14,
                    color: 'var(--text-title)',
                    outline: 'none',
                    transition: 'all 0.12s ease',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; e.target.style.background = 'var(--bg-surface)'; }}
                  onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-input)'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: 'var(--text-main)', marginBottom: 7
              }}>
                {t('login.password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  disabled={loading}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10.5px 40px 10.5px 38px',
                    border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 10,
                    background: 'var(--bg-input)',
                    fontSize: 14,
                    color: 'var(--text-title)',
                    outline: 'none',
                    transition: 'all 0.12s ease',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)'; e.target.style.background = 'var(--bg-surface)'; }}
                  onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--bg-input)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: loading ? 'var(--border)' : 'var(--primary)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
                letterSpacing: '-0.01em',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(26,86,219,0.3)',
                fontFamily: 'var(--font-sans)'
              }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.background = 'var(--primary-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,86,219,0.4)'; } }}
              onMouseOut={e => { if (!loading) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,86,219,0.3)'; } }}
            >
              {loading ? (
                <>
                  <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>{t('login.verifying')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.log_in')}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '24px 0'
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {t('login.test_account')}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Mock Accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MOCK_ACCOUNTS.map((acc, i) => (
              <button
                key={i}
                onClick={() => handleMockClick(acc)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px',
                  background: 'var(--bg-base)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'var(--primary-light)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-base)';
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-title)', marginBottom: 2 }}>
                    {acc.email}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Mật khẩu: {acc.password}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: acc.roleName === 'Admin' ? 'var(--danger-light)' : 'var(--primary-light)',
                  color: acc.roleName === 'Admin' ? 'var(--danger)' : 'var(--primary)',
                  border: `1px solid ${acc.roleName === 'Admin' ? 'var(--danger-border)' : 'var(--primary-border)'}`,
                  flexShrink: 0
                }}>
                  {acc.roleName === 'Accountant' ? t('login.accountant') : 'Admin'}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
            marginTop: 32, lineHeight: 1.5
          }}>
            © 2026 MHMS - Market Hall Management System.<br />
            {t('login.all_rights_reserved')}</p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: var(--text-placeholder); }
      `}</style>
    </div>
  );
}

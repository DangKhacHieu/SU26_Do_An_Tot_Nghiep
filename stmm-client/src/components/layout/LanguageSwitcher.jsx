import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Lưu vào localStorage để đồng bộ fetch/axios headers
    localStorage.setItem('i18nextLng', lng);
  };

  // Hỗ trợ kiểm tra cả định dạng "vi-VN", "vi", "en-US", "en"
  const currentLang = i18n.language || 'en';
  const isVi = currentLang.startsWith('vi');
  const isEn = currentLang.startsWith('en');

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${isVi ? 'active' : ''}`}
        onClick={() => changeLanguage('vi')}
        title={t('languageswitcher.vietnamese')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="16" height="11" style={{ borderRadius: '1.5px', boxShadow: '0 0 1px rgba(0,0,0,0.2)' }}>
          <rect width="3" height="2" fill="#da251d"/>
          <polygon points="1.5,0.4 1.64,0.85 2.1,0.85 1.73,1.12 1.87,1.58 1.5,1.3 1.13,1.58 1.27,1.12 0.9,0.85 1.36,0.85" fill="#ffff00"/>
        </svg>
        <span className="lang-text">VI</span>
      </button>
      <button
        className={`lang-btn ${isEn ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 30" width="16" height="11" style={{ borderRadius: '1.5px', boxShadow: '0 0 1px rgba(0,0,0,0.2)' }}>
          <clipPath id="s">
            <path d="M0,0 v30 h50 v-30 z"/>
          </clipPath>
          <path d="M0,0 L50,30 M50,0 L0,30" stroke="#fff" strokeWidth="6" clipPath="url(#s)"/>
          <path d="M0,0 L50,30 M50,0 L0,30" stroke="#c8102e" strokeWidth="4" clipPath="url(#s)"/>
          <path d="M25,0 v30 M0,15 h50" stroke="#fff" strokeWidth="10"/>
          <path d="M25,0 v30 M0,15 h50" stroke="#c8102e" strokeWidth="6"/>
        </svg>
        <span className="lang-text">EN</span>
      </button>
    </div>
  );
}

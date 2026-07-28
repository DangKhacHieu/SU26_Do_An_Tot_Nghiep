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
  const currentLang = i18n.language || 'vi';
  const isVi = currentLang.startsWith('vi');
  const isEn = currentLang.startsWith('en');

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${isVi ? 'active' : ''}`}
        onClick={() => changeLanguage('vi')}
        title={t('languageswitcher.vietnamese')}
      >
        <span className="flag">🇻🇳</span>
        <span className="lang-text">VI</span>
      </button>
      <button
        className={`lang-btn ${isEn ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        <span className="flag">🇬🇧</span>
        <span className="lang-text">EN</span>
      </button>
    </div>
  );
}

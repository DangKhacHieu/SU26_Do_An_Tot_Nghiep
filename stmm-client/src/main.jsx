import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n.js'
import App from './App.jsx'
import { refreshAccessToken } from './services/authSession'

import axios from 'axios'

// Helper function to rewrite local URLs to production API URLs
const rewriteUrlStr = (urlStr) => {
  if (urlStr.startsWith(`${(import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/api$/, '')}`)) {
    const envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5056/api';
    const base = envApiUrl.replace(/\/$/, '');
    if (urlStr.startsWith(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}`)) {
      return urlStr.replace(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}`, base);
    } else {
      const hostBase = base.replace(/\/api$/, '');
      return urlStr.replace(`${(import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/api$/, '')}`, hostBase);
    }
  }
  return urlStr;
};

// 1. Intercept native fetch to automatically rewrite URLs and append Authorization
const originalFetch = window.fetch;
window.fetch = async (input, options = {}) => {
  let url = input;
  if (typeof input === 'string') {
    url = rewriteUrlStr(input);
  } else if (input instanceof Request) {
    const newUrl = rewriteUrlStr(input.url);
    url = new Request(newUrl, input);
  }

  const requestWithCurrentToken = () => {
    const headers = new Headers(options.headers || (url instanceof Request ? url.headers : undefined));
    const token = localStorage.getItem('accessToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return originalFetch(url, { ...options, headers });
  };

  const response = await requestWithCurrentToken();
  const requestUrl = typeof url === 'string' ? url : url.url;
  if (response.status !== 401 || requestUrl.includes('/auth/refresh')) {
    return response;
  }

  try {
    await refreshAccessToken();
    return await requestWithCurrentToken();
  } catch {
    return response;
  }
};

// 2. Intercept Axios requests to automatically rewrite URLs and append Authorization
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith(`${(import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/api$/, '')}`)) {
    config.url = rewriteUrlStr(config.url);
  }
  const token = localStorage.getItem('accessToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

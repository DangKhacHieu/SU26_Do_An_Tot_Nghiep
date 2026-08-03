import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n.js'
import App from './App.jsx'
import { refreshAccessToken } from './services/authSession'

// Intercept native fetch to automatically append Authorization header if token exists
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

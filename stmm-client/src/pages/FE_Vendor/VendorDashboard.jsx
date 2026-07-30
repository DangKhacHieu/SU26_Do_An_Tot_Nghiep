import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./VendorDashboard.css";
import { vendorInvoiceApi } from '../../services/vendorInvoiceApi';
import { vendorFeedbackApi } from '../../services/vendorFeedbackApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import VendorServiceList from "../FE_Vendor/VendorServices/VendorServiceList";
import VendorMyServices from "../FE_Vendor/VendorServices/VendorMyServices";
import VendorRequestList from "./VendorRequests/VendorRequestList";
import VendorViolationList from "./VendorViolations/VendorViolationList";
import VendorProfile from "./VendorProfile";
import VendorBillsList from "./VendorBills/VendorBillsList";
import VendorNotificationList from "./VendorNotifications/VendorNotificationList";
import VendorFeedbackList from "./VendorFeedbacks/VendorFeedbackList";
import notificationService from "../../services/notificationService";
import { showSuccess, showError } from '../../utils/alert';

// Icons
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
const IconServices = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const IconRequests = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconFeedback = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);
const IconNotifications = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconBills = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconViolations = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSetting = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function VendorDashboard({ user, onBack, onLogout }) {
  const { t, i18n } = useTranslation();
  const vendorId = user?.userId;
  const [activeMenu, setActiveMenu] = useState('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTab, setServiceTab] = useState('AVAILABLE'); // 'AVAILABLE' | 'MY_SERVICES'
  const [rentedStalls, setRentedStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState('ALL');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    activeServices: 0,
    pendingRequests: 0,
    unpaidBills: 0,
    violations: 0
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [invoiceChartData, setInvoiceChartData] = useState([]);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get('http://localhost:5056/api/vendor/stalls', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRentedStalls(res.data || []);
      } catch (err) {
        console.error("Failed to fetch stalls", err);
      }
    };
    if (user) fetchStalls();
  }, [user]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await notificationService.getNotifications();
        const unread = (data || []).filter(n => !n.isRead).length;
        setUnreadNotificationCount(unread);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    if (user) fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        const stallParam = selectedStallId === 'ALL' ? null : selectedStallId;
        
        // 0. Active Services
        let activeServ = 0;
        try {
          const servRes = await axios.get('http://localhost:5056/api/vendor/services/my-services', { headers });
          if (servRes.data) {
            let myServs = servRes.data;
            if (stallParam) {
               // Find the stall code to filter
               const stallCode = rentedStalls.find(s => String(s.stallId) === String(stallParam))?.code;
               if (stallCode) {
                 myServs = myServs.filter(s => s.stallCode === stallCode);
               }
            }
            // Count active ones
            activeServ = myServs.filter(s => s.status === 'Active').length;
          }
        } catch(e) { console.error(e); }

        // 1. Pending requests
        const reqRes = await axios.get('http://localhost:5056/api/vendor/requests', {
          headers,
          params: { searchTerm: '', status: 'Pending', stallId: stallParam, pageNumber: 1, pageSize: 1 }
        });
        const pendingReqs = reqRes.data.totalCount || 0;

        // 2. Unpaid Bills
        let unpaidCount = 0;
        try {
          const invRes = await vendorInvoiceApi.getVendorInvoices(stallParam, null, null, 1, 1000);
          if (invRes && invRes.items) {
            unpaidCount = invRes.items.filter(i => i.status?.toLowerCase() === 'unpaid' || i.status?.toLowerCase() === 'overdue').length;
          } else if (Array.isArray(invRes)) {
            unpaidCount = invRes.filter(i => i.status?.toLowerCase() === 'unpaid' || i.status?.toLowerCase() === 'overdue').length;
          }
        } catch (e) {
          console.error(e);
        }

        // 3. Violations (All violations for now)
        const vioRes = await axios.get('http://localhost:5056/api/vendor/violations', {
          headers,
          params: { status: null, stallId: stallParam, pageNumber: 1, pageSize: 1 }
        });
        const totalViolations = vioRes.data.totalCount || 0;

        setDashboardStats({
          activeServices: activeServ,
          pendingRequests: pendingReqs,
          unpaidBills: unpaidCount,
          violations: totalViolations
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };

    if (user) {
      fetchDashboardStats();
    }
  }, [user, selectedStallId]);

  useEffect(() => {
    const fetchChartsAndFeedbacks = async () => {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const stallParam = selectedStallId === 'ALL' ? null : selectedStallId;

      // Fetch Invoices for Bar Chart
      try {
        const invsRes = await vendorInvoiceApi.getVendorInvoices(stallParam, null, null, 1, 100);
        const invList = invsRes.items || (Array.isArray(invsRes) ? invsRes : []);
        
        const monthCosts = {};
        invList.forEach(inv => {
           // We might have multiple invoices in a month, sum them up
           const key = `T${inv.month}/${inv.year.toString().slice(-2)}`;
           monthCosts[key] = (monthCosts[key] || 0) + inv.totalAmount;
        });
        
        // Generate last 6 months
        const last6Months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
           const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
           const m = d.getMonth() + 1;
           const y = d.getFullYear().toString().slice(-2);
           last6Months.push(`T${m}/${y}`);
        }
        
        const invData = last6Months.map(key => ({
          name: key,
          amount: monthCosts[key] || 0
        }));
        
        setInvoiceChartData(invData);
      } catch (e) {
        console.error("Failed to fetch invoices for bar chart", e);
      }

      // Fetch feedbacks
      try {
        let fbData = [];
        if (stallParam) {
           const fbRes = await vendorFeedbackApi.getReviewsByStall(stallParam);
           if (fbRes && fbRes.reviews) fbData = fbRes.reviews;
        } else if (rentedStalls.length > 0) {
           const stallIds = rentedStalls.map(s => s.stallId);
           const fbRes = await vendorFeedbackApi.getAllReviewsForStalls(stallIds);
           if (fbRes && fbRes.reviews) fbData = fbRes.reviews;
        }
        
        // Sort by date desc and take top 3
        fbData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentFeedbacks(fbData.slice(0, 3));
      } catch (e) {
        console.error("Failed to fetch feedbacks", e);
      }
    };
    
    if (user) fetchChartsAndFeedbacks();
  }, [user, selectedStallId, rentedStalls, t]);

  // Handle URL Params for Redirects (e.g., from MoMo Payment)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const menuParam = params.get('menu');
    const paymentParam = params.get('payment');
    
    if (menuParam) {
      setActiveMenu(menuParam);
    }
    
    if (paymentParam === 'success') {
      setTimeout(() => showSuccess('Thanh toán hóa đơn thành công!'), 500);
      window.history.replaceState({}, '', '/vendor/dashboard');
    } else if (paymentParam === 'error') {
      setTimeout(() => showError('Thanh toán thất bại hoặc có lỗi xảy ra!'), 500);
      window.history.replaceState({}, '', '/vendor/dashboard');
    }
  }, []);

  const MENU_ITEMS = [
    { id: 'DASHBOARD', label: t('vendordashboard.overview'), icon: <IconHome /> },
    { id: 'SERVICES', label: t('vendordashboard.services'), icon: <IconServices /> },
    { id: 'REQUESTS', label: t('vendordashboard.requests'), icon: <IconRequests /> },
    { id: 'FEEDBACK', label: t('vendordashboard.feedback'), icon: <IconFeedback /> },
    { id: 'NOTIFICATIONS', label: t('vendordashboard.notifications'), icon: <IconNotifications /> },
    { id: 'BILLS', label: t('vendordashboard.bills'), icon: <IconBills /> },
    { id: 'VIOLATIONS', label: t('vendordashboard.violations'), icon: <IconViolations /> },
  ];

  // SEO Update
  useEffect(() => {
    const titleMap = {
      'SERVICES': t('vendordashboard.my_service'),
      'REQUESTS': t('vendordashboard.request_support'),
      'FEEDBACK': t('vendordashboard.comment'),
      'NOTIFICATIONS': t('vendordashboard.notification'),
      'BILLS': t('vendordashboard.bill'),
      'VIOLATIONS': t('vendordashboard.violation_error'),
      'PROFILE': t('vendordashboard.personal_profile')
    };
    document.title = `${titleMap[activeMenu] || 'Dashboard'} - Vendor Portal | STMM`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = `Quản lý ${titleMap[activeMenu] || t('vendordashboard.information')} dành cho tiểu thương tại chợ thông minh STMM.`;
  }, [activeMenu]);

  return (
    <div className="vendor-portal-container">
      {/* Sidebar */}
      <aside className="vendor-sidebar" aria-label="Main Navigation">
        <div className="brand-section">
          <div className="brand-logo">
            ST
          </div>
          <div className="brand-name">
            <h2 className="brand-title">VendorPortal</h2>
            <span className="brand-subtitle">{t('vendordashboard.management_console')}</span>
          </div>
        </div>

        <nav className="sidebar-menu" aria-label="Vendor Menu">
          <h3 className="sidebar-section-label">Main Menu</h3>
          {MENU_ITEMS.map((item) => (
            <a 
              key={item.id} 
              href="#"
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveMenu(item.id); }}
              aria-current={activeMenu === item.id ? 'page' : undefined}
            >
              <div className="menu-icon">{item.icon}</div>
              <span className="menu-label">{item.label}</span>
            </a>
          ))}
        </nav>


        <div className="sidebar-footer">
          <button className="vendor-logout-btn" onClick={onLogout} aria-label={t('vendordashboard.logout')}>
            <IconLogout />
            <span>{t('vendordashboard.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="vendor-main-area">
        {/* Top Navbar */}
        <header className="vendor-topbar">
          <div className="vendor-topbar-title">VendorPortal</div>
          
          <div className="vendor-topbar-right">
            <LanguageSwitcher />
            {rentedStalls.length > 0 && (
              <select 
                value={selectedStallId} 
                onChange={(e) => setSelectedStallId(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">{t('vendordashboard.all_stalls', { count: rentedStalls.length })}</option>
                {rentedStalls.map(s => (
                  <option key={s.stallId} value={s.stallId}>{t('vendordashboard.stall', { code: s.code })}</option>
                ))}
              </select>
            )}
            <div className="vendor-search-bar">
              <IconSearch />
              <input 
                type="text" 
                placeholder={t('vendordashboard.search_for_services')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="vendor-topbar-icons">
              <div 
                style={{ cursor: 'pointer', position: 'relative' }} 
                onClick={() => setActiveMenu('NOTIFICATIONS')}
              >
                <IconNotifications />
                {unreadNotificationCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    border: '2px solid white'
                  }}>
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </div>
              <div style={{ cursor: 'pointer' }} onClick={() => setActiveMenu('PROFILE')}>
                  <IconUser />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="vendor-content">
          {activeMenu === 'DASHBOARD' && (
            <section className="manager-dashboard-container" aria-label="Dashboard Overview" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              
              <header className="dashboard-welcome-header">
                <div className="welcome-profile-section">
                  <div className="profile-badge-glow">
                    V
                  </div>
                  <div className="welcome-text-wrap">
                    <h1>VendorPortal</h1>
                    <p className="welcome-subtitle">{t('vendordashboard.management_console')}</p>
                  </div>
                </div>
              </header>

              {/* Row 1: 4 small cards */}
              <div className="dashboard-stats-grid">
                <article className="stat-summary-card clickable-card" onClick={() => setActiveMenu('SERVICES')}>
                  <div className="card-top">
                    <h3 className="card-title">{t('vendordashboard.services')} {i18n.language === 'en' ? 'in use' : 'đang dùng'}</h3>
                    <div className="icon-badge" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                      <IconServices />
                    </div>
                  </div>
                  <div className="card-middle">
                    <span className="main-stat">{dashboardStats.activeServices}</span>
                  </div>
                </article>
                <article className="stat-summary-card clickable-card" onClick={() => setActiveMenu('REQUESTS')}>
                  <div className="card-top">
                    <h3 className="card-title">{t('vendordashboard.pending_requests')}</h3>
                    <div className="icon-badge" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                      <IconRequests />
                    </div>
                  </div>
                  <div className="card-middle">
                    <span className="main-stat" style={{ color: '#22c55e' }}>{dashboardStats.pendingRequests}</span>
                  </div>
                </article>
                <article className="stat-summary-card clickable-card" onClick={() => setActiveMenu('BILLS')}>
                  <div className="card-top">
                    <h3 className="card-title">{t('vendordashboard.unpaid_bills')}</h3>
                    <div className="icon-badge" style={{ background: '#fef2f2', color: '#ef4444' }}>
                      <IconBills />
                    </div>
                  </div>
                  <div className="card-middle">
                    <span className="main-stat" style={{ color: '#ef4444' }}>{dashboardStats.unpaidBills}</span>
                  </div>
                </article>
                <article className="stat-summary-card clickable-card" onClick={() => setActiveMenu('VIOLATIONS')}>
                  <div className="card-top">
                    <h3 className="card-title">{t('vendordashboard.violations')}</h3>
                    <div className="icon-badge" style={{ background: '#fffbeb', color: '#f59e0b' }}>
                      <IconViolations />
                    </div>
                  </div>
                  <div className="card-middle">
                    <span className="main-stat" style={{ color: '#f59e0b' }}>{dashboardStats.violations}</span>
                  </div>
                </article>
              </div>

              {/* Analytics Area */}
              <div className="vendor-overview-bottom-area" style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                {/* Left Column (Bar Chart) */}
                <article className="premium-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <h3 className="premium-panel-title">{i18n.language === 'en' ? 'RECENT INVOICE COSTS' : 'CHI PHÍ HÓA ĐƠN GẦN ĐÂY'}</h3>
                  <div style={{ flex: 1, minHeight: '280px', width: '100%' }}>
                    {invoiceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={invoiceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value / 1000}k`}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                            labelStyle={{ color: '#0f172a', fontWeight: '800', marginBottom: '8px' }}
                          />
                          <Bar dataKey="amount" fill="url(#colorAmount)" radius={[8, 8, 0, 0]} barSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span>Chưa có dữ liệu hóa đơn</span>
                      </div>
                    )}
                  </div>
                </article>

                {/* Right Column (Recent Feedbacks) */}
                <article className="premium-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <h3 className="premium-panel-title">{i18n.language === 'en' ? 'RECENT FEEDBACK' : 'ĐÁNH GIÁ GẦN ĐÂY'}</h3>
                  <div className="recent-feedbacks-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '8px' }}>
                    {recentFeedbacks.length > 0 ? (
                      recentFeedbacks.map((fb, idx) => (
                        <div key={idx} className="premium-feedback-card">
                          <div className="feedback-header">
                            <div className="avatar">
                                {fb.userName ? fb.userName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="feedback-info">
                              <span className="customer-name">{fb.userName || 'Khách hàng'}</span>
                              <div className="stars" style={{ color: '#fbbf24', fontSize: '14px', letterSpacing: '2px' }}>
                                {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                              </div>
                            </div>
                          </div>
                          <p className="feedback-comment">"{fb.comment || 'Không có bình luận'}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-alert-state" style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                        <span>Chưa có đánh giá nào</span>
                      </div>
                    )}
                  </div>
                </article>
              </div>

            </section>
          )}

          {activeMenu === 'SERVICES' && serviceTab === 'AVAILABLE' && (
            <div style={{ height: '100%' }}>
              <VendorServiceList 
                vendorId={vendorId} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm}
                stallId={selectedStallId}
                onViewMyServices={() => setServiceTab('MY_SERVICES')}
              />
            </div>
          )}

          {activeMenu === 'SERVICES' && serviceTab === 'MY_SERVICES' && (
            <div style={{ height: '100%' }}>
              <VendorMyServices 
                vendorId={vendorId} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm}
                stallId={selectedStallId}
                onAddService={() => setServiceTab('AVAILABLE')} 
              />
            </div>
          )}

          {activeMenu === 'PROFILE' && (
            <div style={{ height: '100%' }}>
              <VendorProfile />
            </div>
          )}

          {activeMenu === 'REQUESTS' && (
            <div style={{ height: '100%' }}>
              <VendorRequestList 
                vendorId={vendorId} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm}
                stallId={selectedStallId}
              />
            </div>
          )}

          {activeMenu === 'FEEDBACK' && (
            <div style={{ height: '100%' }}>
              <VendorFeedbackList stallId={selectedStallId} rentedStalls={rentedStalls} />
            </div>
          )}

          {activeMenu === 'NOTIFICATIONS' && (
            <div style={{ height: '100%' }}>
              <VendorNotificationList onUpdateUnreadCount={setUnreadNotificationCount} />
            </div>
          )}

          {activeMenu === 'BILLS' && (
            <div style={{ height: '100%' }}>
              <VendorBillsList vendorId={vendorId} stallId={selectedStallId} />
            </div>
          )}

          {activeMenu === 'VIOLATIONS' && (
            <div style={{ height: '100%' }}>
              <VendorViolationList stallId={selectedStallId} />
            </div>
          )}

          {activeMenu !== 'SERVICES' && activeMenu !== 'PROFILE' && activeMenu !== 'REQUESTS' && activeMenu !== 'VIOLATIONS' && activeMenu !== 'DASHBOARD' && activeMenu !== 'FEEDBACK' && activeMenu !== 'NOTIFICATIONS' && activeMenu !== 'BILLS' && (
            <div style={{ color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <h2>Chức năng {activeMenu} đang được phát triển.</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

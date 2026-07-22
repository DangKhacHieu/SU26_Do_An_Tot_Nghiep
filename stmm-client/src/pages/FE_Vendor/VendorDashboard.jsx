import React, { useState, useEffect } from "react";
import axios from 'axios';
import "./VendorDashboard.css";
import VendorServiceList from "../FE_Vendor/VendorServices/VendorServiceList";
import VendorMyServices from "../FE_Vendor/VendorServices/VendorMyServices";
import VendorRequestList from "./VendorRequests/VendorRequestList";
import VendorViolationList from "./VendorViolations/VendorViolationList";
import VendorProfile from "./VendorProfile";
import VendorBillsList from "./VendorBills/VendorBillsList";
import VendorNotificationList from "./VendorNotifications/VendorNotificationList";
import VendorFeedbackList from "./VendorFeedbacks/VendorFeedbackList";
import notificationService from "../../services/notificationService";

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

function VendorDashboard({ user, onBack, onLogout }) {
  const vendorId = user?.userId;
  const [activeMenu, setActiveMenu] = useState('DASHBOARD');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceTab, setServiceTab] = useState('AVAILABLE'); // 'AVAILABLE' | 'MY_SERVICES'
  const [rentedStalls, setRentedStalls] = useState([]);
  const [selectedStallId, setSelectedStallId] = useState('ALL');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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

  // Handle URL Params for Redirects (e.g., from MoMo Payment)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const menuParam = params.get('menu');
    const paymentParam = params.get('payment');
    
    if (menuParam) {
      setActiveMenu(menuParam);
    }
    
    if (paymentParam === 'success') {
      setTimeout(() => alert('Thanh toán hóa đơn qua MoMo thành công!'), 500);
      window.history.replaceState({}, '', '/vendor/dashboard');
    } else if (paymentParam === 'error') {
      setTimeout(() => alert('Thanh toán thất bại hoặc có lỗi xảy ra!'), 500);
      window.history.replaceState({}, '', '/vendor/dashboard');
    }
  }, []);

  const MENU_ITEMS = [
    { id: 'DASHBOARD', label: 'OVERVIEW', icon: <IconHome /> },
    { id: 'SERVICES', label: 'SERVICES', icon: <IconServices /> },
    { id: 'REQUESTS', label: 'REQUESTS', icon: <IconRequests /> },
    { id: 'FEEDBACK', label: 'FEEDBACK', icon: <IconFeedback /> },
    { id: 'NOTIFICATIONS', label: 'NOTIFICATIONS', icon: <IconNotifications /> },
    { id: 'BILLS', label: 'BILLS', icon: <IconBills /> },
    { id: 'VIOLATIONS', label: 'VIOLATIONS', icon: <IconViolations /> },
  ];

  // SEO Update
  useEffect(() => {
    const titleMap = {
      'SERVICES': 'Dịch vụ của tôi',
      'REQUESTS': 'Yêu cầu hỗ trợ',
      'FEEDBACK': 'Góp ý',
      'NOTIFICATIONS': 'Thông báo',
      'BILLS': 'Hóa đơn',
      'VIOLATIONS': 'Lỗi vi phạm',
      'PROFILE': 'Hồ sơ cá nhân'
    };
    document.title = `${titleMap[activeMenu] || 'Dashboard'} - Vendor Portal | STMM`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = `Quản lý ${titleMap[activeMenu] || 'thông tin'} dành cho tiểu thương tại chợ thông minh STMM.`;
  }, [activeMenu]);

  return (
    <div className="vendor-portal-container">
      {/* Sidebar */}
      <aside className="vendor-sidebar">
        <div className="vendor-sidebar-header">
          <div className="vendor-sidebar-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="vendor-sidebar-title">
            <h2>VendorPortal</h2>
            <span>Management Console</span>
          </div>
        </div>

        <nav className="vendor-sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <div 
              key={item.id} 
              className={`vendor-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="vendor-sidebar-footer">
          <button className="vendor-logout-btn" onClick={onLogout}>
            <IconLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="vendor-main-area">
        {/* Top Navbar */}
        <header className="vendor-topbar">
          <div className="vendor-topbar-title">VendorPortal</div>
          
          <div className="vendor-topbar-right">
            {rentedStalls.length > 0 && (
              <select 
                value={selectedStallId} 
                onChange={(e) => setSelectedStallId(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">Tất cả sạp ({rentedStalls.length})</option>
                {rentedStalls.map(s => (
                  <option key={s.stallId} value={s.stallId}>Sạp {s.code}</option>
                ))}
              </select>
            )}
            <div className="vendor-search-bar">
              <IconSearch />
              <input 
                type="text" 
                placeholder="Tìm kiếm dịch vụ..." 
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
              <IconSetting />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="vendor-content">
          {activeMenu === 'DASHBOARD' && (
            <div className="vendor-overview-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              
              {/* Row 1: 4 small cards */}
              <div className="vendor-overview-top-row">
                <div className="dashboard-card">
                  <h3 style={{ fontSize: '14px', color: '#64748b', margin: 0, marginBottom: '8px' }}>Active Stalls</h3>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>2</div>
                </div>
                <div className="dashboard-card">
                  <h3 style={{ fontSize: '14px', color: '#64748b', margin: 0, marginBottom: '8px' }}>Pending Requests</h3>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>5</div>
                </div>
                <div className="dashboard-card">
                  <h3 style={{ fontSize: '14px', color: '#64748b', margin: 0, marginBottom: '8px' }}>Unpaid Bills</h3>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>1</div>
                </div>
                <div className="dashboard-card">
                  <h3 style={{ fontSize: '14px', color: '#64748b', margin: 0, marginBottom: '8px' }}>Violations</h3>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#d97706' }}>0</div>
                </div>
              </div>

              {/* Bottom Area: 2 Columns */}
              <div className="vendor-overview-bottom-area">
                {/* Left Column (2 large blocks) */}
                <div className="vendor-overview-left-col">
                  <div className="dashboard-card large-panel" style={{ flex: 1.5 }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, marginBottom: '16px' }}>Overview Chart</h3>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>[Chart Placeholder]</div>
                  </div>
                  <div className="dashboard-card large-panel" style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, marginBottom: '16px' }}>Recent Activity</h3>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>[Table/List Placeholder]</div>
                  </div>
                </div>
                
                {/* Right Column (3 smaller stacked blocks) */}
                <div className="vendor-overview-right-col">
                  <div className="dashboard-card" style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, marginBottom: '16px' }}>Notifications</h3>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}></div>
                  </div>
                  <div className="dashboard-card" style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, marginBottom: '16px' }}>Upcoming Payments</h3>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}></div>
                  </div>
                  <div className="dashboard-card" style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', margin: 0, marginBottom: '16px' }}>Quick Actions</h3>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}></div>
                  </div>
                </div>
              </div>

            </div>
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

export default VendorDashboard;

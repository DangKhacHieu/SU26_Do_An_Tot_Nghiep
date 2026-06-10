import React, { useState } from "react";
import "./VendorDashboard.css";
import VendorServiceList from "../FE_Vendor/VendorServices/VendorServiceList";
import VendorMyServices from "../FE_Vendor/VendorServices/VendorMyServices";
import VendorProfile from "./VendorProfile";

// Icons
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
  const [activeMenu, setActiveMenu] = useState('REQUESTS');
  const [activeSubTab, setActiveSubTab] = useState('my-services');
  const [searchTerm, setSearchTerm] = useState('');

  const MENU_ITEMS = [
    { id: 'SERVICES', label: 'SERVICES', icon: <IconServices /> },
    { id: 'REQUESTS', label: 'REQUESTS', icon: <IconRequests /> },
    { id: 'FEEDBACK', label: 'FEEDBACK', icon: <IconFeedback /> },
    { id: 'NOTIFICATIONS', label: 'NOTIFICATIONS', icon: <IconNotifications /> },
    { id: 'BILLS', label: 'BILLS', icon: <IconBills /> },
    { id: 'VIOLATIONS', label: 'VIOLATIONS', icon: <IconViolations /> },
  ];

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
              <IconNotifications />
              <div style={{ cursor: 'pointer' }} onClick={() => setActiveMenu('PROFILE')}>
                  <IconUser />
              </div>
              <IconSetting />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="vendor-content">
          {activeMenu === 'SERVICES' && (
            <div style={{ height: '100%' }}>
              <VendorServiceList 
                vendorId={vendorId} 
                searchTerm={searchTerm} 
              />
            </div>
          )}

          {activeMenu === 'REQUESTS' && (
            <div style={{ height: '100%' }}>
              <VendorMyServices 
                vendorId={vendorId} 
                searchTerm={searchTerm} 
                onAddService={() => setActiveMenu('SERVICES')} 
              />
            </div>
          )}

          {activeMenu === 'PROFILE' && (
            <div style={{ height: '100%' }}>
              <VendorProfile />
            </div>
          )}

          {activeMenu !== 'SERVICES' && activeMenu !== 'REQUESTS' && activeMenu !== 'PROFILE' && (
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

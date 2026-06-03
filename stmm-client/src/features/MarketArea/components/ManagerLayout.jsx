import React from 'react';
import styles from './ManagerLayout.module.css';

const ManagerLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBox}>
            <span className={styles.logoText}>M</span>
          </div>
          <div className={styles.titleBox}>
            <h1 className={styles.mainTitle}>MarketManager</h1>
            <span className={styles.subTitle}>Management Console</span>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navItem} ${activeTab === 'OVERVIEW' ? styles.active : ''}`}
            onClick={() => setActiveTab('OVERVIEW')}
          >
            <span className={styles.navIcon}>📊</span>
            OVERVIEW
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'ZONES' ? styles.active : ''}`}
            onClick={() => setActiveTab('ZONES')}
          >
            <span className={styles.navIcon}>🗺️</span>
            ZONES & LAYOUT
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'STALLS' ? styles.active : ''}`}
            onClick={() => setActiveTab('STALLS')}
          >
            <span className={styles.navIcon}>🏬</span>
            STALLS
          </button>

          <button 
            className={`${styles.navItem} ${activeTab === 'REQUESTS' ? styles.active : ''}`}
            onClick={() => setActiveTab('REQUESTS')}
          >
            <span className={styles.navIcon}>📝</span>
            REQUESTS
          </button>

          <button 
            className={`${styles.navItem} ${activeTab === 'BILLS' ? styles.active : ''}`}
            onClick={() => setActiveTab('BILLS')}
          >
            <span className={styles.navIcon}>💳</span>
            BILLS
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn}>
            <span className={styles.navIcon}>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Top Navbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 className={styles.pageTitle}>MarketManager</h2>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input type="text" placeholder="Search..." className={styles.searchInput} />
            </div>
            <button className={styles.iconBtn}>🔔</button>
            <button className={styles.iconBtn}>⚙️</button>
            <div className={styles.profileAvatar}>A</div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;

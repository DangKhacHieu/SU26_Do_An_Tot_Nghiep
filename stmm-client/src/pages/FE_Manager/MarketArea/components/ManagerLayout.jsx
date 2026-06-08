import React from 'react';
import styles from './ManagerLayout.module.css';

const ManagerLayout = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBox}>
            <span className={styles.logoText}>S</span>
          </div>
          <div className={styles.titleBox}>
            <h1 className={styles.mainTitle}>SHMM</h1>
            <span className={styles.subTitle}>Manager Console</span>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navItem} ${activeTab === 'DASHBOARD' ? styles.active : ''}`}
            onClick={() => setActiveTab('DASHBOARD')}
          >
            <span className={styles.navIcon}>📊</span>
            DASHBOARD
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'ZONES' ? styles.active : ''}`}
            onClick={() => setActiveTab('ZONES')}
          >
            <span className={styles.navIcon}>🗺️</span>
            MARKET AREAS
          </button>
          
          <button 
            className={`${styles.navItem} ${activeTab === 'VENDORS' ? styles.active : ''}`}
            onClick={() => setActiveTab('VENDORS')}
          >
            <span className={styles.navIcon}>👥</span>
            VENDORS
          </button>

          <button 
            className={`${styles.navItem} ${activeTab === 'BILLS' ? styles.active : ''}`}
            onClick={() => setActiveTab('BILLS')}
          >
            <span className={styles.navIcon}>💳</span>
            BILLS
          </button>

          <button 
            className={`${styles.navItem} ${activeTab === 'VIOLATIONS' ? styles.active : ''}`}
            onClick={() => setActiveTab('VIOLATIONS')}
          >
            <span className={styles.navIcon}>⚠️</span>
            VIOLATIONS
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
            {/* Can put breadcrumbs or current page title here */}
            <h2 className={styles.pageTitle}>{activeTab === 'ZONES' ? 'Market Areas' : activeTab}</h2>
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

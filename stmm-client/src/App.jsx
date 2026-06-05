import React, { useState } from 'react';
import ViolationList from './components/ViolationList';
import ViolationDetails from './components/ViolationDetails';
import CreateViolationModal from './components/CreateViolationModal';
import MeterReadingHistory from './components/MeterReadingHistory';
import MeterDetail from './components/MeterDetail';
import RecordMeterReadingModal from './components/RecordMeterReadingModal';
import IssueList from './components/IssueList';
import IssueDetails from './components/IssueDetails';
import CreateIssueModal from './components/CreateIssueModal';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('violations');
  const [selectedViolationId, setSelectedViolationId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Issue state
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  
  // Meter readings state
  const [selectedStallIdForMeters, setSelectedStallIdForMeters] = useState(1);
  const [selectedMeterIdForDetail, setSelectedMeterIdForDetail] = useState(null);
  const [showRecordReadingModal, setShowRecordReadingModal] = useState(false);

  // Developer configuration testing tools
  const [userId, setUserId] = useState(1);
  const [baseUrl, setBaseUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:5056');
  const [notification, setNotification] = useState(null);

  const handleShowNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleViewDetails = (id) => {
    setSelectedViolationId(id);
    setCurrentView('violation-details');
  };

  const handleCreateSuccess = (newViolation) => {
    setShowCreateModal(false);
    handleShowNotification(`Successfully logged Violation: VIO-${newViolation.violationId}`);
    // Force reload violation list by resetting view to violations
    if (currentView === 'violations') {
      setCurrentView('temp');
      setTimeout(() => setCurrentView('violations'), 10);
    } else {
      setCurrentView('violations');
    }
  };

  const handleViewIssueDetails = (id) => {
    setSelectedIssueId(id);
    setCurrentView('issue-details');
  };

  const handleCreateIssueSuccess = (newIssue) => {
    setShowCreateIssueModal(false);
    handleShowNotification(`Successfully logged Issue: ISS-${newIssue.issueId}`);
    // Force reload issue list by resetting view to issues
    if (currentView === 'issues') {
      setCurrentView('temp');
      setTimeout(() => setCurrentView('issues'), 10);
    } else {
      setCurrentView('issues');
    }
  };

  return (
    <div className="app-shell">
      {/* Dev Configuration Tools Header */}
      <header className="dev-config-header">
        <div className="dev-logo-section">
          <strong>MHMS Staff Console</strong> <span className="dev-badge">TESTING TOOL</span>
        </div>
        <div className="dev-inputs-section">
          <div className="dev-input-group">
            <label>API Base URL:</label>
            <input 
              type="text" 
              value={baseUrl} 
              onChange={(e) => setBaseUrl(e.target.value)} 
              placeholder="e.g. http://localhost:5056"
            />
          </div>
          <div className="dev-input-group">
            <label>Current Staff ID:</label>
            <input 
              type="number" 
              value={userId} 
              onChange={(e) => setUserId(parseInt(e.target.value) || 1)} 
              min="1"
            />
          </div>
          <div className="dev-input-group">
            <label>Stall ID for Meters:</label>
            <input 
              type="number" 
              value={selectedStallIdForMeters} 
              onChange={(e) => setSelectedStallIdForMeters(parseInt(e.target.value) || 1)} 
              min="1"
            />
          </div>
        </div>
      </header>

      {/* Global Notifications */}
      {notification && (
        <div className={`global-toast-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="app-body">
        {/* Sidebar Layout */}
        <aside className="app-sidebar">
          <div className="sidebar-brand-section">
            <h2 className="sidebar-brand">MHMS STAFF</h2>
            <span className="sidebar-brand-sub">MANAGEMENT CONSOLE</span>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <span className="sidebar-nav-icon">📊</span> Dashboard
            </button>
            <button 
              className={`sidebar-nav-item ${currentView === 'tasks' ? 'active' : ''}`}
              onClick={() => setCurrentView('tasks')}
            >
              <span className="sidebar-nav-icon">📋</span> Tasks
            </button>
            <button 
              className={`sidebar-nav-item ${['meters', 'meter-details'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('meters')}
            >
              {/* TODO: Remove when StallList navigation is complete */}
              <span className="sidebar-nav-icon">⚡</span> Meters
            </button>
            <button 
              className={`sidebar-nav-item ${['violations', 'violation-details'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('violations')}
            >
              <span className="sidebar-nav-icon">⚠️</span> Violations
            </button>
            <button 
              className={`sidebar-nav-item ${['issues', 'issue-details'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('issues')}
            >
              <span className="sidebar-nav-icon">🔧</span> Issues
            </button>
            <button 
              className={`sidebar-nav-item ${currentView === 'stall-list' ? 'active' : ''}`}
              onClick={() => setCurrentView('stall-list')}
            >
              <span className="sidebar-nav-icon">🏪</span> List Stall
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-nav-item logout-btn" onClick={() => alert("Logged out! (Demo)")}>
              <span className="sidebar-nav-icon">🚪</span> LOGOUT
            </button>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="app-main-content">
          <div className="main-top-navbar">
            <div className="navbar-title">Market Management</div>
            <div className="navbar-search-placeholder">
              <input type="text" placeholder="Search system..." disabled />
            </div>
            <div className="navbar-icons-placeholder">
              <span className="nav-icon" title="Notifications">🔔</span>
              <span className="nav-icon" title="Help">❓</span>
              <span className="nav-icon" title="Settings">⚙️</span>
              <div className="user-profile-circle">
                <span>SU</span>
              </div>
            </div>
          </div>

          <div className="main-content-scroll">
            {currentView === 'violations' && (
              <ViolationList 
                userId={userId} 
                baseUrl={baseUrl} 
                onViewDetails={handleViewDetails}
                onOpenCreateModal={() => setShowCreateModal(true)}
              />
            )}

            {currentView === 'violation-details' && (
              <ViolationDetails
                violationId={selectedViolationId}
                userId={userId}
                baseUrl={baseUrl}
                onBack={() => setCurrentView('violations')}
              />
            )}

            {currentView === 'meters' && (
              <MeterReadingHistory
                stallId={selectedStallIdForMeters}
                baseUrl={baseUrl}
                userId={userId}
                onViewMeterDetail={(meterId) => {
                  setSelectedMeterIdForDetail(meterId);
                  setCurrentView('meter-details');
                }}
                onOpenRecordModal={() => setShowRecordReadingModal(true)}
                onBack={() => setCurrentView('dashboard')}
              />
            )}

            {currentView === 'meter-details' && (
              <MeterDetail
                meterId={selectedMeterIdForDetail}
                baseUrl={baseUrl}
                onBack={() => setCurrentView('meters')}
              />
            )}

            {currentView === 'dashboard' && (
              <div className="mock-view">
                <h1>📊 Staff Dashboard</h1>
                <p>Welcome to the Market Hall Management System (MHMS) staff console.</p>
                <div className="mock-grid">
                  <div className="mock-card">
                    <h3>My Reported Violations</h3>
                    <button className="btn-secondary" onClick={() => setCurrentView('violations')}>
                      Go to Violations
                    </button>
                  </div>
                  <div className="mock-card">
                    <h3>Meter Readings</h3>
                    <button className="btn-secondary" onClick={() => setCurrentView('meters')}>
                      Go to Meters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'tasks' && (
              <div className="mock-view">
                <h1>📋 Tasks List</h1>
                <p>Tasks assigned by management are listed here.</p>
              </div>
            )}

            {currentView === 'issues' && (
              <IssueList 
                userId={userId} 
                baseUrl={baseUrl} 
                onViewDetails={handleViewIssueDetails}
                onOpenCreateModal={() => setShowCreateIssueModal(true)}
              />
            )}

            {currentView === 'issue-details' && (
              <IssueDetails
                issueId={selectedIssueId}
                userId={userId}
                baseUrl={baseUrl}
                onBack={() => setCurrentView('issues')}
              />
            )}

            {currentView === 'stall-list' && (
              <div className="mock-view">
                <h1>🏪 Stalls Directory</h1>
                <p>View layouts and categories of stalls in the market.</p>
              </div>
            )}
            
            {currentView === 'temp' && <div className="loading-state">Loading...</div>}
          </div>
        </main>
      </div>

      {/* Create Violation Modal */}
      {showCreateModal && (
        <CreateViolationModal
          userId={userId}
          baseUrl={baseUrl}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Create Issue Modal */}
      {showCreateIssueModal && (
        <CreateIssueModal
          userId={userId}
          baseUrl={baseUrl}
          onClose={() => setShowCreateIssueModal(false)}
          onSuccess={handleCreateIssueSuccess}
        />
      )}

      {/* Record Meter Reading Modal */}
      {showRecordReadingModal && (
        <RecordMeterReadingModal
          stallId={selectedStallIdForMeters}
          baseUrl={baseUrl}
          userId={userId}
          onClose={() => setShowRecordReadingModal(false)}
          onSuccess={(newReading) => {
            setShowRecordReadingModal(false);
            handleShowNotification(`Successfully recorded reading: ${newReading.newValue} for meter ${newReading.meterSerialNumber}`);
            if (currentView === 'meters') {
              setCurrentView('temp');
              setTimeout(() => setCurrentView('meters'), 10);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';

export default function UtilityChecklist({ taskId, userId, baseUrl, onShowNotification }) {
  const [expanded, setExpanded] = useState(false);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache stats
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  const fetchStalls = async (isQuiet = false) => {
    if (!isQuiet) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/stalls?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load stalls list in this area.');
      }
      const data = await response.json();
      setStalls(data || []);
      
      // Compute stats
      const total = data.length;
      const completed = data.filter(s => s.hasReadingThisMonth).length;
      setStats({ completed, total });
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isQuiet) setLoading(false);
    }
  };

  // Pre-load stats quietly on mount
  useEffect(() => {
    fetchStalls(true);
  }, [taskId, userId]);

  const handleToggleExpand = () => {
    const nextState = !expanded;
    setExpanded(nextState);
    if (nextState) {
      fetchStalls();
    }
  };

  return (
    <div className="utility-checklist-panel">
      <div className="panel-header-with-action">
        <div className="checklist-summary-info">
          <h3 className="card-section-title">⚡ Stalls Utility Meter Checklist</h3>
          <p className="checklist-stat-text">
            Progress: <strong>{stats.completed} / {stats.total}</strong> stalls recorded this month
          </p>
        </div>
        <button 
          type="button" 
          onClick={handleToggleExpand}
          className="btn-secondary toggle-checklist-btn"
        >
          {expanded ? '▲ Collapse' : '▼ View Stalls List'}
        </button>
      </div>

      {expanded && (
        <div className="checklist-expand-content">
          {loading ? (
            <div className="loading-state-inline">Loading stalls list...</div>
          ) : error ? (
            <div className="error-alert">Error: {error}</div>
          ) : stalls.length === 0 ? (
            <div className="empty-table-cell" style={{ padding: '20px 0' }}>
              No stalls found in this area.
            </div>
          ) : (
            <div className="stalls-grid-checklist">
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>Stall Code</th>
                    <th>Operation Status</th>
                    <th style={{ textAlign: 'center' }}>Reading Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stalls.map(s => (
                    <tr key={s.stallId} className={s.hasReadingThisMonth ? 'row-completed' : 'row-pending'}>
                      <td className="stall-code-cell">🏪 {s.stallCode}</td>
                      <td>
                        <span className={`status-badge badge-default`}>
                          {s.stallStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.hasReadingThisMonth ? (
                          <span className="reading-done-badge" title="Electricity and Water meters recorded">
                            ✅ Recorded
                          </span>
                        ) : (
                          <span className="reading-pending-badge" title="Pending readings for this month">
                            ⏳ Pending Reading
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="checklist-footer-note">
            💡 *Please use the **Meters** tab in the sidebar navigation to record readings for each stall.*
          </div>
        </div>
      )}
    </div>
  );
}

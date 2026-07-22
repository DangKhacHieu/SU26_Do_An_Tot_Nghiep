import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Gauge, Lightbulb, Store } from 'lucide-react';
import RecordMeterReadingModal from '../RecordMeterReadingModal';

export default function UtilityChecklist({ taskId, baseUrl, onShowNotification, onProgressChange }) {
  const [expanded, setExpanded] = useState(false);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  const fetchStalls = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/stalls`);
      if (!response.ok) {
        let problem = null;
        try { problem = await response.json(); } catch { problem = null; }
        throw new Error(problem?.detail || problem?.title || 'Failed to load the stall checklist.');
      }

      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : [];
      const completed = items.filter((stall) => stall.hasReadingThisMonth).length;
      const nextStats = { completed, total: items.length };
      setStalls(items);
      setStats(nextStats);
      onProgressChange?.(nextStats.completed, nextStats.total);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [baseUrl, onProgressChange, taskId]);

  useEffect(() => {
    fetchStalls(true);
  }, [fetchStalls]);

  return (
    <section className="utility-checklist-panel">
      <div className="panel-header-with-action">
        <div className="checklist-summary-info">
          <h3 className="card-section-title"><Gauge size={18} aria-hidden="true" /> Utility Meter Checklist</h3>
          <p className="checklist-stat-text">Progress: <strong>{stats.completed} / {stats.total}</strong> stalls recorded this month</p>
        </div>
        <button
          type="button"
          onClick={() => { const next = !expanded; setExpanded(next); if (next) fetchStalls(); }}
          className="btn-secondary toggle-checklist-btn"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Collapse' : 'View Stalls'}
        </button>
      </div>

      {expanded ? (
        <div className="checklist-expand-content">
          {loading ? <div className="loading-state-inline">Loading stalls...</div> : null}
          {!loading && error ? <div className="error-alert">{error}</div> : null}
          {!loading && !error && stalls.length === 0 ? <div className="empty-table-cell">No stalls were found in this area.</div> : null}
          {!loading && !error && stalls.length > 0 ? (
            <div className="stalls-grid-checklist">
              <table className="checklist-table">
                <thead><tr><th>Stall</th><th>Operation Status</th><th>Reading Status</th><th>Action</th></tr></thead>
                <tbody>
                  {stalls.map((stall) => (
                    <tr key={stall.stallId} className={stall.hasReadingThisMonth ? 'row-completed' : 'row-pending'}>
                      <td className="stall-code-cell"><Store size={15} aria-hidden="true" /> {stall.stallCode}</td>
                      <td><span className="status-badge badge-default">{stall.stallStatus}</span></td>
                      <td>{stall.hasReadingThisMonth ? <span className="reading-done-badge">Recorded</span> : <span className="reading-pending-badge">Pending</span>}</td>
                      <td>
                        {!stall.hasReadingThisMonth ? (
                          <button type="button" className="btn-primary-dark checklist-record-btn" onClick={() => setSelectedStall(stall)}>Record</button>
                        ) : <span className="checklist-complete-label">Complete</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="checklist-footer-note"><Lightbulb size={15} aria-hidden="true" /> Record each stall here or from the Meters page.</div>
        </div>
      ) : null}

      {selectedStall ? (
        <RecordMeterReadingModal
          stallId={selectedStall.stallId}
          baseUrl={baseUrl}
          onClose={() => setSelectedStall(null)}
          onSuccess={async () => {
            const stallCode = selectedStall.stallCode;
            setSelectedStall(null);
            await fetchStalls(true);
            onShowNotification?.(`Meter reading for stall ${stallCode} was recorded.`, 'success');
          }}
        />
      ) : null}
    </section>
  );
}

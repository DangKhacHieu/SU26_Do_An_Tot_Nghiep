import React, { useState, useEffect } from 'react';

export default function MeterReadingHistory({ stallId, baseUrl, userId, onViewMeterDetail, onOpenRecordModal, onBack }) {
  const [readings, setReadings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [meterType, setMeterType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReadings = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${baseUrl}/api/meter-readings?stallId=${stallId}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (meterType) {
        url += `&meterType=${meterType}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch meter readings: ${response.statusText}`);
      }
      const data = await response.json();
      setReadings(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setReadings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [stallId, pageNumber, meterType]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="violation-list-container">
      <div className="breadcrumb-path">
        <span>Dashboard</span> &gt; <span>Stalls</span> &gt; <span className="active-path">Meter History</span>
      </div>

      <div className="section-header">
        <div>
          <h1 className="main-title">Meter Reading History (Stall ID: {stallId})</h1>
          <p className="subtitle">Displaying utility readings recorded over the last 6 months.</p>
        </div>
      </div>

      {/* Toolbar: Filters + CTA */}
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            value={meterType}
            onChange={(e) => { setMeterType(e.target.value); setPageNumber(1); }}
            className="filter-select"
          >
            <option value="">All Utilities</option>
            <option value="Electricity">Electricity (⚡)</option>
            <option value="Water">Water (💧)</option>
          </select>

          <button className="btn-secondary" onClick={fetchReadings} disabled={loading}>
            Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary-outline" onClick={onBack}>
            &larr; Back
          </button>
          <button className="btn-primary" onClick={onOpenRecordModal}>
            + Record Reading
          </button>
        </div>
      </div>

      {/* Content Table card */}
      {loading ? (
        <div className="loading-state">Loading history...</div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button className="btn-secondary" onClick={fetchReadings}>Retry</button>
        </div>
      ) : readings.length === 0 ? (
        <div className="empty-state">
          <p>No meter readings recorded for this stall in the last 6 months.</p>
        </div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">Meter Readings</span>
              <span className="table-count-badge">{totalCount} records</span>
            </div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Type</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Consumption</th>
                    <th>Recorded At</th>
                    <th>Staff</th>
                    <th>Evidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r.meterReadingId}>
                      <td>
                        <button 
                          className="btn-link" 
                          onClick={() => onViewMeterDetail(r.meterId)}
                          style={{ fontWeight: 'bold', padding: 0 }}
                        >
                          {r.meterSerialNumber}
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${r.meterType?.toLowerCase() === 'electricity' ? 'approved' : 'finalized'}`}>
                          {r.meterType === 'Electricity' ? '⚡ Electricity' : '💧 Water'}
                        </span>
                      </td>
                      <td>{r.oldValue}</td>
                      <td>{r.newValue}</td>
                      <td><strong>{r.consumption.toFixed(2)}</strong></td>
                      <td>{formatDate(r.recordedAt)}</td>
                      <td>{r.createdByName || `ID: ${r.createdByUserId}`}</td>
                      <td>
                        {r.imageUrl ? (
                          <a 
                            href={r.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-link"
                            style={{ color: '#0066cc' }}
                          >
                            View Image
                          </a>
                        ) : (
                          <span style={{ color: '#888' }}>No Image</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn-link" 
                          onClick={() => onViewMeterDetail(r.meterId)}
                        >
                          Meter Info
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination-wrapper">
            <span className="pagination-info">
              Showing {readings.length} entries of {totalCount} total
            </span>
            <div className="pagination-buttons">
              <button
                className="btn-page"
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber === 1}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn-page ${pageNumber === p ? 'active' : ''}`}
                  onClick={() => setPageNumber(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn-page"
                onClick={() => setPageNumber(p => Math.min(p + 1, totalPages))}
                disabled={pageNumber === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

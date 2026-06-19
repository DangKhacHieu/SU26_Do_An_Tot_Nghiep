import React, { useState, useEffect } from 'react';
import './IssueDetails.css';

export default function IssueDetails({ issueId, userId, baseUrl, onBack }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/staff/issues/${issueId}?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to load details: ${response.statusText}`);
        }
        const data = await response.json();
        setIssue(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [issueId, userId, baseUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) return <div className="loading-state">Loading issue details...</div>;
  
  if (error) return (
    <div className="error-state">
      <p className="error-message">Error: {error}</p>
      <button className="btn-secondary" onClick={onBack}>Back to List</button>
    </div>
  );

  if (!issue) return null;

  // Split semicolons to support multiple images
  const imageUrls = issue.imageUrl ? issue.imageUrl.split(';').map(u => u.trim()).filter(Boolean) : [];

  return (
    <div className="violation-details-container">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>ISSUE DETAILS: {issue.issueId}</h2>
        <button className="btn-secondary" onClick={onBack}>
          &larr; Back to List
        </button>
      </div>

      <div className="details-card">
        {/* Left Side: Issue Information */}
        <div className="details-info-section">
          <div className="info-block">
            <span className="info-label">STALL CODE / LOCATION</span>
            <span className="info-value stall-code-highlight">
              📍 {issue.stallCode || `Stall ID: ${issue.stallId}`}
            </span>
          </div>

          <div className="info-block">
            <span className="info-label">ISSUE TITLE</span>
            <span className="info-value title-val">{issue.title}</span>
          </div>

          <div className="info-block">
            <span className="info-label">DETAILED DESCRIPTION</span>
            <span className="info-value desc-val">{issue.description}</span>
          </div>

          <div className="info-row">
            <div className="info-block">
              <span className="info-label">REPORTED BY</span>
              <span className="info-value">{issue.createdByName || `Staff ${issue.createdByUserId}`}</span>
            </div>

            <div className="info-block">
              <span className="info-label">DATE LOGGED</span>
              <span className="info-value">{formatDate(issue.createdAt)}</span>
            </div>
          </div>

          <div className="info-block">
            <span className="info-label">STATUS</span>
            <div className="status-container">
              <span className={`status-badge-large ${issue.status?.toLowerCase() || 'reported'}`}>
                [STATUS: {issue.status?.toUpperCase() || 'REPORTED'}]
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Associated Repair Task */}
        <div className="details-evidence-section">
          <span className="info-label">REPAIR TASK INFORMATION:</span>
          <div style={{ marginTop: '12px', padding: '16px', border: '1px solid #000000', backgroundColor: '#f9f9f9' }}>
            {issue.assignedTaskId ? (
              <div>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>Task ID:</strong> {issue.assignedTaskId}
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>Status:</strong>{' '}
                  <span className="status-badge" style={{ display: 'inline' }}>
                    {issue.assignedTaskStatus}
                  </span>
                </p>
                <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#555' }}>
                  * This issue is currently assigned to a maintenance task. Check the Tasks list for execution details.
                </p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0', color: '#555', fontStyle: 'italic' }}>
                  No repair task assigned yet.
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#777' }}>
                  A manager will assign a technician to resolve this issue.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Evidence Section (Bottom or full width) */}
      <div style={{ marginTop: '24px', border: '2px solid #000000', padding: '32px', backgroundColor: '#ffffff' }}>
        <span className="info-label" style={{ display: 'block', marginBottom: '16px' }}>
          VISUAL EVIDENCE ({imageUrls.length} Attachments)
        </span>
        
        {imageUrls.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {imageUrls.map((url, index) => (
              <div key={index} className="evidence-photo-box" style={{ margin: '0', height: '240px' }}>
                <img 
                  src={url} 
                  alt={`Evidence ${index + 1}`} 
                  className="evidence-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', border: '1px dashed #000000', textAlign: 'center', color: '#555' }}>
            [NO PHOTO ATTACHED]
          </div>
        )}
      </div>

      <div className="audit-footer" style={{ marginTop: '24px' }}>
        Logged by: {issue.createdByName || `Staff #${issue.createdByUserId}`} | Timestamp: {formatDate(issue.createdAt)} {formatTime(issue.createdAt)}
      </div>
    </div>
  );
}

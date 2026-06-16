import React, { useState, useEffect } from 'react';
import './ViolationDetails.css';

export default function ViolationDetails({ violationId, userId, baseUrl, onBack }) {
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/violations/${violationId}?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to load details: ${response.statusText}`);
        }
        const data = await response.json();
        setViolation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [violationId, userId, baseUrl]);

  const formatVnd = (amount) => {
    if (amount === undefined || amount === null) return '0 VND';
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) return <div className="loading-state">Loading violation details...</div>;
  
  if (error) return (
    <div className="error-state">
      <p className="error-message">Error: {error}</p>
      <button className="btn-secondary" onClick={onBack}>Back to List</button>
    </div>
  );

  if (!violation) return null;

  return (
    <div className="violation-details-container">
      <div className="breadcrumb-path">
        <span>Dashboard</span> &gt; <span>Violations</span> &gt; <span className="active-path">Violation Details</span>
      </div>

      <div className="details-header">
        <h1 className="main-title">VIOLATION DETAILS: VIO-{violation.violationId}</h1>
        <button className="btn-secondary-outline" onClick={onBack}>
          &larr; Back to List
        </button>
      </div>

      <div className="details-card">
        <div className="details-info-section">
          <div className="info-block">
            <span className="info-label">STALL CODE</span>
            <span className="info-value stall-code-highlight">{violation.stallCode || `Stall ID: ${violation.stallId}`}</span>
          </div>

          <div className="info-block">
            <span className="info-label">VIOLATION TYPE</span>
            <span className="info-value">{violation.title}</span>
          </div>

          <div className="info-block">
            <span className="info-label">TITLE / VIOLATION SUMMARY</span>
            <span className="info-value title-val">{violation.title}</span>
          </div>

          <div className="info-block">
            <span className="info-label">DESCRIPTION</span>
            <span className="info-value desc-val">{violation.description}</span>
          </div>

          <div className="info-row">
            <div className="info-block">
              <span className="info-label">FINE AMOUNT</span>
              <span className="info-value fine-amount-highlight">{formatVnd(violation.fineAmount)}</span>
            </div>

            <div className="info-block">
              <span className="info-label">DATE LOGGED</span>
              <span className="info-value">{formatDate(violation.createdAt)}</span>
            </div>
          </div>

          <div className="info-block">
            <span className="info-label">STATUS</span>
            <div className="status-container">
              <span className={`status-badge-large ${violation.status?.toLowerCase() || 'pending'}`}>
                [STATUS: {violation.status?.toUpperCase() || 'PENDING'}]
              </span>
            </div>
          </div>
        </div>

        <div className="details-evidence-section">
          <span className="info-label">EVIDENCE PHOTO:</span>
          <div className="evidence-photo-box">
            {violation.imageUrl ? (
              <img 
                src={violation.imageUrl} 
                alt="Violation Evidence" 
                className="evidence-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/400x300?text=No+Image+Found';
                }}
              />
            ) : (
              <div className="no-photo-placeholder">
                <span>[NO PHOTO ATTACHED]</span>
              </div>
            )}
          </div>
          <p className="evidence-note">
            Note: This record is locked for auditing purposes. Evidence cannot be modified once the violation has been officially logged by the system.
          </p>
        </div>
      </div>

      <div className="audit-footer">
        Logged by: Staff User #{violation.createdBy} | Timestamp: {formatDate(violation.createdAt)} {formatTime(violation.createdAt)}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import './MeterDetail.css';

export default function MeterDetail({ meterId, baseUrl, onBack }) {
  const [meter, setMeter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeterDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/meters/${meterId}`);
        if (!response.ok) {
          throw new Error(`Failed to load meter details: ${response.statusText}`);
        }
        const data = await response.json();
        setMeter(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeterDetail();
  }, [meterId, baseUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className="loading-state">Loading meter details...</div>;

  if (error) return (
    <div className="error-state">
      <p className="error-message">Error: {error}</p>
      <button className="btn-secondary" onClick={onBack}>Back to History</button>
    </div>
  );

  if (!meter) return null;

  return (
    <div className="violation-details-container">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>METER DETAILS: {meter.serialNumber}</h2>
        <button className="btn-secondary-outline" onClick={onBack}>
          &larr; Back to History
        </button>
      </div>

      <div className="details-card">
        <div className="details-info-section" style={{ width: '100%' }}>
          <div className="info-block">
            <span className="info-label">SERIAL NUMBER</span>
            <span className="info-value stall-code-highlight">{meter.serialNumber}</span>
          </div>

          <div className="info-block">
            <span className="info-label">METER TYPE</span>
            <span className="info-value">
              {meter.type === 'Electricity' ? '⚡ Electricity Meter' : '💧 Water Meter'}
            </span>
          </div>

          <div className="info-block">
            <span className="info-label">STALL CODE / LOCATION</span>
            <span className="info-value">{meter.stallCode || `Stall ID: ${meter.stallId}`}</span>
          </div>

          <div className="info-block">
            <span className="info-label">INSTALLED DATE</span>
            <span className="info-value">{formatDate(meter.installedAt)}</span>
          </div>

          <div className="info-block">
            <span className="info-label">STATUS</span>
            <div className="status-container">
              <span className={`status-badge-large ${meter.isActive ? 'approved' : 'rejected'}`}>
                [STATUS: {meter.isActive ? 'ACTIVE' : 'INACTIVE / REPLACED'}]
              </span>
            </div>
          </div>

          {meter.lastReadingValue !== null && meter.lastReadingValue !== undefined && (
            <div className="info-block" style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
              <span className="info-label">LATEST RECORDED VALUE</span>
              <span className="info-value" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                {meter.lastReadingValue}
              </span>
            </div>
          )}

          {meter.lastReadingImageUrl && (
            <div className="info-block" style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
              <span className="info-label">LATEST READING EVIDENCE PHOTO</span>
              <div className="meter-evidence-photo-container" style={{ marginTop: '10px' }}>
                <img 
                  src={meter.lastReadingImageUrl} 
                  alt="Latest Meter Reading Evidence" 
                  style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'block', objectFit: 'contain' }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

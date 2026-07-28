import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './IssueDetails.css';

export default function IssueDetails({ issueId, baseUrl, onBack }) {
  const { t } = useTranslation();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/staff/issues/${issueId}`, { headers: getAuthHeaders() });
        if (!response.ok) {
          let problem = null;
          try { problem = await response.json(); } catch { problem = null; }
          throw new Error(response.status === 404
            ? t('issuedetails.issue_not_found_or')
            : problem?.detail || problem?.title || t('issuedetails.unable_to_load_issue'));
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
  }, [issueId, baseUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return t('issuedetails.na');
    return new Date(dateString).toLocaleDateString(t('issuedetails.enus'), {
      year: t('issuedetails.numeric'),
      month: t('issuedetails.long'),
      day: t('issuedetails.numeric')
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return t('issuedetails.na');
    return new Date(dateString).toLocaleTimeString(t('issuedetails.enus'), {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) return <div className="loading-state">{t('issuedetails.loading_issue_details')}</div>;
  
  if (error) return (
    <div className="error-state">
      <p className="error-message">Error: {error}</p>
      <button className="btn-secondary" onClick={onBack}>{t('issuedetails.back_to_list')}</button>
    </div>
  );

  if (!issue) return null;

  const imageUrls = issue.imageUrl ? issue.imageUrl.split(';').map(u => u.trim()).filter(Boolean) : [];

  return (
    <div className="violation-details-container">
      <div className="details-header" style={{ display: 'flex', justifyContent: t('issuedetails.spacebetween'), alignItems: t('issuedetails.center'), marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>ISSUE DETAILS: {issue.issueId}</h2>
        <button className="btn-secondary" onClick={onBack}>
          &larr; Back to List
        </button>
      </div>

      <div className="details-card">
        <div className="details-info-section">
          <div className="info-block">
            <span className="info-label">{t('issuedetails.stall_code_location')}</span>
            <span className="info-value stall-code-highlight">
              📍 {issue.stallCode || `Stall ID: ${issue.stallId}`}
            </span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('issuedetails.issue_title')}</span>
            <span className="info-value title-val">{issue.title}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('issuedetails.detailed_description')}</span>
            <span className="info-value desc-val">{issue.description}</span>
          </div>

          <div className="info-row">
            <div className="info-block">
              <span className="info-label">{t('issuedetails.reported_by')}</span>
              <span className="info-value">{issue.createdByName || `Staff ${issue.createdByUserId}`}</span>
            </div>

            <div className="info-block">
              <span className="info-label">{t('issuedetails.date_logged')}</span>
              <span className="info-value">{formatDate(issue.createdAt)}</span>
            </div>
          </div>

          <div className="info-block">
            <span className="info-label">{t('issuedetails.status')}</span>
            <div className="status-container">
              <span className={`status-badge-large ${issue.status?.toLowerCase() || t('issuedetails.reported')}`}>
                [STATUS: {issue.status?.toUpperCase() || t('issuedetails.reported')}]
              </span>
            </div>
          </div>
        </div>

        <div className="details-evidence-section">
          <span className="info-label">{t('issuedetails.repair_task_information')}</span>
          <div style={{ marginTop: '12px', padding: '16px', border: '1px solid #000000', backgroundColor: '#f9f9f9' }}>
            {issue.assignedTaskId ? (
              <div>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>{t('issuedetails.task_id')}</strong> {issue.assignedTaskId}
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>{t('issuedetails.status')}</strong>{' '}
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
                <p style={{ margin: '0', color: '#555', fontStyle: t('issuedetails.italic') }}>
                  {t('issuedetails.no_repair_task_assigned')}</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#777' }}>
                  {t('issuedetails.a_manager_will_assign')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  onError={(event) => { event.currentTarget.hidden = true; }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', border: '1px dashed #000000', textAlign: t('issuedetails.center'), color: '#555' }}>
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

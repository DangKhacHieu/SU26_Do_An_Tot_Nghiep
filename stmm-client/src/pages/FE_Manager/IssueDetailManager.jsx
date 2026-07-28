import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './IssueDetailManager.css';
import CreateTaskModal from './CreateTaskModal';

const STATUS_META = {
  Reported:   { label: 'Báo cáo mới',   cls: 'status-pending'   },
  InProgress: { label: 'Đang xử lý',    cls: 'status-quoted'    },
  Resolved:   { label: 'Đã giải quyết', cls: 'status-approved'  },
  Closed:     { label: 'Đã đóng',       cls: 'status-completed' },
};

/* ── Icons ── */
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconTool = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

export default function IssueDetailManager({ issueId, userId, baseUrl, navigate, addToast }) {
  const { t } = useTranslation();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    if (issueId) fetchIssueDetail();
  }, [issueId]);

  const fetchIssueDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/issues/${issueId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      setIssue(await res.json());
    } catch {
      addToast('Không thể tải chi tiết sự cố hạ tầng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return s; }
  };

  const handleCreateTaskSuccess = () => {
    setShowCreateTask(false);
    fetchIssueDetail();
  };

  if (loading) {
    return (
      <div className="id-loading">
        <div className="id-spinner" />
        <span>{t('issuedetailmanager.loading_incident_details')}</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="id-not-found">
        <h3>{t('issuedetailmanager.no_problem_found')}</h3>
        <p>{t('issuedetailmanager.the_issue_does_not')}</p>
        <button className="id-back-btn" onClick={() => navigate('issues')}>
          <IconArrowLeft /> {t('issuedetailmanager.back_to_the_list')}</button>
      </div>
    );
  }

  const sm = STATUS_META[issue.status] || { label: issue.status, cls: 'status-pending' };
  const imageUrls = issue.imageUrl ? issue.imageUrl.split(';').map(u => u.trim()).filter(Boolean) : [];

  return (
    <div className="id-container">
      {/* ── Header ── */}
      <div className="id-header-card">
        <div className="id-header-accent" />

        <div className="id-header-top">
          <button className="id-back-btn" onClick={() => navigate('issues')}>
            <IconArrowLeft /> {t('issuedetailmanager.incident_list')}</button>

          <div className="id-header-badges">
            <span className={`id-status-badge ${sm.cls}`}>{sm.label}</span>
          </div>
        </div>

        <div className="id-header-body">
          <div>
            <p className="id-req-id">ISSUE #{issue.issueId}</p>
            <h2 className="id-req-title">{issue.title}</h2>
          </div>

          <div className="id-header-meta">
            <div className="id-meta-item">
              <IconCalendar />
              <span>Báo cáo ngày: {formatDate(issue.createdAt)}</span>
            </div>
            <div className="id-meta-item">
              <IconMapPin />
              <span>{t('issuedetailmanager.location')}<strong>{issue.stallCode || t('issuedetailmanager.stall_id_issuestallid')}</strong></span>
            </div>
            <div className="id-meta-item">
              <IconUser />
              <span>Người báo cáo: {issue.createdByName || `Staff #${issue.createdByUserId}`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="id-grid">
        {/* Cột trái: Mô tả chi tiết */}
        <div className="id-main-card">
          <div className="id-section-title">
            <IconUser /> {t('issuedetailmanager.detailed_description_of_the')}</div>
          <div className="id-desc-body">
            <p>{issue.description || t('issuedetailmanager.there_is_no_detailed')}</p>
          </div>

          <div className="id-section-title" style={{ marginTop: '24px' }}>
            📍 Hình ảnh minh chứng ({imageUrls.length})
          </div>
          {imageUrls.length > 0 ? (
            <div className="id-images-grid">
              {imageUrls.map((url, i) => (
                <div key={i} className="id-image-wrapper">
                  <img
                    src={url}
                    alt={t('issuedetailmanager.proof_i_1')}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = t('issuedetailmanager.httpsplaceholdco400x300textimagecannotload');
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="id-no-images">
              {t('issuedetailmanager.there_are_no_images')}</div>
          )}
        </div>

        {/* Cột phải: Thông tin xử lý sự cố / Phân công task */}
        <div className="id-sidebar-card">
          <div className="id-section-title">
            <IconTool /> {t('issuedetailmanager.troubleshooting_status')}</div>

          {issue.assignedTaskId ? (
            <div className="id-task-assigned-box">
              <span className="id-task-badge-label">TÁC VỤ SỬA CHỮA ĐANG LIÊN KẾT:</span>
              <div className="id-task-info-block" onClick={() => navigate('task-details', issue.assignedTaskId)}>
                <span className="id-task-id-text">Task ID: #{issue.assignedTaskId}</span>
                <div className="id-task-status-row">
                  <span>{t('issuedetailmanager.task_status')}</span>
                  <span className={`status-badge ${issue.assignedTaskStatus?.toLowerCase() || 'pending'}`} style={{ display: 'inline-block' }}>
                    {issue.assignedTaskStatus || 'Pending'}
                  </span>
                </div>
                <div className="id-task-tip">
                  {t('issuedetailmanager.click_to_view_the')}</div>
              </div>
            </div>
          ) : (
            <div className="id-task-unassigned-box">
              <p>{t('issuedetailmanager.there_are_no_repair')}</p>
              
              {issue.status !== 'Closed' && (
                <button className="id-assign-btn" onClick={() => setShowCreateTask(true)}>
                  {t('issuedetailmanager.assign_repairs_immediately')}</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Task Overlay ── */}
      {showCreateTask && (
        <CreateTaskModal
          userId={userId}
          baseUrl={baseUrl}
          onClose={() => setShowCreateTask(false)}
          onSuccess={handleCreateTaskSuccess}
          addToast={addToast}
          preFilledIssueId={issue.issueId}
          preFilledTitle={`${t('issuedetailmanager.fix_issue')}: ${issue.title}`}
          preFilledDescription={`${t('issuedetailmanager.fix_infrastructure_problem_at_stall_id')}: ${issue.stallId}\n\n${t('issuedetailmanager.detailed_issue_description')}:\n${issue.description}`}
        />
      )}
    </div>
  );
}

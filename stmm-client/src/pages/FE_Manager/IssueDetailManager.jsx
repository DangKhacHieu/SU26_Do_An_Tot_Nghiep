import { useState, useEffect } from 'react';
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
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    if (issueId) fetchIssueDetail();
  }, [issueId]);

  const fetchIssueDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/issues/${issueId}`);
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
        <span>Đang tải thông tin chi tiết sự cố...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="id-not-found">
        <h3>Không tìm thấy sự cố</h3>
        <p>Sự cố không tồn tại hoặc đã bị xóa.</p>
        <button className="id-back-btn" onClick={() => navigate('issues')}>
          <IconArrowLeft /> Quay lại danh sách
        </button>
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
            <IconArrowLeft /> Danh sách sự cố
          </button>

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
              <span>Vị trí: <strong>{issue.stallCode || `Sạp ID: ${issue.stallId}`}</strong></span>
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
            <IconUser /> Chi tiết mô tả sự cố
          </div>
          <div className="id-desc-body">
            <p>{issue.description || 'Không có mô tả chi tiết cho sự cố này.'}</p>
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
                    alt={`Minh chứng ${i + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x300?text=Hình+ảnh+không+tải+được';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="id-no-images">
              Không có hình ảnh đính kèm.
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin xử lý sự cố / Phân công task */}
        <div className="id-sidebar-card">
          <div className="id-section-title">
            <IconTool /> Trạng thái xử lý sự cố
          </div>

          {issue.assignedTaskId ? (
            <div className="id-task-assigned-box">
              <span className="id-task-badge-label">TÁC VỤ SỬA CHỮA ĐANG LIÊN KẾT:</span>
              <div className="id-task-info-block" onClick={() => navigate('task-details', issue.assignedTaskId)}>
                <span className="id-task-id-text">Task ID: #{issue.assignedTaskId}</span>
                <div className="id-task-status-row">
                  <span>Trạng thái tác vụ:</span>
                  <span className={`status-badge ${issue.assignedTaskStatus?.toLowerCase() || 'pending'}`} style={{ display: 'inline-block' }}>
                    {issue.assignedTaskStatus || 'Pending'}
                  </span>
                </div>
                <div className="id-task-tip">
                  * Click để xem tiến trình xử lý tác vụ sửa chữa này.
                </div>
              </div>
            </div>
          ) : (
            <div className="id-task-unassigned-box">
              <p>Chưa có tác vụ sửa chữa nào được phân công cho sự cố này.</p>
              
              {issue.status !== 'Closed' && (
                <button className="id-assign-btn" onClick={() => setShowCreateTask(true)}>
                  Phân công sửa chữa ngay
                </button>
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
          preFilledTitle={`Sửa chữa: ${issue.title}`}
          preFilledDescription={`Sửa chữa sự cố hạ tầng tại vị trí sạp ${issue.stallCode || `ID: ${issue.stallId}`}.\n\nMô tả chi tiết sự cố:\n${issue.description}`}
        />
      )}
    </div>
  );
}

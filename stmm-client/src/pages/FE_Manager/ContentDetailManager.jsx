import { useState, useEffect } from 'react';
import './ContentDetailManager.css';

const API_BASE = "http://localhost:5056/api/manager/contents";

const TARGET_ROLE_LABELS = {
  Public: 'Trang chủ (Guest & Customer)',
  Staff: 'Nhân viên (Staff)',
  Accountant: 'Kế toán (Accountant)',
  Vendor: 'Tiểu thương (Vendor)',
  Customer: 'Khách hàng thành viên (Customer)',
};

const TARGET_ROLE_COLORS = {
  Public: '#0ea5e9',
  Staff: '#2563eb',
  Accountant: '#7c3aed',
  Vendor: '#0f766e',
  Customer: '#d97706',
};

export default function ContentDetailManager({ contentId, navigate, addToast }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contentId) {
      loadContent();
    } else {
      addToast('Không tìm thấy mã bài viết.', 'error');
      navigate('content');
    }
  }, [contentId]);

  const loadContent = async () => {
    try {
      const res = await fetch(`${API_BASE}/${contentId}`);
      if (res.ok) {
        setContent(await res.json());
      } else {
        addToast('Không thể tải chi tiết bài viết.', 'error');
        navigate('content');
      }
    } catch {
      addToast('Lỗi kết nối khi tải bài viết.', 'error');
      navigate('content');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="state-empty" style={{ minHeight: '300px' }}>
        <div className="spinner" />
        <span>Đang tải thông tin chi tiết...</span>
      </div>
    );
  }

  if (!content) return null;

  const roleColor = TARGET_ROLE_COLORS[content.targetRole] || '#64748b';
  const notiTypeLower = content.notiType?.toLowerCase() || 'other';

  return (
    <div className="content-detail-container">
      <div className="detail-card">
        {/* Back Button and Edit */}
        <div className="detail-header-actions">
          <button className="btn-secondary" onClick={() => navigate('content')}>
            &larr; Quay lại danh sách
          </button>
          <button className="btn-primary" onClick={() => navigate('content-form', content.notiId)}>
            Chỉnh sửa nội dung
          </button>
        </div>

        {/* Metadata Header */}
        <div className="detail-meta-header">
          <div className="meta-badges">
            <span className={`badge-content-type ${notiTypeLower}`}>
              {content.notiType || 'Notification'}
            </span>
            <span className="badge-role-target" style={{ borderColor: roleColor, color: roleColor, backgroundColor: `${roleColor}0a` }}>
              {content.targetUserName 
                ? `Đến cá nhân: ${content.targetUserName} (${TARGET_ROLE_LABELS[content.targetRole] || content.targetRole})`
                : `Đến: ${TARGET_ROLE_LABELS[content.targetRole] || content.targetRole || 'Mọi đối tượng'}`}
            </span>
          </div>
          <h1>{content.title}</h1>
          <div className="meta-author-time">
            <span>Được đăng lúc: <strong>{formatDate(content.createdAt)}</strong></span>
            <span className="bullet-dot" />
            <span>Mã bản ghi: {content.notiId}</span>
          </div>
        </div>

        {/* Detailed Body */}
        <div className="detail-body">
          {content.content ? (
            content.content.split('\n').map((para, i) => (
              <p key={i} className="detail-paragraph">{para}</p>
            ))
          ) : (
            <p className="detail-paragraph text-secondary italic">Bài viết này không có nội dung.</p>
          )}
        </div>
      </div>
    </div>
  );
}

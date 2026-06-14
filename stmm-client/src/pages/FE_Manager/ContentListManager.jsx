import { useState, useEffect } from 'react';
import './ContentListManager.css';

const API_BASE = "http://localhost:5056/api/manager/contents";

const TARGET_ROLE_LABELS = {
  Public: 'Trang chủ (Guest & Customer)',
  Staff: 'Staff (Nhân viên)',
  Accountant: 'Accountant (Kế toán)',
  Vendor: 'Vendor (Tiểu thương)',
  Customer: 'Customer (Khách hàng)',
};

const TARGET_ROLE_COLORS = {
  Public: '#0ea5e9',
  Staff: '#2563eb',
  Accountant: '#7c3aed',
  Vendor: '#0f766e',
  Customer: '#d97706',
};

/* ── Icons ── */
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEye     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const IconWarn    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export default function ContentListManager({ navigate, addToast }) {
  const [contents, setContents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetContent, setTargetContent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchContents();
  }, [typeFilter, roleFilter]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?`;
      if (typeFilter) url += `type=${encodeURIComponent(typeFilter)}&`;
      if (roleFilter) url += `targetRole=${encodeURIComponent(roleFilter)}&`;
      
      const res = await fetch(url);
      if (res.ok) {
        setContents(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast('Không thể tải danh sách tin tức & thông báo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!targetContent || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetContent.notiId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Xóa bài viết/thông báo thành công!', 'success');
        setDeleteModalOpen(false);
        setTargetContent(null);
        fetchContents();
      } else {
        addToast('Lỗi máy chủ khi xóa bài viết.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (content) => {
    setTargetContent(content);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTargetContent(null);
  };

  const filteredContents = contents.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query);
  });

  const hasFilters = searchQuery || typeFilter || roleFilter;

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setRoleFilter('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="content-list-container">
      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo tiêu đề, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title="Xóa">
                <IconXCircle />
              </button>
            )}
          </div>

          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tất cả phân loại</option>
            <option value="Article">Homepage Article</option>
            <option value="Announcement">Role Announcement</option>
            <option value="System">System Notification</option>
            <option value="Invoice">Invoice Alert</option>
            <option value="Violation">Violation Notice</option>
            <option value="Request">Request Update</option>
          </select>

          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tất cả đối tượng nhận</option>
            <option value="Public">Public (Trang chủ)</option>
            <option value="Staff">Staff (Nhân viên)</option>
            <option value="Accountant">Accountant (Kế toán)</option>
            <option value="Vendor">Vendor (Tiểu thương)</option>
            <option value="Customer">Customer (Khách hàng)</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={() => navigate('content-form')}>
          <IconPlus /> Đăng tin & Thông báo
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">Danh sách bài viết & thông báo đã tạo</span>
          {!loading && (
            <span className="table-count-badge">{filteredContents.length} kết quả</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">Đang tải dữ liệu...</span>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? 'Không tìm thấy bài viết nào phù hợp bộ lọc.' : 'Chưa có bài viết hay thông báo nào được tạo.'}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  <th>Tiêu đề</th>
                  <th>Phân loại</th>
                  <th>Đối tượng nhận</th>
                  <th>Ngày tạo</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredContents.map((item, idx) => {
                  const roleColor = TARGET_ROLE_COLORS[item.targetRole] || '#64748b';
                  const notiTypeLower = item.notiType?.toLowerCase() || 'other';
                  return (
                    <tr key={item.notiId}>
                      <td className="row-no">{idx + 1}</td>
                      <td>
                        <div className="content-title-cell">
                          <span className="content-title-text" onClick={() => navigate('content-detail', item.notiId)}>
                            {item.title}
                          </span>
                          <span className="content-preview-snippet">
                            {item.content.length > 80 ? `${item.content.slice(0, 80)}...` : item.content}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-content-type ${notiTypeLower}`}>
                          {item.notiType || 'Notification'}
                        </span>
                      </td>
                      <td>
                        {item.targetUserName ? (
                          <div className="target-user-cell">
                            <span className="badge-role-target" style={{ borderColor: roleColor, color: roleColor, backgroundColor: `${roleColor}0a` }}>
                              Cá nhân: {item.targetUserName}
                            </span>
                            <span className="target-role-subtext">Vai trò: {TARGET_ROLE_LABELS[item.targetRole] || item.targetRole}</span>
                          </div>
                        ) : (
                          <span className="badge-role-target" style={{ borderColor: roleColor, color: roleColor, backgroundColor: `${roleColor}0a` }}>
                            {TARGET_ROLE_LABELS[item.targetRole] || item.targetRole || 'Mọi đối tượng'}
                          </span>
                        )}
                      </td>
                      <td><span className="mono">{formatDate(item.createdAt)}</span></td>
                      <td>
                        <div className="actions-cell" style={{ justifyContent: 'center' }}>
                          <button className="btn-icon view" title="Xem chi tiết" onClick={() => navigate('content-detail', item.notiId)}><IconEye /></button>
                          <button className="btn-icon edit" title="Chỉnh sửa" onClick={() => navigate('content-form', item.notiId)}><IconEdit /></button>
                          <button className="btn-icon delete" title="Xóa bài viết" onClick={() => openDeleteModal(item)}><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Delete ── */}
      {deleteModalOpen && targetContent && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Xóa bài viết / thông báo</h3>
              <button className="modal-close" onClick={closeDeleteModal}>×</button>
            </div>
            <div className="modal-body text-center">
              <div className="modal-icon-wrap danger"><IconWarn /></div>
              <p className="modal-desc" style={{ marginTop: 16 }}>
                Bạn có chắc chắn muốn xóa bài viết <strong>"{targetContent.title}"</strong> không?
              </p>
              <p className="text-secondary" style={{ fontSize: '13px', marginTop: 8 }}>
                Hành động này không thể hoàn tác. Bài viết hoặc thông báo này sẽ biến mất khỏi bảng tin.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={closeDeleteModal} disabled={actionLoading}>Hủy</button>
              <button className="btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

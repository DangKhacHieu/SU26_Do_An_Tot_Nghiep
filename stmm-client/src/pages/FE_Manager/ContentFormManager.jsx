import { useState, useEffect } from 'react';
import './ContentFormManager.css';

const API_BASE = "http://localhost:5056/api/manager/contents";

export default function ContentFormManager({ contentId, navigate, addToast }) {
  const isEdit = !!contentId;
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [notiType, setNotiType] = useState('Article'); // 'Article' or 'Announcement'
  const [targetRole, setTargetRole] = useState('Public');
  const [content, setContent] = useState('');

  // User distribution states
  const [sendType, setSendType] = useState('all'); // 'all' or 'specific'
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]); // Create mode (multiple recipients)
  const [selectedUserId, setSelectedUserId] = useState(null); // Edit mode (single recipient)
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Preview tab state
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'

  useEffect(() => {
    if (isEdit) {
      loadContent();
    }
  }, [contentId]);

  const fetchUsersByRole = async (role) => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`http://localhost:5056/api/manager/users?roleName=${role}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        addToast('Không thể tải danh sách người dùng cho vai trò này.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối khi tải danh sách người dùng.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleNotiTypeChange = (type) => {
    setNotiType(type);
    setSendType('all');
    setSelectedUserIds([]);
    setSelectedUserId(null);
    setUserSearchQuery('');
    if (type === 'Article') {
      setTargetRole('Public');
    } else {
      setTargetRole('Staff');
    }
  };

  const handleTargetRoleChange = (role) => {
    setTargetRole(role);
    setSelectedUserIds([]);
    setSelectedUserId(null);
    setUserSearchQuery('');
    if (sendType === 'specific') {
      fetchUsersByRole(role);
    }
  };

  const handleSendTypeChange = (type) => {
    setSendType(type);
    setSelectedUserIds([]);
    setSelectedUserId(null);
    setUserSearchQuery('');
    if (type === 'specific') {
      fetchUsersByRole(targetRole);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    setSelectedUserIds(users.map(u => u.userId));
  };

  const handleClearAllUsers = () => {
    setSelectedUserIds([]);
  };

  const filteredUsers = users.filter(u => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return (u.name?.toLowerCase().includes(query) || false) || (u.email?.toLowerCase().includes(query) || false);
  });

  const loadContent = async () => {
    try {
      const res = await fetch(`${API_BASE}/${contentId}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setNotiType(data.notiType);
        setTargetRole(data.targetRole || 'Public');
        setContent(data.content);
        if (data.targetUserId) {
          setSendType('specific');
          setSelectedUserId(data.targetUserId);
          await fetchUsersByRole(data.targetRole || 'Public');
        } else {
          setSendType('all');
        }
      } else {
        addToast('Không thể tải thông tin bài viết.', 'error');
        navigate('content');
      }
    } catch {
      addToast('Lỗi kết nối khi tải bài viết.', 'error');
      navigate('content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast('Tiêu đề không được để trống.', 'error');
      return;
    }
    if (!content.trim()) {
      addToast('Nội dung không được để trống.', 'error');
      return;
    }

    if (notiType === 'Announcement' && sendType === 'specific') {
      if (isEdit) {
        if (!selectedUserId) {
          addToast('Vui lòng chọn một người nhận.', 'error');
          return;
        }
      } else {
        if (selectedUserIds.length === 0) {
          addToast('Vui lòng chọn ít nhất một người nhận.', 'error');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `${API_BASE}/${contentId}` : API_BASE;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        title: title.trim(),
        content: content.trim(),
        notiType,
        targetRole,
      };

      if (notiType === 'Announcement') {
        if (sendType === 'specific') {
          if (isEdit) {
            payload.targetUserId = selectedUserId;
          } else {
            payload.targetUserIds = selectedUserIds;
          }
        } else {
          payload.targetUserId = null;
          payload.targetUserIds = null;
        }
      } else {
        payload.targetRole = 'Public';
        payload.targetUserId = null;
        payload.targetUserIds = null;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(isEdit ? 'Cập nhật tin tức thành công!' : 'Tạo tin tức & thông báo thành công!', 'success');
        navigate('content');
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || 'Lỗi khi gửi dữ liệu lên máy chủ.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối. Vui lòng kiểm tra lại mạng.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-empty" style={{ minHeight: '300px' }}>
        <div className="spinner" />
        <span>Đang tải thông tin...</span>
      </div>
    );
  }

  return (
    <div className="content-form-container">
      <div className="form-card">
        <div className="form-card-header">
          <h2>{isEdit ? 'Chỉnh sửa bài viết / thông báo' : 'Tạo mới bài viết hoặc thông báo'}</h2>
          <p className="card-subtitle">
            {isEdit ? 'Cập nhật thông tin chi tiết và lưu lại thay đổi.' : 'Bài viết mới sẽ được hiển thị ngay sau khi tạo.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="media-form">
          <div className="form-grid">
            {/* Title */}
            <div className="form-group full-width">
              <label className="form-label required">Tiêu đề bài viết / thông báo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tiêu đề ngắn gọn, súc tích..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            {/* Content Type */}
            <div className="form-group">
              <label className="form-label required">Loại nội dung</label>
              <div className="radio-group">
                <label className={`radio-label ${notiType === 'Article' ? 'checked' : ''}`}>
                  <input
                    type="radio"
                    name="notiType"
                    value="Article"
                    checked={notiType === 'Article'}
                    onChange={() => handleNotiTypeChange('Article')}
                  />
                  <span>Bài viết Trang chủ</span>
                </label>
                <label className={`radio-label ${notiType === 'Announcement' ? 'checked' : ''}`}>
                  <input
                    type="radio"
                    name="notiType"
                    value="Announcement"
                    checked={notiType === 'Announcement'}
                    onChange={() => handleNotiTypeChange('Announcement')}
                  />
                  <span>Thông báo theo Role</span>
                </label>
              </div>
            </div>

            {/* Target Role Selector */}
            <div className="form-group">
              <label className="form-label required">Đối tượng phân phối</label>
              {notiType === 'Article' ? (
                <select className="form-control" value="Public" disabled>
                  <option value="Public">Công khai (Khách vãng lai & Khách hàng)</option>
                </select>
              ) : (
                <select
                  className="form-control"
                  value={targetRole}
                  onChange={(e) => handleTargetRoleChange(e.target.value)}
                  required
                >
                  <option value="Staff">Staff (Nhân viên quản lý sạp)</option>
                  <option value="Accountant">Accountant (Nhân viên kế toán)</option>
                  <option value="Vendor">Vendor (Tiểu thương)</option>
                  <option value="Customer">Customer (Khách hàng thành viên)</option>
                </select>
              )}
            </div>

            {/* Specific Recipient Selection */}
            {notiType === 'Announcement' && (
              <div className="user-selection-section form-group full-width">
                <label className="form-label required">Hình thức gửi thông báo</label>
                <div className="send-type-options">
                  <label className={`radio-label ${sendType === 'all' ? 'checked' : ''}`}>
                    <input
                      type="radio"
                      name="sendType"
                      value="all"
                      checked={sendType === 'all'}
                      onChange={() => handleSendTypeChange('all')}
                    />
                    <span>Gửi cho toàn bộ vai trò {targetRole}</span>
                  </label>
                  <label className={`radio-label ${sendType === 'specific' ? 'checked' : ''}`}>
                    <input
                      type="radio"
                      name="sendType"
                      value="specific"
                      checked={sendType === 'specific'}
                      onChange={() => handleSendTypeChange('specific')}
                    />
                    <span>Chọn người nhận cụ thể</span>
                  </label>
                </div>

                {sendType === 'specific' && (
                  <div className="user-checklist-wrapper" style={{ marginTop: 12 }}>
                    {loadingUsers ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                        <div className="spinner" style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Đang tải danh sách người dùng...</span>
                      </div>
                    ) : users.length === 0 ? (
                      <div style={{ padding: '12px 0', fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>
                        Không tìm thấy người dùng nào thuộc vai trò này.
                      </div>
                    ) : isEdit ? (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label required" style={{ fontSize: '0.8rem' }}>Chọn người nhận</label>
                        <select
                          className="form-control"
                          value={selectedUserId || ''}
                          onChange={(e) => setSelectedUserId(Number(e.target.value))}
                          required
                        >
                          <option value="">-- Chọn một người nhận --</option>
                          {users.map(u => (
                            <option key={u.userId} value={u.userId}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="user-checklist-actions">
                          <span>Đã chọn: <strong>{selectedUserIds.length}</strong> / {users.length} người nhận</span>
                          <div>
                            <button type="button" className="user-checklist-btn-link" onClick={handleSelectAllUsers}>
                              Chọn tất cả
                            </button>
                            <button type="button" className="user-checklist-btn-link" onClick={handleClearAllUsers}>
                              Bỏ chọn tất cả
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          className="form-control user-search-input"
                          placeholder="Tìm nhanh theo tên hoặc email..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          style={{ marginBottom: 10 }}
                        />
                        <div className="user-checklist-container">
                          {filteredUsers.length === 0 ? (
                            <div style={{ padding: 16, textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Không tìm thấy người dùng phù hợp.
                            </div>
                          ) : (
                            filteredUsers.map(u => {
                              const isChecked = selectedUserIds.includes(u.userId);
                              return (
                                <label key={u.userId} className="user-checklist-item">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleUser(u.userId)}
                                  />
                                  <div className="user-info-text">
                                    <span className="user-name">{u.name}</span>
                                    <span className="user-email">{u.email}</span>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Main Content Body */}
            <div className="form-group full-width">
              <div className="content-textarea-header">
                <label className="form-label required">Nội dung chi tiết</label>
                <div className="tab-buttons">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('edit')}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    Xem trước kết quả
                  </button>
                </div>
              </div>

              {activeTab === 'edit' ? (
                <textarea
                  className="form-control content-textarea"
                  placeholder="Nhập nội dung thông báo hoặc bài viết tại đây. Hỗ trợ hiển thị ngắt dòng..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              ) : (
                <div className="content-preview-box">
                  {content.trim() ? (
                    content.split('\n').map((para, i) => (
                      <p key={i} style={{ marginBottom: 12 }}>{para}</p>
                    ))
                  ) : (
                    <span className="text-secondary italic">Nội dung xem trước sẽ hiển thị ở đây...</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('content')}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : isEdit ? 'Cập nhật bài viết' : 'Đăng bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

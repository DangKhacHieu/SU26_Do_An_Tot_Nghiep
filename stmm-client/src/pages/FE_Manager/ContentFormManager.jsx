import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './ContentFormManager.css';

const API_BASE = "http://localhost:5056/api/manager/contents";

export default function ContentFormManager({ contentId, navigate, addToast }) {
  const { t } = useTranslation();

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
      const res = await fetch(`http://localhost:5056/api/manager/users?roleName=${role}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        addToast(t('contentformmanager.unable_to_load_user'), 'error');
      }
    } catch {
      addToast(t('contentformmanager.connection_error_when_loading'), 'error');
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
      const res = await fetch(`${API_BASE}/${contentId}`, { headers: getAuthHeaders() });
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
        addToast(t('contentformmanager.unable_to_load_article'), 'error');
        navigate('content');
      }
    } catch {
      addToast(t('contentformmanager.connection_error_when_downloading'), 'error');
      navigate('content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast(t('contentformmanager.the_title_cannot_be'), 'error');
      return;
    }
    if (!content.trim()) {
      addToast(t('contentformmanager.content_cannot_be_empty'), 'error');
      return;
    }

    if (notiType === 'Announcement' && sendType === 'specific') {
      if (isEdit) {
        if (!selectedUserId) {
          addToast(t('contentformmanager.please_select_a_recipient'), 'error');
          return;
        }
      } else {
        if (selectedUserIds.length === 0) {
          addToast(t('contentformmanager.please_select_at_least'), 'error');
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
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(isEdit ? t('contentformmanager.successfully_updated_news') : t('contentformmanager.create_news_announcements_successfully'), 'success');
        navigate('content');
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || t('contentformmanager.error_sending_data_to'), 'error');
      }
    } catch {
      addToast(t('contentformmanager.connection_error_please_check'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-empty" style={{ minHeight: '300px' }}>
        <div className="spinner" />
        <span>{t('contentformmanager.loading_information')}</span>
      </div>
    );
  }

  return (
    <div className="content-form-container">
      <div className="form-card">
        <div className="form-card-header">
          <h2>{isEdit ? t('contentformmanager.edit_postsannouncements') : t('contentformmanager.create_a_new_post')}</h2>
          <p className="card-subtitle">
            {isEdit ? t('contentformmanager.update_details_and_save') : t('contentformmanager.new_posts_will_be')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="media-form">
          <div className="form-grid">
            {/* Title */}
            <div className="form-group full-width">
              <label className="form-label required">{t('contentformmanager.postannouncement_title')}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('contentformmanager.enter_a_short_concise')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            {/* Content Type */}
            <div className="form-group">
              <label className="form-label required">{t('contentformmanager.content_type')}</label>
              <div className="radio-group">
                <label className={`radio-label ${notiType === 'Article' ? 'checked' : ''}`}>
                  <input
                    type="radio"
                    name="notiType"
                    value="Article"
                    checked={notiType === 'Article'}
                    onChange={() => handleNotiTypeChange('Article')}
                  />
                  <span>{t('contentformmanager.articles_home_page')}</span>
                </label>
                <label className={`radio-label ${notiType === 'Announcement' ? 'checked' : ''}`}>
                  <input
                    type="radio"
                    name="notiType"
                    value="Announcement"
                    checked={notiType === 'Announcement'}
                    onChange={() => handleNotiTypeChange('Announcement')}
                  />
                  <span>{t('contentformmanager.notification_by_role')}</span>
                </label>
              </div>
            </div>

            {/* Target Role Selector */}
            <div className="form-group">
              <label className="form-label required">{t('contentformmanager.distribution_object')}</label>
              {notiType === 'Article' ? (
                <select className="form-control" value="Public" disabled>
                  <option value="Public">{t('contentformmanager.public_visitors_customers')}</option>
                </select>
              ) : (
                <select
                  className="form-control"
                  value={targetRole}
                  onChange={(e) => handleTargetRoleChange(e.target.value)}
                  required
                >
                  <option value="Staff">{t('contentformmanager.staff_stall_manager')}</option>
                  <option value="Accountant">{t('contentformmanager.accountant_accountant')}</option>
                  <option value="Vendor">{t('contentformmanager.vendor_small_business')}</option>
                  <option value="Customer">{t('contentformmanager.customer_member_customer')}</option>
                </select>
              )}
            </div>

            {/* Specific Recipient Selection */}
            {notiType === 'Announcement' && (
              <div className="user-selection-section form-group full-width">
                <label className="form-label required">{t('contentformmanager.form_of_notification')}</label>
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
                    <span>{t('contentformmanager.select_specific_recipients')}</span>
                  </label>
                </div>

                {sendType === 'specific' && (
                  <div className="user-checklist-wrapper" style={{ marginTop: 12 }}>
                    {loadingUsers ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                        <div className="spinner" style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{t('contentformmanager.loading_user_list')}</span>
                      </div>
                    ) : users.length === 0 ? (
                      <div style={{ padding: '12px 0', fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>
                        {t('contentformmanager.no_users_found_for')}</div>
                    ) : isEdit ? (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label required" style={{ fontSize: '0.8rem' }}>{t('contentformmanager.select_recipient')}</label>
                        <select
                          className="form-control"
                          value={selectedUserId || ''}
                          onChange={(e) => setSelectedUserId(Number(e.target.value))}
                          required
                        >
                          <option value="">{t('contentformmanager.select_a_recipient')}</option>
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
                          <span>{t('contentformmanager.selected')}<strong>{selectedUserIds.length}</strong> / {users.length} người nhận</span>
                          <div>
                            <button type="button" className="user-checklist-btn-link" onClick={handleSelectAllUsers}>
                              {t('contentformmanager.select_all')}</button>
                            <button type="button" className="user-checklist-btn-link" onClick={handleClearAllUsers}>
                              {t('contentformmanager.deselect_all')}</button>
                          </div>
                        </div>
                        <input
                          type="text"
                          className="form-control user-search-input"
                          placeholder={t('contentformmanager.quick_search_by_name')}
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          style={{ marginBottom: 10 }}
                        />
                        <div className="user-checklist-container">
                          {filteredUsers.length === 0 ? (
                            <div style={{ padding: 16, textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              {t('contentformmanager.no_matching_users_were')}</div>
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
                <label className="form-label required">{t('contentformmanager.detailed_content')}</label>
                <div className="tab-buttons">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('edit')}
                  >
                    {t('contentformmanager.edit')}</button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    {t('contentformmanager.preview_results')}</button>
                </div>
              </div>

              {activeTab === 'edit' ? (
                <textarea
                  className="form-control content-textarea"
                  placeholder={t('contentformmanager.enter_announcement_or_post')}
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
                    <span className="text-secondary italic">{t('contentformmanager.preview_content_will_appear')}</span>
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
              {t('contentformmanager.cancel')}</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? t('contentformmanager.sending') : isEdit ? t('contentformmanager.update_article') : t('contentformmanager.post_articles')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

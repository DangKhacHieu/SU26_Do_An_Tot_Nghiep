import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import './UserListManager.css';

const API_BASE = "http://localhost:5056/api/manager/users";

const ROLE_COLORS = {
  staff:      '#2563eb',
  accountant: '#7c3aed',
  vendor:     '#0f766e',
  customer:   '#d97706',
  manager:    '#dc2626',
};

/* ── Icons ── */
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEye     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconLock    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconUnlock  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconWarn    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconDanger  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export default function UserListManager({ navigate, addToast }) {
  const { t } = useTranslation();

  const [users, setUsers]             = useState([]);
  const [roles, setRoles]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalType, setModalType]     = useState(null);
  const [targetUser, setTargetUser]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm-typing state for delete modal
  const [confirmName, setConfirmName] = useState('');
  const deleteConfirmed = confirmName.trim() === targetUser?.name?.trim();

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchUsers(); }, [searchQuery, roleFilter, statusFilter]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/roles`);
      if (res.ok) setRoles(await res.json());
    } catch { /* silent */ }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?`;
      if (roleFilter)   url += `roleName=${encodeURIComponent(roleFilter)}&`;
      if (searchQuery)  url += `search=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url);
      if (res.ok) {
        let data = await res.json();
        if (statusFilter) data = data.filter(u => u.status === statusFilter);
        setUsers(data);
      } else throw new Error();
    } catch { addToast(t('userlistmanager.unable_to_load_accounts'), 'error'); }
    finally { setLoading(false); }
  };

  /* ── Lock / Unlock ── */
  const handleLockUnlock = async () => {
    if (!targetUser || actionLoading) return;

    // Business rule: cannot lock a Manager account
    if (targetUser.roleName?.toLowerCase() === 'manager' && targetUser.status !== 'Locked') {
      addToast(t('userlistmanager.unable_to_lock_manager'), 'error');
      return;
    }

    const newStatus = targetUser.status === 'Locked' ? 'Active' : 'Locked';
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetUser.userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        addToast(t('userlistmanager.action_account_success', { action: newStatus === 'Active' ? t('userlistmanager.unlock') : t('userlistmanager.lock') }), 'success');
        closeModal();
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || t('userlistmanager.error_updating_status'), 'error');
      }
    } catch { addToast(t('businesscategorylistmanager.connection_error_please_try'), 'error'); }
    finally { setActionLoading(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!targetUser || actionLoading || !deleteConfirmed) return;

    // Business rule: cannot delete an Admin account
    if (targetUser.roleName?.toLowerCase() === 'admin') {
      addToast(t('userlistmanager.cannot_delete_the_system'), 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetUser.userId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast(t('userlistmanager.account_deleted_successfully'), 'success');
        closeModal();
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || t('userlistmanager.server_error_when_deleting'), 'error');
      }
    } catch { addToast(t('businesscategorylistmanager.connection_error_please_try'), 'error'); }
    finally { setActionLoading(false); }
  };

  const openModal = (type, user) => {
    setTargetUser(user);
    setModalType(type);
    setConfirmName('');
  };
  const closeModal = () => {
    setModalType(null);
    setTargetUser(null);
    setConfirmName('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const hasFilters = searchQuery || roleFilter || statusFilter;

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder={t('userlistmanager.search_for_name_email')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title={t('userlistmanager.erase')}>
                <IconXCircle />
              </button>
            )}
          </div>

          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">{t('userlistmanager.all_roles')}</option>
            {roles.map(r => <option key={r.roleId} value={r.name}>{r.name}</option>)}
          </select>

          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('userlistmanager.all_status')}</option>
            <option value="Active">Active</option>
            <option value="Locked">Locked</option>
            <option value="Suspended">Suspended</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={clearFilters}>
              {t('userlistmanager.clear_filter')}</button>
          )}
        </div>

        <button className="btn-primary" onClick={() => navigate('form')}>
          <IconPlus /> {t('userlistmanager.register_an_account')}</button>
      </div>

      {/* ── Table card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">{t('userlistmanager.list_of_accounts')}</span>
          {!loading && (
            <span className="table-count-badge">{users.length} kết quả</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">{t('userlistmanager.loading_data')}</span>
          </div>
        ) : users.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? t('userlistmanager.no_results_were_found') : t('userlistmanager.there_are_no_accounts')}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 4 }} onClick={clearFilters}>
                {t('userlistmanager.clear_filter')}</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  <th>{t('userlistmanager.member')}</th>
                  <th>CCCD</th>
                  <th>{t('userlistmanager.role')}</th>
                  <th>{t('userlistmanager.status')}</th>
                  <th style={{ textAlign: 'center' }}>{t('userlistmanager.act')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const roleKey  = user.roleName?.toLowerCase();
                  const avatarBg = ROLE_COLORS[roleKey] || '#64748b';
                  return (
                    <tr key={user.userId}>
                      <td className="row-no">{idx + 1}</td>
                      <td>
                        <div className="user-identity">
                          <div className="user-avatar-cell" style={{ background: avatarBg }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="name-col">
                            <span className="name-primary">{user.name}</span>
                            <span className="name-secondary">{user.email} · {user.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="mono">{user.cccd || '—'}</span></td>
                      <td>
                        <span className={`badge-role ${roleKey}`}>{user.roleName}</span>
                      </td>
                      <td>
                        <span className={`badge-status ${user.status?.toLowerCase()}`}>
                          <span className="badge-dot" />
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell" style={{ justifyContent: 'center' }}>
                          <button className="btn-icon view"   title={t('userlistmanager.see_details')}   onClick={() => navigate('detail', user.userId)}><IconEye /></button>
                          <button className="btn-icon edit"   title={t('userlistmanager.edit')}       onClick={() => navigate('form',   user.userId)}><IconEdit /></button>
                          <button
                            className={`btn-icon ${user.status === 'Locked' ? 'unlock' : 'lock'}`}
                            title={user.status === 'Locked' ? t('userlistmanager.unlock_account') : t('userlistmanager.lock_account')}
                            onClick={() => openModal('lock', user)}
                          >
                            {user.status === 'Locked' ? <IconUnlock /> : <IconLock />}
                          </button>
                          <button className="btn-icon delete" title={t('userlistmanager.delete_account')}   onClick={() => openModal('delete', user)}><IconTrash /></button>
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

      {/* ── Modal: Lock / Unlock ── */}
      {modalType === 'lock' && targetUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{targetUser.status === 'Locked' ? t('userlistmanager.unlock_account') : t('userlistmanager.lock_account')}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className={`modal-icon-wrap ${targetUser.status === 'Locked' ? 'success' : 'warn'}`}>
                {targetUser.status === 'Locked' ? <IconUnlock /> : <IconWarn />}
              </div>

              {/* User info card inside modal */}
              <div className="modal-user-card">
                <div
                  className="modal-user-avatar"
                  style={{ background: ROLE_COLORS[targetUser.roleName?.toLowerCase()] || '#64748b' }}
                >
                  {targetUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="modal-user-name">{targetUser.name}</p>
                  <p className="modal-user-meta">{targetUser.email} · {targetUser.roleName}</p>
                </div>
              </div>

              <p className="modal-desc">
                {targetUser.status === 'Locked'
                  ? <>{t('userlistmanager.account_will_be')}<strong>{t('userlistmanager.unlock')}</strong> {t('userlistmanager.and_can_log_back')}</>
                  : <>{t('userlistmanager.account_will_be')}<strong>{t('userlistmanager.lock')}</strong>{t('userlistmanager.users_will_not_be')}</>
                }
              </p>

              {/* Business rule warning */}
              {targetUser.roleName?.toLowerCase() === 'manager' && targetUser.status !== 'Locked' && (
                <div className="modal-rule-warn">
                  <IconWarn />
                  {t('userlistmanager.accounts_with_the_manager')}</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={closeModal} disabled={actionLoading}>{t('userlistmanager.cancel')}</button>
              <button
                className={targetUser.status === 'Locked' ? 'btn-success' : 'btn-warn'}
                onClick={handleLockUnlock}
                disabled={actionLoading || (targetUser.roleName?.toLowerCase() === 'manager' && targetUser.status !== 'Locked')}
              >
                {actionLoading ? t('userlistmanager.processing') : targetUser.status === 'Locked' ? t('userlistmanager.confirm_unlock') : t('userlistmanager.confirm_key')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete ── */}
      {modalType === 'delete' && targetUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t('userlistmanager.delete_account')}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-icon-wrap danger"><IconDanger /></div>

              {/* User info card inside modal */}
              <div className="modal-user-card">
                <div
                  className="modal-user-avatar"
                  style={{ background: ROLE_COLORS[targetUser.roleName?.toLowerCase()] || '#64748b' }}
                >
                  {targetUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="modal-user-name">{targetUser.name}</p>
                  <p className="modal-user-meta">{targetUser.email} · {targetUser.roleName}</p>
                </div>
              </div>

              <p className="modal-desc">
                {t('userlistmanager.account_will_be')}<strong>{t('userlistmanager.soft_delete')}</strong> {t('userlistmanager.out_of_the_system')}</p>

              {/* Admin account protection */}
              {targetUser.roleName?.toLowerCase() === 'admin' ? (
                <div className="modal-rule-warn danger">
                  <IconDanger />
                  {t('userlistmanager.cannot_delete_the_system')}</div>
              ) : (
                /* Type-to-confirm */
                <div className="modal-confirm-input">
                  <label>
                    {t('userlistmanager.enter_a_name')}<strong>{targetUser.name}</strong> {t('userlistmanager.to_confirm_deletion')}</label>
                  <input
                    type="text"
                    className={`form-control ${confirmName && (deleteConfirmed ? 'is-ok' : 'is-error')}`}
                    placeholder={t('userlistmanager.enter_targetusername')}
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    autoComplete="off"
                  />
                  {confirmName && !deleteConfirmed && (
                    <span className="modal-confirm-hint">{t('userlistmanager.names_do_not_match')}</span>
                  )}
                  {deleteConfirmed && (
                    <span className="modal-confirm-ok">{t('userlistmanager.name_matches_can_be')}</span>
                  )}
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={closeModal} disabled={actionLoading}>{t('userlistmanager.cancel')}</button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={
                  actionLoading ||
                  !deleteConfirmed ||
                  targetUser.roleName?.toLowerCase() === 'admin'
                }
              >
                {actionLoading ? t('userlistmanager.deleting') : t('userlistmanager.delete_account')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

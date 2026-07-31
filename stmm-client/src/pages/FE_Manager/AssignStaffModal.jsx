import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AssignStaffModal.css';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AssignStaffModal({ taskId, currentStaffId, baseUrl, onClose, onSuccess, addToast }) {
  const { t } = useTranslation();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStaffs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/api/manager/users?roleName=Staff`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          // Filter only active staff members
          setStaffs(data.filter(u => u.status === 'Active') || []);
        } else {
          addToast(t('assignstaffmodal.cannot_load_staff'), 'error');
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
        addToast(t('assignstaffmodal.connection_failed'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();
  }, [addToast, baseUrl, t]);

  const filteredStaffs = staffs.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      addToast(t('assignstaffmodal.staff_required'), 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks/${taskId}/assign`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ staffUserId: parseInt(selectedStaffId) })
      });

      if (res.ok) {
        addToast(t('assignstaffmodal.assigned_successfully'), 'success');
        const updatedTask = await res.json();
        onSuccess(updatedTask);
      } else {
        const errText = await res.text();
        let errorMsg = t('assignstaffmodal.assign_failed');
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.detail || errJson.message || errorMsg;
        } catch {
          errorMsg = errText || errorMsg;
        }
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
      addToast(t('assignstaffmodal.network_error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-head">
          <h3>{t('assignstaffmodal.title')}</h3>
          <button id="btn-assign-staff-close" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Search Input */}
            <div className="form-group">
              <label className="form-label">{t('assignstaffmodal.find_staff')}</label>
              <div className="search-input-wrapper">
                <input
                  id="input-assign-staff-search"
                  type="text"
                  className="form-control"
                  placeholder={t('assignstaffmodal.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading || submitting}
                />
                {searchTerm && (
                  <button
                    id="btn-assign-staff-search-clear"
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Staff List */}
            <div className="staff-list-container">
              {loading ? (
                <div className="staff-loading-state">
                  <div className="mini-spinner"></div>
                  <span>{t('assignstaffmodal.loading_staff')}</span>
                </div>
              ) : filteredStaffs.length === 0 ? (
                <div className="staff-empty-state">
                  {t('assignstaffmodal.no_staff')}
                </div>
              ) : (
                <div className="staff-radio-group">
                  {filteredStaffs.map((s) => {
                    const isSelected = parseInt(selectedStaffId) === s.userId;
                    return (
                      <label 
                        key={s.userId} 
                        className={`staff-radio-item ${isSelected ? 'is-selected' : ''}`}
                      >
                        <input
                          id={`radio-assign-staff-${s.userId}`}
                          type="radio"
                          name="assignedStaff"
                          value={s.userId}
                          checked={isSelected}
                          onChange={() => setSelectedStaffId(s.userId.toString())}
                          disabled={submitting}
                          className="staff-radio-input"
                        />
                        <div className="staff-avatar">
                          {getInitials(s.name)}
                        </div>
                        <div className="staff-info">
                          <span className="staff-name">{s.name}</span>
                          <span className="staff-email">{s.email}</span>
                        </div>
                        {isSelected && (
                          <div className="selection-indicator">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="modal-foot">
            <button id="btn-assign-staff-cancel" type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              {t('assignstaffmodal.cancel')}
            </button>
            <button id="btn-assign-staff-confirm" type="submit" className="btn-primary" disabled={submitting || !selectedStaffId}>
              {submitting ? t('assignstaffmodal.assigning') : t('assignstaffmodal.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

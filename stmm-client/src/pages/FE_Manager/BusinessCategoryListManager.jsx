import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import './BusinessCategoryListManager.css';

const API_BASE = "http://localhost:5056/api/manager/business-categories";

/* ── Icons ── */
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconInfo    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export default function BusinessCategoryListManager({ navigate, addToast }) {
  const { t } = useTranslation();

  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'true', 'false', or '' (All)

  // Debounce search query input (300ms) to optimize network requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Form Modal States
  const [isFormOpen, setIsFormOpen]   = useState(false);
  const [isEditMode, setIsEditMode]   = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [formErrors, setFormErrors]   = useState({});
  const [formData, setFormData]       = useState({
    code: '',
    name: '',
    description: '',
    isActive: true
  });

  // Delete Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetCat, setTargetCat]       = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCategories(debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter]);

  const fetchCategories = async (search = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      let url = `${API_BASE}?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (status !== '') url += `isActive=${encodeURIComponent(status)}&`;

      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        setCategories(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast(t('businesscategorylistmanager.unable_to_load_business'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setSelectedCat(null);
    setFormErrors({});
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditMode(true);
    setSelectedCat(cat);
    setFormErrors({});
    setFormData({
      code: cat.code,
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive ?? true
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCat(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!isEditMode) {
      if (!formData.code.trim()) {
        errors.code = t('businesscategorylistmanager.aviation_industry_code_cannot');
      } else if (!/^[A-Z0-9_]+$/.test(formData.code.trim())) {
        errors.code = t('businesscategorylistmanager.industry_codes_must_only');
      } else if (formData.code.trim().length > 50) {
        errors.code = t('businesscategorylistmanager.aviation_codes_cannot_exceed');
      }
    }

    if (!formData.name.trim()) {
      errors.name = t('businesscategorylistmanager.aviation_industry_name_cannot');
    } else if (formData.name.trim().length > 100) {
      errors.name = t('businesscategorylistmanager.the_industry_name_cannot');
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = t('businesscategorylistmanager.description_must_not_exceed');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm() || actionLoading) return;

    setActionLoading(true);
    try {
      let url = API_BASE;
      let method = 'POST';
      let payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive
      };

      if (!isEditMode) {
        payload.code = formData.code.trim().toUpperCase();
      } else {
        url = `${API_BASE}/${selectedCat.categoryId}`;
        method = 'PUT';
      }

      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast(isEditMode ? t('businesscategorylistmanager.updated_directory_successfully') : t('businesscategorylistmanager.new_category_created_successfully'), 'success');
        handleCloseForm();
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || t('businesscategorylistmanager.error_while_saving_directory'), 'error');
      }
    } catch {
      addToast(t('businesscategorylistmanager.connection_error_please_try'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (cat) => {
    setTargetCat(cat);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setTargetCat(null);
  };

  const handleDelete = async () => {
    if (!targetCat || actionLoading) return;

    // Safety rule checked on frontend as well
    if (targetCat.stallsCount > 0 || targetCat.areasCount > 0) {
      addToast(t('businesscategorylistmanager.it_is_not_possible'), 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${targetCat.categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        addToast(t('businesscategorylistmanager.directory_deletion_successful'), 'success');
        handleCloseDelete();
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || t('businesscategorylistmanager.server_error_while_deleting'), 'error');
      }
    } catch {
      addToast(t('businesscategorylistmanager.connection_error_please_try'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const hasFilters = searchQuery || statusFilter !== '';

  return (
    <div className="cat-manager-container">
      
      {/* 💡 Explanatory Difference Banner */}
      <div className="diff-banner">
        <div className="banner-icon-wrapper">
          <IconInfo />
        </div>
        <div className="banner-content">
          <h4>{t('businesscategorylistmanager.distinguishing_between_market_area')}</h4>
          <p>
            1. <strong>{t('businesscategorylistmanager.market_area_physical_space')}</strong> {t('businesscategorylistmanager.answer_the_question')}<em>{t('businesscategorylistmanager.where_is_the_stall')}</em>{t('businesscategorylistmanager.used_to_divide_market')}<br />
            2. <strong>{t('businesscategorylistmanager.business_category_characteristics_of')}</strong> {t('businesscategorylistmanager.answer_the_question')}<em>{t('businesscategorylistmanager.what_does_that_stall')}</em>{t('businesscategorylistmanager.classify_the_type_of')}</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder={t('businesscategorylistmanager.search_by_code_industry')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title={t('businesscategorylistmanager.erase')}>
                <IconXCircle />
              </button>
            )}
          </div>

          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('businesscategorylistmanager.all_status')}</option>
            <option value="true">{t('businesscategorylistmanager.active')}</option>
            <option value="false">{t('businesscategorylistmanager.inactive')}</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={clearFilters}>
              {t('businesscategorylistmanager.clear_filter')}</button>
          )}
        </div>

        <button className="btn-primary" onClick={handleOpenCreate}>
          <IconPlus /> {t('businesscategorylistmanager.add_industry_category')}</button>
      </div>

      {/* ── Table Card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">{t('businesscategorylistmanager.list_of_business_categories')}</span>
          {!loading && (
            <span className="table-count-badge">{categories.length} danh mục</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">{t('businesscategorylistmanager.loading_data')}</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? t('businesscategorylistmanager.no_matching_categories_were') : t('businesscategorylistmanager.there_are_no_business')}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={clearFilters}>
                {t('businesscategorylistmanager.clear_filter')}</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cat-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>#</th>
                  <th style={{ width: 120 }}>{t('businesscategorylistmanager.code_code')}</th>
                  <th style={{ width: 220 }}>{t('businesscategorylistmanager.industry_name')}</th>
                  <th>{t('businesscategorylistmanager.detailed_description')}</th>
                  <th style={{ width: 100, textAlign: 'center' }}>{t('businesscategorylistmanager.number_of_stalls')}</th>
                  <th style={{ width: 100, textAlign: 'center' }}>{t('businesscategorylistmanager.area_number')}</th>
                  <th style={{ width: 140, textAlign: 'center' }}>{t('businesscategorylistmanager.status')}</th>
                  <th style={{ width: 120, textAlign: 'center' }}>{t('businesscategorylistmanager.act')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr key={cat.categoryId}>
                    <td className="row-no">{idx + 1}</td>
                    <td><span className="mono-code">{cat.code}</span></td>
                    <td><strong>{cat.name}</strong></td>
                    <td className="desc-text" title={cat.description}>{cat.description || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`count-badge ${cat.stallsCount > 0 ? 'active' : ''}`}>
                        {cat.stallsCount} sạp
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`count-badge ${cat.areasCount > 0 ? 'active' : ''}`}>
                        {cat.areasCount} khu
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge-status ${cat.isActive ? 'active' : 'inactive'}`}>
                        <span className="badge-dot" />
                        {cat.isActive ? t('businesscategorylistmanager.work') : t('businesscategorylistmanager.temporarily_locked')}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'center' }}>
                        <button className="btn-icon edit" title={t('businesscategorylistmanager.edit_categories')} onClick={() => handleOpenEdit(cat)}><IconEdit /></button>
                        <button className="btn-icon delete" title={t('businesscategorylistmanager.delete_category')} onClick={() => handleOpenDelete(cat)}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Create / Edit Category ── */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{isEditMode ? t('businesscategorylistmanager.edit_business_lines') : t('businesscategorylistmanager.create_new_business_lines')}</h3>
              <button className="modal-close" onClick={handleCloseForm}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label required">{t('businesscategorylistmanager.product_code_code')}</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.code ? 'is-invalid' : ''}`}
                    placeholder={t('businesscategorylistmanager.for_example_food_fashion')}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={isEditMode}
                    maxLength={50}
                  />
                  {formErrors.code && <div className="invalid-feedback">{formErrors.code}</div>}
                  <small className="form-text">
                    {isEditMode ? t('businesscategorylistmanager.code_cannot_be_changed') : t('businesscategorylistmanager.the_code_is_written')}
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label required">{t('businesscategorylistmanager.industry_name')}</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder={t('businesscategorylistmanager.for_example_fresh_food')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                  />
                  {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('businesscategorylistmanager.separate_description_and_regulations')}</label>
                  <textarea
                    className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                    placeholder={t('businesscategorylistmanager.specific_regulations_on_hygiene')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    maxLength={500}
                  />
                  {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {t('businesscategorylistmanager.active_allow_stores_and')}</label>
                </div>

              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseForm} disabled={actionLoading}>{t('businesscategorylistmanager.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? t('businesscategorylistmanager.saving') : t('businesscategorylistmanager.stay')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ── */}
      {isDeleteOpen && targetCat && (
        <div className="modal-overlay" onClick={handleCloseDelete}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t('businesscategorylistmanager.delete_industry_category')}</h3>
              <button className="modal-close" onClick={handleCloseDelete}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-icon-wrap danger">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              
              <p className="modal-desc text-center" style={{ margin: '8px 0 16px' }}>
                {t('businesscategorylistmanager.confirm_the_action_to')}</p>

              {/* Category Card Detail */}
              <div className="modal-cat-card">
                <div className="modal-cat-avatar">
                  {targetCat.code.substring(0, 2).toUpperCase()}
                </div>
                <div className="modal-cat-details">
                  <p className="modal-cat-name">{targetCat.name}</p>
                  <p className="modal-cat-meta">{t('businesscategorylistmanager.industry_code')}<span className="mono-code">{targetCat.code}</span></p>
                </div>
              </div>

              {/* Safety Constraint Warnings */}
              {(targetCat.stallsCount > 0 || targetCat.areasCount > 0) ? (
                <div className="modal-rule-warn danger">
                  <div className="warn-title">{t('businesscategorylistmanager.this_category_cannot_be')}</div>
                  <div className="warn-grid">
                    <div className="warn-item">
                      <span className="warn-value">{targetCat.stallsCount}</span>
                      <span className="warn-label">{t('businesscategorylistmanager.stores_are_assigned')}</span>
                    </div>
                    <div className="warn-item">
                      <span className="warn-value">{targetCat.areasCount}</span>
                      <span className="warn-label">{t('businesscategorylistmanager.area_being_assigned')}</span>
                    </div>
                  </div>
                  <p className="warn-solution">
                    <strong>{t('businesscategorylistmanager.solution')}</strong> {t('businesscategorylistmanager.you_need_to_change')}<strong>{t('businesscategorylistmanager.temporarily_locked')}</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-secondary text-center" style={{ fontSize: '13px', margin: '16px 0 8px' }}>
                  {t('businesscategorylistmanager.this_action_will_permanently')}</p>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={handleCloseDelete} disabled={actionLoading}>{t('businesscategorylistmanager.cancel')}</button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={actionLoading || targetCat.stallsCount > 0 || targetCat.areasCount > 0}
              >
                {actionLoading ? t('businesscategorylistmanager.deleting') : t('businesscategorylistmanager.confirm_deletion')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

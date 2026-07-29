import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useMemo } from 'react';
import meterService from '../../services/meterService';
import './MeterManagement.css';

// ── Icons ──
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const IconEmpty = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconDanger = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconChevronLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

const DEFAULT_ASSIGNED_FILTER = 'false';

export default function MeterManagement({ addToast }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';

  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [isAssignedFilter, setIsAssignedFilter] = useState(DEFAULT_ASSIGNED_FILTER);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);

  // Modal states
  const [modalType, setModalType] = useState(null);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formValues, setFormValues] = useState({ serialNumber: '', type: 'Electricity', isActive: true });
  const [formErrors, setFormErrors] = useState({});



  const fetchMeters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meterService.getMeters();
      setMeters(Array.isArray(res) ? res : []);
    } catch (error) {
      addToast(error.message || t('metermanagement.unable_to_load_meter'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  const filteredMeters = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return meters.filter((meter) => {
      const matchesSearch = !normalizedSearch
        || String(meter.serialNumber || '').toLowerCase().includes(normalizedSearch);
      const matchesType = !typeFilter || meter.type === typeFilter;
      const matchesActive = !isActiveFilter || String(Boolean(meter.isActive)) === isActiveFilter;
      const isAssigned = meter.stallId !== null && meter.stallId !== undefined;
      const matchesAssigned = !isAssignedFilter || String(isAssigned) === isAssignedFilter;

      return matchesSearch && matchesType && matchesActive && matchesAssigned;
    });
  }, [isActiveFilter, isAssignedFilter, meters, search, typeFilter]);

  const totalCount = filteredMeters.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageNumber = Math.min(pageNumber, totalPages);
  const visibleMeters = useMemo(() => {
    const startIndex = (safePageNumber - 1) * pageSize;
    return filteredMeters.slice(startIndex, startIndex + pageSize);
  }, [filteredMeters, pageSize, safePageNumber]);

  useEffect(() => {
    if (pageNumber !== safePageNumber) setPageNumber(safePageNumber);
  }, [pageNumber, safePageNumber]);

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setIsActiveFilter('');
    setIsAssignedFilter(DEFAULT_ASSIGNED_FILTER);
    setPageNumber(1);
  };

  const hasFilters = search || typeFilter || isActiveFilter || isAssignedFilter !== DEFAULT_ASSIGNED_FILTER;
  // tableTitle dùng t() theo ngôn ngữ — không hardcode VI
  const tableTitle = isAssignedFilter === DEFAULT_ASSIGNED_FILTER
    ? t('metermanagement.available_meter_inventory')
    : isAssignedFilter === 'true'
      ? t('metermanagement.the_meter_has_been')
      : t('metermanagement.all_meters_are_in');

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formValues.serialNumber.trim()) {
      errors.serialNumber = t('metermanagement.the_serial_number_cannot');
    } else if (formValues.serialNumber.trim().length < 3) {
      errors.serialNumber = t('metermanagement.the_serial_number_must');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setFormValues({ serialNumber: '', type: 'Electricity', isActive: true });
    setFormErrors({});
    setModalType('create');
  };

  const handleOpenEditModal = (meter) => {
    setSelectedMeter(meter);
    setFormValues({
      serialNumber: meter.serialNumber,
      type: meter.type,
      isActive: meter.isActive ?? true
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenStatusModal = (meter) => {
    if (meter.isActive && meter.stallId !== null) {
      addToast(t('metermanagement.deactivate_error_unassign_first'), 'error');
      return;
    }
    setSelectedMeter(meter);
    setModalType('status');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedMeter(null);
    setFormValues({ serialNumber: '', type: 'Electricity', isActive: true });
    setFormErrors({});
  };

  // Submit handlers
  const handleCreateMeter = async (e) => {
    e.preventDefault();
    if (!validateForm() || actionLoading) return;

    setActionLoading(true);
    try {
      await meterService.createMeter({
        serialNumber: formValues.serialNumber.trim(),
        type: formValues.type
      });
      addToast(t('metermanagement.added_meter_to_availability'), 'success');
      handleCloseModal();
      setPageNumber(1);
      fetchMeters();
    } catch (error) {
      addToast(error.message || t('metermanagement.error_creating_meter'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMeter = async (e) => {
    e.preventDefault();
    if (!validateForm() || !selectedMeter || actionLoading) return;

    setActionLoading(true);
    try {
      await meterService.updateMeter(selectedMeter.meterId, {
        serialNumber: formValues.serialNumber.trim(),
        type: formValues.type,
        isActive: formValues.isActive
      });
      addToast(t('metermanagement.updated_meter_selectedmetermeterid_successfully', { meterId: selectedMeter.meterId }), 'success');
      handleCloseModal();
      fetchMeters();
    } catch (error) {
      addToast(error.message || t('metermanagement.error_updating_meter'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMeterStatus = async () => {
    if (!selectedMeter || actionLoading) return;

    setActionLoading(true);
    try {
      const nextIsActive = !selectedMeter.isActive;
      await meterService.updateMeter(selectedMeter.meterId, {
        serialNumber: selectedMeter.serialNumber,
        type: selectedMeter.type,
        isActive: nextIsActive
      });
      addToast(
        t('metermanagement.meter_status_changed', { meterId: selectedMeter.meterId, action: nextIsActive ? t('metermanagement.reactivated') : t('metermanagement.deactivated') }),
        'success'
      );
      handleCloseModal();
      fetchMeters();
    } catch (error) {
      addToast(error.message || t('metermanagement.unable_to_change_meter_status'), 'error');
    } finally {
      setActionLoading(false);
    }
  };



  // UI Helpers
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    if (dateStr.includes('-') && dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="meter-management-container">
      {/* ── Toolbar Lọc và Tìm kiếm ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder={t('metermanagement.search_by_serial_number')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')} title={t('metermanagement.erase')}>
                <IconXCircle />
              </button>
            )}
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">{t('metermanagement.all_types_of_meters')}</option>
            <option value="Electricity">{t('metermanagement.electricity')}</option>
            <option value="Water">{t('metermanagement.water')}</option>
          </select>

          <select
            className="filter-select"
            value={isAssignedFilter}
            onChange={(e) => { setIsAssignedFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">{t('metermanagement.all_meters_are_in')}</option>
            <option value="false">{t('metermanagement.in_stock_available')}</option>
            <option value="true">{t('metermanagement.assigned_to_the_stall')}</option>
          </select>

          <select
            className="filter-select"
            value={isActiveFilter}
            onChange={(e) => { setIsActiveFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">{t('metermanagement.all_active_status')}</option>
            <option value="true">{t('metermanagement.active')}</option>
            <option value="false">{t('metermanagement.inactive')}</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={handleClearFilters}>
              {t('metermanagement.clear_filter')}</button>
          )}
        </div>

        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <IconPlus /> {t('metermanagement.add_meter_to_inventory')}</button>
      </div>

      {/* ── Bảng dữ liệu ── */}
      <div className="table-card">
        <div className="table-card-header">
          <div className="table-title-group">
            <span className="table-card-title">{tableTitle}</span>
            <span className="table-card-subtitle">{t('metermanagement.available_meter_sources_for')}</span>
          </div>
          {!loading && (
            <span className="table-count-badge">{totalCount} công tơ</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">{t('metermanagement.loading_meter_warehouse_with')}</span>
          </div>
        ) : visibleMeters.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? t('metermanagement.no_matching_meters_were') : t('metermanagement.there_are_no_available')}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={handleClearFilters}>
                {t('metermanagement.about_available_inventory')}</button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="meter-table">
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}>#</th>
                    <th>{t('metermanagement.serial_number')}</th>
                    <th>{t('metermanagement.type')}</th>
                    <th>{t('metermanagement.stall_assignment_status')}</th>
                    <th style={{ textAlign: 'right' }}>{t('metermanagement.last_index')}</th>
                    <th>{t('metermanagement.installation_date')}</th>
                    <th>{t('metermanagement.work')}</th>
                    <th style={{ width: 140, textAlign: 'center' }}>{t('metermanagement.act')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMeters.map((meter, idx) => {
                    const rowNum = (safePageNumber - 1) * pageSize + idx + 1;
                    return (
                      <tr key={meter.meterId}>
                        <td className="row-no">{rowNum}</td>
                        <td>
                          <span className="meter-serial-badge">{meter.serialNumber}</span>
                        </td>
                        <td>
                          <span className={`badge-type ${meter.type?.toLowerCase()}`}>
                            {meter.type === 'Electricity' ? t('metermanagement.electricity') : t('metermanagement.water')}
                          </span>
                        </td>
                        <td>
                          {meter.stallId ? (
                            <span className="assigned-stall-badge">
                              Sạp {meter.stallCode}
                            </span>
                          ) : (
                            <span className="in-warehouse-badge">
                              Trong kho
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          <span className="mono-text">
                            {meter.lastReadingValue !== null ? meter.lastReadingValue : 0}
                          </span>
                        </td>
                        <td>
                          {formatDateTime(meter.installedAt)}
                        </td>
                        <td>
                          <span className={`badge-status ${meter.isActive ? 'active' : 'inactive'}`}>
                            <span className="badge-dot" />
                            {meter.isActive ? t('metermanagement.work') : t('metermanagement.stop_working')}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="btn-icon edit"
                              title={t('metermanagement.edit_meters')}
                              onClick={() => handleOpenEditModal(meter)}
                            >
                              <IconEdit />
                            </button>
                            
                            <button
                              className={`btn-icon ${meter.isActive ? 'delete' : 'edit'}`}
                              title={
                                meter.isActive && meter.stallId !== null
                                  ? 'Replace or unassign this meter before deactivating it.'
                                  : meter.isActive
                                    ? 'Deactivate meter'
                                    : 'Reactivate meter'
                              }
                              onClick={() => handleOpenStatusModal(meter)}
                              disabled={meter.isActive && meter.stallId !== null}
                            >
                              <IconXCircle />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Phân trang ── */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-pagination"
                  disabled={safePageNumber <= 1}
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  title={t('metermanagement.previous_page')}
                >
                  <IconChevronLeft />
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn-page-num ${page === safePageNumber ? 'active' : ''}`}
                      onClick={() => setPageNumber(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className="btn-pagination"
                  disabled={safePageNumber >= totalPages}
                  onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                  title="Trang sau"
                >
                  <IconChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Thêm công tơ vào kho ── */}
      {modalType === 'create' && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t('metermanagement.add_meters_to_availability')}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleCreateMeter}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('metermanagement.meter_type')}<span className="text-danger">*</span></label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type"
                        value="Electricity"
                        checked={formValues.type === 'Electricity'}
                        onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                      />
                      {t('metermanagement.electricity')}</label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type"
                        value="Water"
                        checked={formValues.type === 'Water'}
                        onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                      />
                      {t('metermanagement.water')}</label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('metermanagement.serial_number')}<span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.serialNumber ? 'is-invalid' : ''}`}
                    placeholder={t('metermanagement.for_example_elec99882_wat33291')}
                    value={formValues.serialNumber}
                    onChange={(e) => setFormValues(prev => ({ ...prev, serialNumber: e.target.value }))}
                  />
                  {formErrors.serialNumber && (
                    <span className="invalid-feedback">{formErrors.serialNumber}</span>
                  )}
                  <p className="form-help-text">{t('metermanagement.serial_code_must_be')}</p>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>{t('metermanagement.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? t('metermanagement.creating') : t('metermanagement.create_meters')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Chỉnh sửa công tơ ── */}
      {modalType === 'edit' && selectedMeter && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t('metermanagement.edit_meter_information')}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleUpdateMeter}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('metermanagement.meter_type')}</label>
                  <select
                    className="form-input"
                    value={formValues.type}
                    onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                    disabled={selectedMeter.stallId !== null}
                  >
                    <option value="Electricity">{t('metermanagement.electricity')}</option>
                    <option value="Water">{t('metermanagement.water')}</option>
                  </select>
                  {selectedMeter.stallId !== null && (
                    <p className="form-help-text text-warning">{t('metermanagement.it_is_not_possible')}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('metermanagement.serial_number')}<span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.serialNumber ? 'is-invalid' : ''}`}
                    value={formValues.serialNumber}
                    onChange={(e) => setFormValues(prev => ({ ...prev, serialNumber: e.target.value }))}
                  />
                  {formErrors.serialNumber && (
                    <span className="invalid-feedback">{formErrors.serialNumber}</span>
                  )}
                </div>

              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>{t('metermanagement.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? t('metermanagement.saving') : t('metermanagement.save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'status' && selectedMeter && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{selectedMeter.isActive ? 'Deactivate meter' : 'Reactivate meter'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-icon-wrap danger"><IconDanger /></div>
              <p className="modal-desc">
                Are you sure you want to {selectedMeter.isActive ? 'deactivate' : 'reactivate'} meter <strong>{selectedMeter.serialNumber}</strong>?
              </p>
              {selectedMeter.isActive && (
                <p className="modal-desc text-danger" style={{ fontWeight: '500' }}>
                  An inactive meter cannot receive new readings until it is reactivated.
                </p>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>{t('metermanagement.cancel')}</button>
              <button className={selectedMeter.isActive ? 'btn-danger' : 'btn-primary'} onClick={handleToggleMeterStatus} disabled={actionLoading}>
                {actionLoading
                  ? 'Saving...'
                  : selectedMeter.isActive
                    ? 'Deactivate'
                    : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

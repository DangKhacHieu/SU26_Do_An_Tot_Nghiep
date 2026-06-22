import { useState, useEffect } from 'react';
import meterService from '../../services/meterService';
import './MeterManagement.css';

// ── Icons ──
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconReplace = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IconEmpty = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconWarn = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconDanger = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconChevronLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

export default function MeterManagement({ navigate, addToast }) {
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [isAssignedFilter, setIsAssignedFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'delete' | 'replace'
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formValues, setFormValues] = useState({ serialNumber: '', type: 'Electricity', isActive: true });
  const [formErrors, setFormErrors] = useState({});

  // Replacement states
  const [unassignedMeters, setUnassignedMeters] = useState([]);
  const [selectedNewMeterId, setSelectedNewMeterId] = useState('');
  const [replacementError, setReplacementError] = useState('');

  // Fetch meters on filters & page change
  useEffect(() => {
    fetchMeters();
  }, [search, typeFilter, isActiveFilter, isAssignedFilter, pageNumber]);

  const fetchMeters = async () => {
    setLoading(true);
    try {
      const queryParams = {
        pageNumber,
        pageSize,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        isActive: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
        isAssigned: isAssignedFilter === 'true' ? true : isAssignedFilter === 'false' ? false : undefined
      };
      const res = await meterService.getMeters(queryParams);
      setMeters(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      addToast(error.message || 'Không thể tải danh sách công tơ.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setIsActiveFilter('');
    setIsAssignedFilter('');
    setPageNumber(1);
  };

  const hasFilters = search || typeFilter || isActiveFilter || isAssignedFilter;

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formValues.serialNumber.trim()) {
      errors.serialNumber = 'Mã số seri không được để trống.';
    } else if (formValues.serialNumber.trim().length < 3) {
      errors.serialNumber = 'Mã số seri phải có ít nhất 3 ký tự.';
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

  const handleOpenDeleteModal = (meter) => {
    if (meter.stallId !== null) {
      addToast('Không thể xóa công tơ đang được gán cho sạp hàng. Vui lòng thay thế trước.', 'error');
      return;
    }
    setSelectedMeter(meter);
    setModalType('delete');
  };

  const handleOpenReplaceModal = async (meter) => {
    if (meter.stallId === null) {
      addToast('Công tơ này đang ở trong kho. Không cần thực hiện chức năng thay thế.', 'error');
      return;
    }
    setSelectedMeter(meter);
    setSelectedNewMeterId('');
    setReplacementError('');
    setUnassignedMeters([]);
    setModalType('replace');

    // Fetch unassigned meters of the same type in warehouse
    try {
      const list = await meterService.getUnassignedMeters(meter.type);
      setUnassignedMeters(list || []);
    } catch (error) {
      setReplacementError('Không thể lấy danh sách công tơ trong kho.');
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedMeter(null);
    setFormValues({ serialNumber: '', type: 'Electricity', isActive: true });
    setFormErrors({});
    setSelectedNewMeterId('');
    setUnassignedMeters([]);
    setReplacementError('');
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
      addToast('Thêm công tơ mới vào kho thành công!', 'success');
      handleCloseModal();
      setPageNumber(1);
      fetchMeters();
    } catch (error) {
      addToast(error.message || 'Lỗi khi tạo công tơ.', 'error');
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
      addToast(`Cập nhật công tơ #${selectedMeter.meterId} thành công!`, 'success');
      handleCloseModal();
      fetchMeters();
    } catch (error) {
      addToast(error.message || 'Lỗi khi cập nhật công tơ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMeter = async () => {
    if (!selectedMeter || actionLoading) return;

    setActionLoading(true);
    try {
      await meterService.deleteMeter(selectedMeter.meterId);
      addToast(`Xóa công tơ #${selectedMeter.meterId} thành công!`, 'success');
      handleCloseModal();
      // Adjust page if delete empty current page
      if (meters.length === 1 && pageNumber > 1) {
        setPageNumber(prev => prev - 1);
      } else {
        fetchMeters();
      }
    } catch (error) {
      addToast(error.message || 'Lỗi khi xóa công tơ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceMeter = async (e) => {
    e.preventDefault();
    if (!selectedMeter || !selectedNewMeterId || actionLoading) return;

    setActionLoading(true);
    try {
      await meterService.replaceMeter({
        stallId: selectedMeter.stallId,
        oldMeterId: selectedMeter.meterId,
        newMeterId: parseInt(selectedNewMeterId)
      });
      addToast(`Thay thế công tơ cho sạp ${selectedMeter.stallCode} thành công!`, 'success');
      handleCloseModal();
      fetchMeters();
    } catch (error) {
      setReplacementError(error.message || 'Thay thế công tơ thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  // UI Helpers
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
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
              placeholder="Tìm theo Serial Number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')} title="Xóa">
                <IconXCircle />
              </button>
            )}
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">Tất cả loại công tơ</option>
            <option value="Electricity">Điện (Electricity)</option>
            <option value="Water">Nước (Water)</option>
          </select>

          <select
            className="filter-select"
            value={isAssignedFilter}
            onChange={(e) => { setIsAssignedFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">Tất cả trạng thái gán</option>
            <option value="true">Đã gán sạp hàng</option>
            <option value="false">Trong kho (Chưa gán)</option>
          </select>

          <select
            className="filter-select"
            value={isActiveFilter}
            onChange={(e) => { setIsActiveFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">Tất cả trạng thái hoạt động</option>
            <option value="true">Hoạt động (Active)</option>
            <option value="false">Ngừng hoạt động (Inactive)</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={handleClearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <IconPlus /> Thêm công tơ mới
        </button>
      </div>

      {/* ── Bảng dữ liệu ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">Quản lý Thiết bị Công tơ</span>
          {!loading && (
            <span className="table-count-badge">{totalCount} kết quả</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">Đang tải danh sách công tơ...</span>
          </div>
        ) : meters.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? 'Không tìm thấy công tơ nào phù hợp.' : 'Chưa có công tơ nào trong hệ thống.'}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={handleClearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="meter-table">
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}>#</th>
                    <th>Số Seri (Serial Number)</th>
                    <th>Loại</th>
                    <th>Trạng thái gán sạp</th>
                    <th style={{ textAlign: 'right' }}>Chỉ số cuối</th>
                    <th>Ngày lắp đặt</th>
                    <th>Hoạt động</th>
                    <th style={{ width: 140, textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((meter, idx) => {
                    const rowNum = (pageNumber - 1) * pageSize + idx + 1;
                    return (
                      <tr key={meter.meterId}>
                        <td className="row-no">{rowNum}</td>
                        <td>
                          <span className="meter-serial-badge">{meter.serialNumber}</span>
                        </td>
                        <td>
                          <span className={`badge-type ${meter.type?.toLowerCase()}`}>
                            {meter.type === 'Electricity' ? 'Điện' : 'Nước'}
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
                            {meter.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="btn-icon edit"
                              title="Chỉnh sửa công tơ"
                              onClick={() => handleOpenEditModal(meter)}
                            >
                              <IconEdit />
                            </button>
                            
                            {meter.stallId ? (
                              <button
                                className="btn-icon replace"
                                title="Thay thế công tơ"
                                onClick={() => handleOpenReplaceModal(meter)}
                              >
                                <IconReplace />
                              </button>
                            ) : (
                              <button
                                className="btn-icon delete"
                                title="Xóa công tơ"
                                onClick={() => handleOpenDeleteModal(meter)}
                              >
                                <IconTrash />
                              </button>
                            )}
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
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  title="Trang trước"
                >
                  <IconChevronLeft />
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn-page-num ${page === pageNumber ? 'active' : ''}`}
                      onClick={() => setPageNumber(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className="btn-pagination"
                  disabled={pageNumber >= totalPages}
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

      {/* ── Modal: Thêm công tơ mới ── */}
      {modalType === 'create' && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Thêm công tơ mới vào kho</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleCreateMeter}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Loại công tơ <span className="text-danger">*</span></label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type"
                        value="Electricity"
                        checked={formValues.type === 'Electricity'}
                        onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                      />
                      Điện (Electricity)
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="type"
                        value="Water"
                        checked={formValues.type === 'Water'}
                        onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                      />
                      Nước (Water)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mã số Seri (Serial Number) <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.serialNumber ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: ELEC-99882, WAT-33291"
                    value={formValues.serialNumber}
                    onChange={(e) => setFormValues(prev => ({ ...prev, serialNumber: e.target.value }))}
                  />
                  {formErrors.serialNumber && (
                    <span className="invalid-feedback">{formErrors.serialNumber}</span>
                  )}
                  <p className="form-help-text">Mã số seri này phải là duy nhất trên toàn hệ thống.</p>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo...' : 'Tạo thiết bị'}
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
              <h3>Chỉnh sửa thông tin công tơ</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleUpdateMeter}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Loại công tơ</label>
                  <select
                    className="form-input"
                    value={formValues.type}
                    onChange={(e) => setFormValues(prev => ({ ...prev, type: e.target.value }))}
                    disabled={selectedMeter.stallId !== null} // Lock type if assigned to avoid messing measurements
                  >
                    <option value="Electricity">Điện (Electricity)</option>
                    <option value="Water">Nước (Water)</option>
                  </select>
                  {selectedMeter.stallId !== null && (
                    <p className="form-help-text text-warning">Không thể đổi loại của công tơ đang được lắp tại sạp.</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Mã số Seri (Serial Number) <span className="text-danger">*</span></label>
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

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formValues.isActive}
                      onChange={(e) => setFormValues(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Cho phép hoạt động (Active)
                  </label>
                  <p className="form-help-text">Chỉ công tơ hoạt động mới được ghi nhận chỉ số.</p>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Xóa công tơ ── */}
      {modalType === 'delete' && selectedMeter && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Xóa công tơ khỏi hệ thống</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-icon-wrap danger"><IconDanger /></div>
              <p className="modal-desc">
                Bạn có chắc chắn muốn xóa công tơ <strong>{selectedMeter.serialNumber}</strong> ({selectedMeter.type === 'Electricity' ? 'Điện' : 'Nước'}) khỏi cơ sở dữ liệu?
              </p>
              <p className="modal-desc text-danger" style={{ fontWeight: '500' }}>
                Hành động này không thể hoàn tác. Thiết bị sẽ bị xóa vĩnh viễn khỏi kho hàng.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>Hủy</button>
              <button className="btn-danger" onClick={handleDeleteMeter} disabled={actionLoading}>
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Thay thế công tơ (Meter Replacement) ── */}
      {modalType === 'replace' && selectedMeter && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box modal-box-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Thay thế thiết bị công tơ</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleReplaceMeter}>
              <div className="modal-body">
                {replacementError && (
                  <div className="alert-error">
                    <IconWarn /> {replacementError}
                  </div>
                )}

                {/* Sạp hàng hiện tại */}
                <div className="replacement-summary-card">
                  <div className="summary-section">
                    <span className="summary-title">SẠP HÀNG ĐANG LẮP</span>
                    <span className="summary-val highlight">Sạp {selectedMeter.stallCode}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-section">
                    <span className="summary-title">THIẾT BỊ ĐANG DÙNG</span>
                    <span className="summary-val">{selectedMeter.serialNumber} ({selectedMeter.type === 'Electricity' ? 'Điện' : 'Nước'})</span>
                  </div>
                </div>

                <div className="alert-info-box">
                  Khi thay thế, công tơ hiện tại sẽ được <strong>thu hồi về kho (chuyển trạng thái chưa gán)</strong>, đồng thời thiết bị mới được chọn dưới đây sẽ được gán vào sạp. Lịch sử các số đo cũ của công tơ cũ vẫn sẽ được lưu lại đầy đủ để phục vụ kiểm toán và tính hóa đơn.
                </div>

                <div className="form-group">
                  <label className="form-label">Chọn thiết bị thay thế mới (trong kho) <span className="text-danger">*</span></label>
                  {unassignedMeters.length === 0 ? (
                    <div className="alert-warning-box">
                      Không tìm thấy công tơ <strong>{selectedMeter.type === 'Electricity' ? 'Điện' : 'Nước'}</strong> nào chưa gán ở trong kho. Vui lòng nhập thêm công tơ vào kho trước khi thực hiện thay thế.
                    </div>
                  ) : (
                    <select
                      className={`form-input ${!selectedNewMeterId ? 'is-empty' : ''}`}
                      value={selectedNewMeterId}
                      onChange={(e) => setSelectedNewMeterId(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn công tơ mới từ kho hàng --</option>
                      {unassignedMeters.map(m => (
                        <option key={m.meterId} value={m.meterId}>
                          Seri: {m.serialNumber} (Chỉ số hiện tại: {m.lastReadingValue ?? 0})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={actionLoading}>Hủy</button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading || !selectedNewMeterId || unassignedMeters.length === 0}
                >
                  {actionLoading ? 'Đang thực hiện...' : 'Xác nhận thay thế'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'true', 'false', or '' (All)

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
    fetchCategories();
  }, [searchQuery, statusFilter]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (statusFilter !== '') url += `isActive=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      if (res.ok) {
        setCategories(await res.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast('Không thể tải danh sách danh mục kinh doanh.', 'error');
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
        errors.code = 'Mã ngành hàng không được để trống.';
      } else if (!/^[A-Z0-9_]+$/.test(formData.code.trim())) {
        errors.code = 'Mã ngành hàng chỉ được chứa chữ in hoa, số và dấu gạch dưới.';
      } else if (formData.code.trim().length > 50) {
        errors.code = 'Mã ngành hàng không được dài quá 50 ký tự.';
      }
    }

    if (!formData.name.trim()) {
      errors.name = 'Tên ngành hàng không được để trống.';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Tên ngành hàng không được dài quá 100 ký tự.';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Mô tả không được vượt quá 500 ký tự.';
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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast(isEditMode ? 'Cập nhật danh mục thành công!' : 'Tạo mới danh mục thành công!', 'success');
        handleCloseForm();
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || 'Lỗi khi lưu danh mục.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
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
      addToast('Không thể xóa danh mục đang có quầy sạp hoặc khu vực sử dụng.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${targetCat.categoryId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Xóa danh mục thành công!', 'success');
        handleCloseDelete();
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.message || 'Lỗi máy chủ khi xóa danh mục.', 'error');
      }
    } catch {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
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
          <h4>Phân biệt giữa Market Area (Khu vực chợ) & Business Category (Danh mục kinh doanh)</h4>
          <p>
            1. <strong>Market Area (Không gian vật lý):</strong> Trả lời câu hỏi <em>"Sạp nằm ở đâu?"</em>. Dùng để phân chia mặt bằng chợ phục vụ quản lý hạ tầng (Ví dụ: Khu A ngoài trời, Khu B tầng trệt).
            <br />
            2. <strong>Business Category (Tính chất hàng hóa):</strong> Trả lời câu hỏi <em>"Sạp đó bán gì?"</em>. Phân loại loại hình kinh doanh của tiểu thương (Ví dụ: Thực phẩm tươi sống, Quần áo thời trang). Tiểu thương có thể thuê sạp tại bất kỳ khu vực nào, nhưng hệ thống cần nắm rõ ngành hàng kinh doanh của họ.
          </p>
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
              placeholder="Tìm theo mã code, tên ngành hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title="Xóa">
                <IconXCircle />
              </button>
            )}
          </div>

          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động (Active)</option>
            <option value="false">Ngừng hoạt động (Inactive)</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={handleOpenCreate}>
          <IconPlus /> Thêm danh mục ngành hàng
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">Danh sách danh mục kinh doanh</span>
          {!loading && (
            <span className="table-count-badge">{categories.length} danh mục</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">Đang tải dữ liệu...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? 'Không tìm thấy danh mục nào phù hợp.' : 'Chưa có danh mục kinh doanh nào được cấu hình.'}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cat-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>#</th>
                  <th style={{ width: 120 }}>Mã Code</th>
                  <th style={{ width: 220 }}>Tên ngành hàng</th>
                  <th>Mô tả chi tiết</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Số sạp</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Số khu vực</th>
                  <th style={{ width: 140, textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Hành động</th>
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
                        {cat.isActive ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'center' }}>
                        <button className="btn-icon edit" title="Chỉnh sửa danh mục" onClick={() => handleOpenEdit(cat)}><IconEdit /></button>
                        <button className="btn-icon delete" title="Xóa danh mục" onClick={() => handleOpenDelete(cat)}><IconTrash /></button>
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
              <h3>{isEditMode ? 'Chỉnh sửa ngành hàng kinh doanh' : 'Tạo mới ngành hàng kinh doanh'}</h3>
              <button className="modal-close" onClick={handleCloseForm}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label required">Mã ngành hàng (Code)</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.code ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: FOOD, FASHION, JEWELRY"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={isEditMode}
                    maxLength={50}
                  />
                  {formErrors.code && <div className="invalid-feedback">{formErrors.code}</div>}
                  <small className="form-text">
                    {isEditMode ? 'Không thể thay đổi mã Code sau khi tạo.' : 'Mã code viết liền, không dấu, viết hoa (chữ, số và dấu gạch dưới).'}
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label required">Tên ngành hàng</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: Thực phẩm tươi sống, Quần áo thời trang"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                  />
                  {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả và quy định riêng</label>
                  <textarea
                    className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                    placeholder="Các quy định đặc thù về an toàn vệ sinh, phòng cháy chữa cháy đối với ngành hàng này..."
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
                    Hoạt động (Cho phép các sạp hàng và khu vực gán danh mục này)
                  </label>
                </div>

              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={handleCloseForm} disabled={actionLoading}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu lại'}
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
              <h3>Xóa danh mục ngành hàng</h3>
              <button className="modal-close" onClick={handleCloseDelete}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-icon-wrap danger">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              
              <p className="modal-desc text-center" style={{ margin: '8px 0 16px' }}>
                Xác nhận hành động xóa danh mục ngành hàng dưới đây:
              </p>

              {/* Category Card Detail */}
              <div className="modal-cat-card">
                <div className="modal-cat-avatar">
                  {targetCat.code.substring(0, 2).toUpperCase()}
                </div>
                <div className="modal-cat-details">
                  <p className="modal-cat-name">{targetCat.name}</p>
                  <p className="modal-cat-meta">Mã ngành hàng: <span className="mono-code">{targetCat.code}</span></p>
                </div>
              </div>

              {/* Safety Constraint Warnings */}
              {(targetCat.stallsCount > 0 || targetCat.areasCount > 0) ? (
                <div className="modal-rule-warn danger">
                  <div className="warn-title">⚠️ Không thể xóa danh mục này!</div>
                  <div className="warn-grid">
                    <div className="warn-item">
                      <span className="warn-value">{targetCat.stallsCount}</span>
                      <span className="warn-label">Sạp hàng đang gán</span>
                    </div>
                    <div className="warn-item">
                      <span className="warn-value">{targetCat.areasCount}</span>
                      <span className="warn-label">Khu vực đang gán</span>
                    </div>
                  </div>
                  <p className="warn-solution">
                    <strong>Giải pháp:</strong> Bạn cần thay đổi hoặc gán lại ngành hàng của các sạp và khu vực trên sang một danh mục khác trước khi thực hiện xóa. Hoặc có thể tạm dừng hoạt động bằng cách đổi trạng thái sang <strong>"Tạm khóa"</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-secondary text-center" style={{ fontSize: '13px', margin: '16px 0 8px' }}>
                  Hành động này sẽ xóa vĩnh viễn danh mục kinh doanh khỏi hệ thống.
                </p>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={handleCloseDelete} disabled={actionLoading}>Hủy</button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={actionLoading || targetCat.stallsCount > 0 || targetCat.areasCount > 0}
              >
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

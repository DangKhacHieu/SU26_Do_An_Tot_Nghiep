import React, { useState, useEffect } from 'react';
import {
  Plus, Edit3, Trash2, ShieldAlert, Search, DollarSign,
  CheckCircle, Clock, AlertCircle, Eye, AlertTriangle,
  RefreshCw, Info, X, ShieldOff
} from 'lucide-react';

const getStatusBadge = (status) => {
  if (status === 'Paid') return { cls: 'badge badge-success', label: 'Đã đóng phạt' };
  if (status === 'Unpaid' || status === 'Pending') return { cls: 'badge badge-danger', label: 'Chưa nộp phạt' };
  return { cls: 'badge badge-neutral', label: status };
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export default function ViolationsPenalties() {
  const [activeTab, setActiveTab] = useState('violations');
  const [violations, setViolations] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [notification, setNotification] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', defaultFine: 500000, isActive: true });

  const [violationsPage, setViolationsPage] = useState(1);
  const [typesPage, setTypesPage] = useState(1);
  const itemsPerPage = 5;

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = () => {
    setLoading(true); setIsMock(false);
    const session = localStorage.getItem('user');
    let userIdStr = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        if (u && u.userId) userIdStr = u.userId;
      } catch (e) {}
    }
    Promise.all([
      fetch(`http://localhost:5056/api/violations/all?userId=${userIdStr}`).then(r => r.json()),
      fetch('http://localhost:5056/api/violations/types/all').then(r => r.json())
    ])
      .then(([viols, types]) => { setViolations(viols); setViolationTypes(types); setLoading(false); })
      .catch(() => {
        setTimeout(() => { setViolations(getMockViolations()); setViolationTypes(getMockTypes()); setIsMock(true); setLoading(false); }, 600);
      });
  };

  useEffect(() => { loadAllData(); }, []);

  useEffect(() => {
    setViolationsPage(1);
    setTypesPage(1);
  }, [searchQuery, statusFilter, activeTab]);

  const getMockViolations = () => [
    { violationId: 81, stallCode: 'Kiosk B-12', title: 'Lấn chiếm lối đi chung', description: 'Bày hàng hóa tràn ra ngoài vạch kẻ ranh giới 50cm.', penalty: 1500000, fineAmount: 1500000, status: 'Unpaid', date: '01/06/2026', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', violationType: { name: 'Lấn chiếm' } },
    { violationId: 79, stallCode: 'Kiosk A-03', title: 'Mở cửa muộn quá quy định', description: 'Mở cửa kinh doanh sau 9:00 sáng không có lý do.', penalty: 500000, fineAmount: 500000, status: 'Paid', date: '28/05/2026', imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=600', violationType: { name: 'Giờ giấc' } },
    { violationId: 75, stallCode: 'Kiosk C-10', title: 'Tự ý sửa đổi kết cấu sạp', description: 'Khoan đục tường công cộng và lắp biển quảng cáo quá khổ.', penalty: 5000000, fineAmount: 5000000, status: 'Unpaid', date: '20/05/2026', imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600', violationType: { name: 'Xây dựng' } },
    { violationId: 71, stallCode: 'Kiosk D-02', title: 'Không đảm bảo an toàn PCCC', description: 'Chất đống thùng các-tông chặn trước hộp vòi cứu hỏa.', penalty: 3000000, fineAmount: 3000000, status: 'Paid', date: '15/05/2026', imageUrl: 'https://images.unsplash.com/photo-1599740831666-4cf92c537d7a?auto=format&fit=crop&q=80&w=600', violationType: { name: 'PCCC' } },
  ];

  const getMockTypes = () => [
    { violationTypeId: 1, name: 'Lấn chiếm hành lang', description: 'Bày biện hàng hóa ngoài ranh giới sạp quy định', defaultFine: 1500000, isActive: true },
    { violationTypeId: 2, name: 'Giờ giấc hoạt động', description: 'Mở cửa trễ sau 8:30 hoặc đóng cửa trước 21:00', defaultFine: 500000, isActive: true },
    { violationTypeId: 3, name: 'Quy định xây dựng', description: 'Tự ý sửa kết cấu, lắp thêm thiết bị trái phép', defaultFine: 5000000, isActive: true },
    { violationTypeId: 4, name: 'An toàn phòng chống cháy nổ', description: 'Chặn thiết bị cứu hỏa, tích trữ hóa chất dễ cháy', defaultFine: 3000000, isActive: true },
  ];

  const filteredViolations = violations.filter(v => {
    const q = searchQuery.toLowerCase();
    const matchSearch = v.stallCode.toLowerCase().includes(q) || 
                        v.title.toLowerCase().includes(q) || 
                        (v.violationTypeName || v.violationType?.name || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'Paid' && v.status === 'Paid') || (statusFilter === 'Unpaid' && (v.status === 'Unpaid' || v.status === 'Pending'));
    return matchSearch && matchStatus;
  });

  const handleTypeSubmit = (e) => {
    e.preventDefault();
    const isEdit = !!selectedItem;
    const url = isEdit ? `http://localhost:5056/api/violations/types/${selectedItem.violationTypeId}` : 'http://localhost:5056/api/violations/types';
    if (isMock) {
      if (isEdit) setViolationTypes(violationTypes.map(t => t.violationTypeId === selectedItem.violationTypeId ? { ...t, ...typeForm } : t));
      else setViolationTypes([...violationTypes, { violationTypeId: Math.floor(Math.random() * 100) + 10, ...typeForm }]);
      showNotification('success', `${isEdit ? 'Cập nhật' : 'Thêm'} loại vi phạm thành công!`);
      setActiveModal(null);
    } else {
      fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(typeForm) })
        .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Cập nhật thành công!'); setActiveModal(null); loadAllData(); })
        .catch(() => showNotification('danger', 'Không thể cập nhật loại vi phạm.'));
    }
  };

  const deleteViolationType = () => {
    if (isMock) {
      setViolationTypes(violationTypes.filter(t => t.violationTypeId !== selectedItem.violationTypeId));
      showNotification('success', 'Đã xóa loại vi phạm!');
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/violations/types/${selectedItem.violationTypeId}`, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Xóa thành công!'); setActiveModal(null); loadAllData(); })
        .catch(() => showNotification('danger', 'Thao tác xóa thất bại.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vi Phạm &amp; Xử Phạt</h1>
          <p className="page-subtitle">Quản lý biên bản vi phạm và danh mục chế tài xử phạt của tiểu thương.</p>
        </div>
        <div className="page-actions">
          {activeTab === 'types' && (
            <button className="btn btn-primary" onClick={() => { setSelectedItem(null); setTypeForm({ name: '', description: '', defaultFine: 500000, isActive: true }); setActiveModal('type'); }}>
              <Plus size={15} /> Thêm loại vi phạm
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`alert alert-${notification.type}`}>
          <AlertCircle size={16} className="alert-icon" />
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}

      {/* Mock Warning */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <span><strong>Chế độ mô phỏng:</strong> Không thể kết nối Backend. Đang hiển thị dữ liệu mô phỏng.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        {[{ id: 'violations', label: 'Biên bản Vi phạm', icon: ShieldAlert }, { id: 'types', label: 'Danh mục Lỗi phạt', icon: Info }].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Đang tải dữ liệu vi phạm...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: VIOLATIONS LIST */}
          {activeTab === 'violations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Search & Filters */}
              <div className="card-padded" style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
                    <Search size={14} className="search-icon-inner" />
                    <input type="text" className="search-input" style={{ width: '100%' }}
                      placeholder="Tìm Kiosk, hành vi vi phạm..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Mọi trạng thái</option>
                    <option value="Unpaid">Chưa nộp phạt</option>
                    <option value="Paid">Đã nộp phạt</option>
                  </select>
                  <span className="badge badge-neutral">{filteredViolations.length} biên bản</span>
                </div>
              </div>

              {/* Table */}
              {filteredViolations.length > 0 ? (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã BB</th>
                        <th>Gian Hàng</th>
                        <th>Hành Vi Vi Phạm</th>
                        <th>Loại</th>
                        <th>Ngày lập</th>
                        <th className="text-right">Tiền Phạt</th>
                        <th>Trạng Thái</th>
                        <th className="text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViolations.slice((violationsPage - 1) * itemsPerPage, violationsPage * itemsPerPage).map(vio => {
                        const { cls, label } = getStatusBadge(vio.status);
                        return (
                          <tr key={vio.violationId}>
                            <td><span style={{ fontWeight: 600, color: 'var(--text-title)', fontFamily: 'monospace', fontSize: 13 }}>VIO-{vio.violationId}</span></td>
                            <td><strong style={{ color: 'var(--danger)' }}>{vio.stallCode}</strong></td>
                            <td><span style={{ fontWeight: 600 }}>{vio.title}</span></td>
                            <td><span className="badge badge-neutral">{vio.violationTypeName || vio.violationType?.name || '—'}</span></td>
                            <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{vio.createdAt ? formatDate(vio.createdAt) : (vio.date || '—')}</span></td>
                            <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{(vio.fineAmount || vio.penalty).toLocaleString('vi-VN')} ₫</strong></td>
                            <td><span className={cls}>{label}</span></td>
                            <td className="text-right">
                              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedItem(vio); setActiveModal('details'); }}>
                                <Eye size={13} /> Xem
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredViolations.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Hiển thị {((violationsPage - 1) * itemsPerPage) + 1} - {Math.min(violationsPage * itemsPerPage, filteredViolations.length)} trong tổng số {filteredViolations.length} biên bản
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setViolationsPage(prev => Math.max(prev - 1, 1))} 
                          disabled={violationsPage === 1}
                        >
                          Trước
                        </button>
                        {Array.from({ length: Math.ceil(filteredViolations.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button 
                            key={page} 
                            className={`btn btn-sm ${violationsPage === page ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViolationsPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setViolationsPage(prev => Math.min(prev + 1, Math.ceil(filteredViolations.length / itemsPerPage)))} 
                          disabled={violationsPage === Math.ceil(filteredViolations.length / itemsPerPage)}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-padded">
                  <div className="empty-state">
                    <div className="empty-state-icon"><ShieldOff size={24} /></div>
                    <p className="empty-state-title">Không tìm thấy biên bản vi phạm</p>
                    <p className="empty-state-desc">Không có biên bản vi phạm nào khớp với bộ lọc hiện tại.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIOLATION TYPES */}
          {activeTab === 'types' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên Loại Vi Phạm</th>
                    <th>Mô tả</th>
                    <th className="text-right">Tiền phạt mặc định</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {violationTypes.length > 0 ? violationTypes.slice((typesPage - 1) * itemsPerPage, typesPage * itemsPerPage).map(t => (
                    <tr key={t.violationTypeId}>
                      <td><strong>{t.name}</strong></td>
                      <td><span style={{ color: 'var(--text-muted)' }}>{t.description}</span></td>
                      <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{t.defaultFine.toLocaleString('vi-VN')} ₫</strong></td>
                      <td>
                        <span className={t.isActive ? 'badge badge-success' : 'badge badge-neutral'}>
                          {t.isActive ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Chỉnh sửa" onClick={() => { setSelectedItem(t); setTypeForm({ name: t.name, description: t.description, defaultFine: t.defaultFine, isActive: t.isActive }); setActiveModal('type'); }}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Xóa" style={{ color: 'var(--danger)' }} onClick={() => { setSelectedItem(t); setActiveModal('confirm_delete'); }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5}><div className="empty-state"><p className="empty-state-title">Chưa có loại vi phạm nào</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {violationTypes.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((typesPage - 1) * itemsPerPage) + 1} - {Math.min(typesPage * itemsPerPage, violationTypes.length)} trong tổng số {violationTypes.length} loại vi phạm
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setTypesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={typesPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.ceil(violationTypes.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${typesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTypesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setTypesPage(prev => Math.min(prev + 1, Math.ceil(violationTypes.length / itemsPerPage)))} 
                      disabled={typesPage === Math.ceil(violationTypes.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Violation Details */}
      {activeModal === 'details' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Chi tiết Biên bản — VIO-{selectedItem.violationId}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {selectedItem.imageUrl && (
                <img src={selectedItem.imageUrl} alt="Ảnh minh chứng" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13.5, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Gian hàng: </span><strong>{selectedItem.stallCode}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Ngày lập: </span>{selectedItem.createdAt ? formatDate(selectedItem.createdAt) : (selectedItem.date || '—')}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Loại vi phạm: </span><strong>{selectedItem.violationTypeName || selectedItem.violationType?.name || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Người lập: </span><strong>{selectedItem.createdByName || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Ngày thông báo: </span>{formatDate(selectedItem.notifiedAt)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Ngày cập nhật: </span>{formatDate(selectedItem.updatedAt)}</div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Trạng thái: </span><span className={getStatusBadge(selectedItem.status).cls}>{getStatusBadge(selectedItem.status).label}</span></div>
              </div>
              <div>
                <label className="form-label">Hành vi vi phạm</label>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-title)' }}>{selectedItem.title}</p>
              </div>
              <div>
                <label className="form-label">Mô tả chi tiết</label>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedItem.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Tiền phạt:</span>
                <strong style={{ color: 'var(--danger)', fontSize: 18 }}>{(selectedItem.fineAmount || selectedItem.penalty).toLocaleString('vi-VN')} ₫</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Type */}
      {activeModal === 'type' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selectedItem ? 'Chỉnh sửa' : 'Thêm'} Loại Vi Phạm</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleTypeSubmit}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Tên loại vi phạm</label>
                  <input type="text" className="form-input" required value={typeForm.name}
                    placeholder="Ví dụ: Lấn chiếm hành lang..." onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Tiền phạt mặc định (VNĐ)</label>
                  <input type="number" className="form-input" required value={typeForm.defaultFine}
                    onChange={e => setTypeForm({ ...typeForm, defaultFine: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="form-label">Mô tả ý nghĩa</label>
                  <textarea className="form-textarea" rows={3} value={typeForm.description}
                    onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {activeModal === 'confirm_delete' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Xác nhận xóa</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <AlertTriangle size={16} className="alert-icon" />
                <span>Bạn sắp xóa loại vi phạm <strong>"{selectedItem.name}"</strong>. Hành động này không thể hoàn tác.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={deleteViolationType}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

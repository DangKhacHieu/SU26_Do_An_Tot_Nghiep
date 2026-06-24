import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit3, Trash2, AlertTriangle,
  RefreshCw, Wrench, History, X, AlertCircle,
  CheckCircle, FileText
} from 'lucide-react';

const getCategoryBadge = (name) => {
  const n = name.toLowerCase();
  if (n.includes('điện') || n.includes('bóng đèn') || n.includes('led') || n.includes('ổ cắm')) return { cls: 'badge badge-warning', label: 'Điện' };
  if (n.includes('nước') || n.includes('vòi') || n.includes('ống') || n.includes('thoát')) return { cls: 'badge badge-info', label: 'Nước' };
  return { cls: 'badge badge-neutral', label: 'Xây dựng' };
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

export default function RepairPrice() {
  const [activeTab, setActiveTab] = useState('prices');
  const [searchTerm, setSearchTerm] = useState('');
  const [repairItems, setRepairItems] = useState([]);
  const [usedTools, setUsedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [notification, setNotification] = useState(null);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formState, setFormState] = useState({ itemName: '', unit: 'Cái', price: 0, description: '', isActive: true });

  const [pricesPage, setPricesPage] = useState(1);
  const [usedPage, setUsedPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setPricesPage(1);
    setUsedPage(1);
  }, [searchTerm, activeTab]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = () => {
    setLoading(true); setIsMock(false);
    Promise.all([
      fetch('http://localhost:5056/api/accountant/repair-prices').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('http://localhost:5056/api/accountant/repair-prices/used-tools').then(r => { if (!r.ok) throw new Error(); return r.json(); })
    ])
      .then(([prices, used]) => { setRepairItems(prices); setUsedTools(used); setLoading(false); })
      .catch(() => {
        setTimeout(() => { setRepairItems(getMockPrices()); setUsedTools(getMockUsedTools()); setIsMock(true); setLoading(false); }, 500);
      });
  };

  useEffect(() => { loadData(); }, []);

  const getMockPrices = () => [
    { repairPriceId: 1, itemName: 'Thay thế bóng đèn LED 1.2m', unit: 'Cái', price: 150000, description: 'Đã bao gồm bóng đèn và công thay thế của thợ kỹ thuật.', isActive: true, usageCount: 15 },
    { repairPriceId: 2, itemName: 'Sửa chữa vòi nước rò rỉ', unit: 'Lần', price: 80000, description: 'Chưa bao gồm vật tư phụ nếu phải thay thế đường ống lớn.', isActive: true, usageCount: 8 },
    { repairPriceId: 3, itemName: 'Lắp đặt lại ổ cắm điện âm tường', unit: 'Cái', price: 120000, description: 'Bao gồm ổ cắm tiêu chuẩn Panasonic.', isActive: true, usageCount: 4 },
    { repairPriceId: 4, itemName: 'Sửa ổ khóa cửa kính thủy lực', unit: 'Cái', price: 350000, description: 'Bảo hành sửa chữa trong vòng 3 tháng.', isActive: true, usageCount: 1 },
    { repairPriceId: 5, itemName: 'Thông tắc đường ống thoát nước thải', unit: 'Mét', price: 100000, description: 'Tính theo mét dài thực tế thi công.', isActive: false, usageCount: 0 },
  ];

  const getMockUsedTools = () => [
    { id: 101, taskId: 12, taskTitle: 'Sửa đường điện Kiosk A-10', assignedToStaff: 'Nguyễn Văn Hùng (Kỹ thuật)', repairPriceId: 1, itemName: 'Thay thế bóng đèn LED 1.2m', quantity: 2, unit: 'Cái', unitPrice: 150000, amount: 300000, usedDate: '2026-06-03T10:30:00Z' },
    { id: 102, taskId: 15, taskTitle: 'Khắc phục rò rỉ nước Kiosk B-02', assignedToStaff: 'Trần Minh Hải (Kỹ thuật)', repairPriceId: 2, itemName: 'Sửa chữa vòi nước rò rỉ', quantity: 1, unit: 'Lần', unitPrice: 80000, amount: 80000, usedDate: '2026-06-02T14:15:00Z' },
    { id: 103, taskId: 12, taskTitle: 'Sửa đường điện Kiosk A-10', assignedToStaff: 'Nguyễn Văn Hùng (Kỹ thuật)', repairPriceId: 3, itemName: 'Lắp đặt lại ổ cắm điện âm tường', quantity: 1, unit: 'Cái', unitPrice: 120000, amount: 120000, usedDate: '2026-06-03T10:30:00Z' },
  ];

  const filteredPrices = repairItems.filter(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsed = usedTools.filter(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || i.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEdit = activeModal === 'edit';
    const url = isEdit ? `http://localhost:5056/api/accountant/repair-prices/${selectedItem.repairPriceId}` : 'http://localhost:5056/api/accountant/repair-prices';
    if (isMock) {
      if (isEdit) setRepairItems(p => p.map(i => i.repairPriceId === selectedItem.repairPriceId ? { ...i, ...formState } : i));
      else setRepairItems(p => [...p, { repairPriceId: Math.floor(Math.random() * 1000) + 10, ...formState, usageCount: 0 }]);
      showNotification('success', `${isEdit ? 'Cập nhật' : 'Thêm'} hạng mục thành công!`);
      setActiveModal(null);
    } else {
      fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formState) })
        .then(r => { if (!r.ok) throw new Error(); showNotification('success', `${isEdit ? 'Cập nhật' : 'Thêm'} hạng mục thành công!`); setActiveModal(null); loadData(); })
        .catch(() => showNotification('danger', 'Thao tác thất bại.'));
    }
  };

  const handleDelete = () => {
    if (isMock) {
      if (selectedItem.usageCount > 0) {
        setRepairItems(p => p.map(i => i.repairPriceId === selectedItem.repairPriceId ? { ...i, isActive: false } : i));
        showNotification('warning', 'Đã chuyển trạng thái sang "Ngừng hoạt động" vì hạng mục có lịch sử sử dụng.');
      } else {
        setRepairItems(p => p.filter(i => i.repairPriceId !== selectedItem.repairPriceId));
        showNotification('success', 'Đã xóa hạng mục sửa chữa!');
      }
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/repair-prices/${selectedItem.repairPriceId}`, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Xóa thành công!'); setActiveModal(null); loadData(); })
        .catch(() => showNotification('danger', 'Không thể xóa hạng mục.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Bảng Giá Sửa Chữa</h1>
          <p className="page-subtitle">Thiết lập đơn giá sửa chữa kỹ thuật và xem nhật ký vật tư đã cấp phát.</p>
        </div>
        <div className="page-actions">
          {activeTab === 'prices' && (
            <button className="btn btn-primary" onClick={() => { setSelectedItem(null); setFormState({ itemName: '', unit: 'Cái', price: 0, description: '', isActive: true }); setActiveModal('add'); }}>
              <Plus size={15} /> Thêm hạng mục
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
          <span><strong>Chế độ mô phỏng:</strong> Đang hiển thị dữ liệu mô phỏng.</span>
        </div>
      )}

      {/* Search */}
      <div className="card-padded" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <Search size={14} className="search-icon-inner" />
            <input type="text" className="search-input" style={{ width: '100%' }}
              placeholder="Tìm tên vật tư, hạng mục..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <span className="badge badge-neutral">{activeTab === 'prices' ? filteredPrices.length : filteredUsed.length} kết quả</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[{ id: 'prices', label: 'Danh mục Đơn giá', icon: Wrench }, { id: 'history', label: 'Vật tư Đã dùng', icon: History }].map(tab => {
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
          <p className="loading-text">Đang tải dữ liệu sửa chữa...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PRICES */}
          {activeTab === 'prices' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên Vật tư / Hạng mục</th>
                    <th>Danh mục</th>
                    <th>Đơn vị</th>
                    <th className="text-right">Đơn giá</th>
                    <th>Số lần dùng</th>
                    <th>Mô tả</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.length > 0 ? filteredPrices.slice((pricesPage - 1) * itemsPerPage, pricesPage * itemsPerPage).map(item => {
                    const catBadge = getCategoryBadge(item.itemName);
                    return (
                      <tr key={item.repairPriceId} style={{ opacity: item.isActive ? 1 : 0.55 }}>
                        <td><strong style={{ fontSize: 13.5 }}>{item.itemName}</strong></td>
                        <td><span className={catBadge.cls}>{catBadge.label}</span></td>
                        <td><span className="badge badge-neutral">{item.unit}</span></td>
                        <td className="text-right"><strong style={{ color: 'var(--primary)' }}>{item.price.toLocaleString('vi-VN')} ₫</strong></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.usageCount || 0} lần</span></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.description || '—'}</span></td>
                        <td>
                          <span className={item.isActive ? 'badge badge-success' : 'badge badge-neutral'}>
                            {item.isActive ? 'Hoạt động' : 'Ngừng'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setSelectedItem(item); setFormState({ itemName: item.itemName, unit: item.unit, price: item.price, description: item.description || '', isActive: item.isActive }); setActiveModal('edit'); }}>
                              <Edit3 size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => { setSelectedItem(item); setActiveModal('delete'); }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><Wrench size={24} /></div><p className="empty-state-title">Chưa có hạng mục nào</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredPrices.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((pricesPage - 1) * itemsPerPage) + 1} - {Math.min(pricesPage * itemsPerPage, filteredPrices.length)} trong tổng số {filteredPrices.length} hạng mục
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setPricesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={pricesPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.ceil(filteredPrices.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${pricesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPricesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setPricesPage(prev => Math.min(prev + 1, Math.ceil(filteredPrices.length / itemsPerPage)))} 
                      disabled={pricesPage === Math.ceil(filteredPrices.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USED TOOLS */}
          {activeTab === 'history' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Công việc sửa chữa</th>
                    <th>Nhân viên kỹ thuật</th>
                    <th>Vật tư sử dụng</th>
                    <th className="text-right">Số lượng</th>
                    <th className="text-right">Đơn giá</th>
                    <th className="text-right">Thành tiền</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsed.length > 0 ? filteredUsed.slice((usedPage - 1) * itemsPerPage, usedPage * itemsPerPage).map(tool => (
                    <tr key={tool.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-muted)' }}>#{tool.id}</span></td>
                      <td><strong style={{ fontSize: 13 }}>{tool.taskTitle}</strong></td>
                      <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tool.assignedToStaff}</span></td>
                      <td><span className="badge badge-primary">{tool.itemName}</span></td>
                      <td className="text-right">{tool.quantity} {tool.unit}</td>
                      <td className="text-right">{tool.unitPrice.toLocaleString('vi-VN')} ₫</td>
                      <td className="text-right"><strong style={{ color: 'var(--primary)' }}>{tool.amount.toLocaleString('vi-VN')} ₫</strong></td>
                      <td><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(tool.usedDate)}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><History size={24} /></div><p className="empty-state-title">Chưa có nhật ký vật tư</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredUsed.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((usedPage - 1) * itemsPerPage) + 1} - {Math.min(usedPage * itemsPerPage, filteredUsed.length)} trong tổng số {filteredUsed.length} lượt cấp phát
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setUsedPage(prev => Math.max(prev - 1, 1))} 
                      disabled={usedPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.ceil(filteredUsed.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${usedPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setUsedPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setUsedPage(prev => Math.min(prev + 1, Math.ceil(filteredUsed.length / itemsPerPage)))} 
                      disabled={usedPage === Math.ceil(filteredUsed.length / itemsPerPage)}
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

      {/* Modal: Add/Edit */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{activeModal === 'edit' ? 'Chỉnh sửa' : 'Thêm'} Hạng mục Sửa chữa</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Tên vật tư / Hạng mục</label>
                  <input type="text" className="form-input" required
                    placeholder="Ví dụ: Thay thế bóng đèn LED 1.2m..."
                    value={formState.itemName} onChange={e => setFormState({ ...formState, itemName: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Đơn vị tính</label>
                    <select className="form-select" value={formState.unit} onChange={e => setFormState({ ...formState, unit: e.target.value })}>
                      {['Cái', 'Lần', 'Mét', 'Kg', 'Bộ', 'Thùng', 'm²'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Đơn giá (VNĐ)</label>
                    <input type="number" className="form-input" required min={0}
                      value={formState.price} onChange={e => setFormState({ ...formState, price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea className="form-textarea" rows={3}
                    placeholder="Ghi chú về phạm vi bao gồm, điều kiện bảo hành..."
                    value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="isActive-check" checked={formState.isActive} onChange={e => setFormState({ ...formState, isActive: e.target.checked })} />
                  <label htmlFor="isActive-check" style={{ fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Đang áp dụng</label>
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

      {/* Modal: Delete Confirm */}
      {activeModal === 'delete' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Xác nhận xóa</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <AlertTriangle size={16} className="alert-icon" />
                <div>
                  <p>Bạn sắp xóa hạng mục <strong>"{selectedItem.itemName}"</strong>.</p>
                  {selectedItem.usageCount > 0 && (
                    <p style={{ marginTop: 6, fontSize: 13 }}>Hạng mục đã được sử dụng <strong>{selectedItem.usageCount} lần</strong>. Hệ thống sẽ chuyển sang trạng thái "Ngừng hoạt động" thay vì xóa hẳn.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDelete}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

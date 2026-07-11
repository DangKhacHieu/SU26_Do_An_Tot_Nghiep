
import React, { useState, useEffect } from 'react';
import { TASK_STATUS } from '../../../constants/taskEnums';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

export default function QuotationPanel({ taskId, baseUrl, taskStatus, initialMaterials, onRefreshTask, onShowNotification }) {
  const isEditMode = taskStatus === TASK_STATUS.PENDING;
  
  // States for Edit Mode
  const [quotation, setQuotation] = useState({ materials: initialMaterials || [], totalAmount: 0 });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customUnitPrice, setCustomUnitPrice] = useState('');
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [submittingQuotation, setSubmittingQuotation] = useState(false);

  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    type: 'primary', 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  // Fetch quotation from backend in Edit Mode
  const fetchQuotation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/quotation`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error('Failed to load material quotation details.');
      }
      const data = await response.json();
      setQuotation({
        materials: data.materials || [],
        totalAmount: data.totalAmount || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch repair prices catalog in Edit Mode
  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/repair-prices`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCatalog(data);
      }
    } catch (err) {
      console.error('Error loading material catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchQuotation();
      fetchCatalog();
    } else {
      // In read-only mode, we calculate total amount based on task.materials
      const total = (initialMaterials || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      setQuotation({
        materials: initialMaterials || [],
        totalAmount: total
      });
    }
  }, [taskId, taskStatus, initialMaterials]);

  const selectedCatalogItem = catalog.find(
    (item) => item.repairPriceId === parseInt(selectedCatalogId)
  );
  
  const isCustomPriceRequired = selectedCatalogItem && selectedCatalogItem.price === 0;

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!selectedCatalogId) {
      onShowNotification('Please select a material from the catalog.', 'error');
      return;
    }
    if (quantity <= 0) {
      onShowNotification('Quantity must be greater than 0.', 'error');
      return;
    }
    if (isCustomPriceRequired && (!customUnitPrice || parseFloat(customUnitPrice) <= 0)) {
      onShowNotification('Please enter a valid unit price for the custom item.', 'error');
      return;
    }

    setSubmittingMaterial(true);
    try {
      const body = {
        repairPriceId: parseInt(selectedCatalogId),
        quantity: parseFloat(quantity),
        customUnitPrice: isCustomPriceRequired ? parseFloat(customUnitPrice) : null
      };

      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/quotation`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error adding material.');
      }

      // Refresh list
      await fetchQuotation();
      // Reset form
      setSelectedCatalogId('');
      setQuantity(1);
      setCustomUnitPrice('');
      onShowNotification('Material added successfully.', 'success');
    } catch (err) {
      onShowNotification(err.message, 'error');
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const executeRemoveMaterial = async (materialId) => {
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/quotation/${materialId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error removing material.');
      }

      await fetchQuotation();
      onShowNotification('Material removed successfully.', 'success');
    } catch (err) {
      onShowNotification(err.message, 'error');
    }
  };

  const handleRemoveMaterial = (materialId) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Xác nhận xóa vật tư',
      message: 'Bạn có chắc chắn muốn xóa vật tư này khỏi bảng báo giá không?',
      onConfirm: () => executeRemoveMaterial(materialId)
    });
  };

  const executeSubmitQuotation = async () => {
    setSubmittingQuotation(true);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/submit-quotation`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Error submitting quotation for approval.');
      }

      onShowNotification('Quotation has been submitted for approval successfully!', 'success');
      onRefreshTask(); // Reload the whole task details to show read-only mode and status update
    } catch (err) {
      onShowNotification(err.message, 'error');
    } finally {
      setSubmittingQuotation(false);
    }
  };

  const handleSubmitQuotation = () => {
    if (quotation.materials.length === 0) {
      onShowNotification('The quotation must contain at least one material item before submission.', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'primary',
      title: 'Gửi duyệt báo giá',
      message: 'Báo giá sẽ được gửi cho Manager xác định bên chịu phí. Sau khi gửi, danh sách vật tư sẽ tạm khóa cho đến khi có quyết định.',
      onConfirm: executeSubmitQuotation
    });
  };

  const formatVnd = (amount) => {
    if (amount === undefined || amount === null) return '0 VND';
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  return (
    <div className="quotation-panel">
      <div className="panel-header-with-action">
        <h3 className="card-section-title">🔧 Repair Materials & Parts Quotation</h3>
      </div>

      {/* Submit button — only when materials exist */}
      {isEditMode && quotation.materials.length > 0 && (
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <button 
            type="button" 
            onClick={handleSubmitQuotation} 
            disabled={submittingQuotation}
            className="btn-primary-dark submit-quotation-btn"
          >
            {submittingQuotation ? 'Sending...' : '🚀 Submit for Approval'}
          </button>
        </div>
      )}

      {isEditMode && (
        <form onSubmit={handleAddMaterial} className="add-material-form">
          <div className="add-material-grid">
            <div className="form-group">
              <label className="form-label required-field">Select Material</label>
              <select 
                value={selectedCatalogId} 
                onChange={(e) => {
                  setSelectedCatalogId(e.target.value);
                  setCustomUnitPrice('');
                }}
                disabled={catalogLoading || submittingMaterial}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="">-- Select from Material Catalog --</option>
                {catalog.map(item => (
                  <option key={item.repairPriceId} value={item.repairPriceId}>
                    {item.itemName} ({item.unit}) - {item.price > 0 ? formatVnd(item.price) : 'Custom Price'}
                  </option>
                ))}
              </select>
            </div>

            <div className="add-material-subrow">
              <div className="form-group quantity-group">
                <label className="form-label required-field">Quantity</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={submittingMaterial}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              {isCustomPriceRequired && (
                <div className="form-group custom-price-group">
                  <label className="form-label required-field">Custom Unit Price (VND)</label>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="Enter price..."
                    value={customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value)}
                    disabled={submittingMaterial}
                    className="form-input highlighted-input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={submittingMaterial} 
                className="btn-add-material-submit"
              >
                {submittingMaterial ? 'Adding...' : '➕ Add Material'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-state-inline">Loading quotation...</div>
      ) : error ? (
        <div className="error-alert">Error: {error}</div>
      ) : (
        <div className="materials-table-wrapper">
          <table className="materials-table">
            <thead>
              <tr>
                <th>Material / Part Name</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                {isEditMode && <th style={{ textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {quotation.materials.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 5 : 4} className="empty-table-cell">
                    No materials recorded yet. {isEditMode && 'Please select a material above to add.'}
                  </td>
                </tr>
              ) : (
                <>
                  {quotation.materials.map((item) => (
                    <tr key={item.id}>
                      <td className="material-name-cell">{item.itemName}</td>
                      <td style={{ textAlign: 'right' }} className="font-monospace">{item.quantity}</td>
                      <td style={{ textAlign: 'right' }} className="font-monospace">{formatVnd(item.unitPrice)}</td>
                      <td style={{ textAlign: 'right' }} className="font-monospace amount-cell">{formatVnd(item.amount)}</td>
                      {isEditMode && (
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMaterial(item.id)}
                            className="btn-delete-item"
                            title="Delete line item"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2} style={{ fontWeight: 'bold' }}>TOTAL AMOUNT</td>
                    <td colSpan={isEditMode ? 2 : 2} style={{ textAlign: 'right' }} className="font-monospace total-amount-cell">
                      {formatVnd(quotation.totalAmount)}
                    </td>
                    {isEditMode && <td></td>}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="custom-confirm-overlay">
          <div className="custom-confirm-modal">
            <div className="custom-confirm-header">
              <h4>{confirmModal.title}</h4>
            </div>
            <div className="custom-confirm-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="custom-confirm-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                HỦY
              </button>
              <button 
                type="button" 
                className="btn-primary-dark" 
                style={{ 
                  backgroundColor: confirmModal.type === 'danger' ? '#ef4444' : 'var(--primary-color)',
                  borderColor: confirmModal.type === 'danger' ? '#ef4444' : 'var(--primary-color)',
                  padding: '8px 16px',
                  fontSize: '13px'
                }}
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

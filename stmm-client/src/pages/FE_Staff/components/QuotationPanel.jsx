
import { useState, useEffect, useCallback } from 'react';
import { TASK_STATUS } from '../../../constants/taskEnums';
import readProblemDetail from '../../../utils/readProblemDetail';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

export default function QuotationPanel({ taskId, baseUrl, taskStatus, initialMaterials, onRefreshTask, onShowNotification }) {
  const isEditMode = taskStatus === TASK_STATUS.PENDING;
  
  const [quotation, setQuotation] = useState({ materials: initialMaterials || [], totalAmount: 0 });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customUnitPrice, setCustomUnitPrice] = useState('');
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [submittingQuotation, setSubmittingQuotation] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    type: 'primary', 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const fetchQuotation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/quotation`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, 'Unable to load quotation details.'));
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
  }, [baseUrl, taskId]);

  const fetchCatalog = useCallback(async () => {
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
  }, [baseUrl]);

  useEffect(() => {
    if (isEditMode) {
      fetchQuotation();
      fetchCatalog();
    } else {
      const total = (initialMaterials || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      setQuotation({
        materials: initialMaterials || [],
        totalAmount: total
      });
    }
  }, [fetchCatalog, fetchQuotation, initialMaterials, isEditMode]);

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
        throw new Error(await readProblemDetail(response, 'Unable to add material.'));
      }

      await fetchQuotation();
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
        throw new Error(await readProblemDetail(response, 'Unable to remove material.'));
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
      title: 'Remove material',
      message: 'Remove this material from the quotation?',
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
        throw new Error(await readProblemDetail(response, 'Unable to submit quotation for approval.'));
      }

      onShowNotification('Quotation has been submitted for approval successfully!', 'success');
      onRefreshTask();
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
      title: 'Submit quotation',
      message: 'The quotation will be sent to the Manager to determine who pays. Materials will be locked until a decision is made.',
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
                CANCEL
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
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

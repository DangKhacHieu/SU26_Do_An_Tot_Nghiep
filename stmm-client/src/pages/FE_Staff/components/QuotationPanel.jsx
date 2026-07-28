import { useTranslation } from 'react-i18next';

import { useState, useEffect, useCallback } from 'react';
import { TASK_STATUS } from '../../../constants/taskEnums';
import readProblemDetail from '../../../utils/readProblemDetail';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem(t('quotationpanel.accesstoken'))}`
});

export default function QuotationPanel({ taskId, baseUrl, taskStatus, initialMaterials, onRefreshTask, onShowNotification }) {
  const { t } = useTranslation();

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
        throw new Error(await readProblemDetail(response, t('quotationpanel.unable_to_load_quotation')));
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
      console.error(t('quotationpanel.error_loading_material_catalog'), err);
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
      onShowNotification(t('quotationpanel.quantity_must_be_greater'), t('quotationpanel.error'));
      return;
    }
    if (isCustomPriceRequired && (!customUnitPrice || parseFloat(customUnitPrice) <= 0)) {
      onShowNotification(t('quotationpanel.please_enter_a_valid'), t('quotationpanel.error'));
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
        method: t('quotationpanel.post'),
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('quotationpanel.unable_to_add_material')));
      }

      await fetchQuotation();
      setSelectedCatalogId('');
      setQuantity(1);
      setCustomUnitPrice('');
      onShowNotification(t('quotationpanel.material_added_successfully'), t('quotationpanel.success'));
    } catch (err) {
      onShowNotification(err.message, t('quotationpanel.error'));
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const executeRemoveMaterial = async (materialId) => {
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/quotation/${materialId}`, {
        method: t('quotationpanel.delete'),
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('quotationpanel.unable_to_remove_material')));
      }

      await fetchQuotation();
      onShowNotification(t('quotationpanel.material_removed_successfully'), t('quotationpanel.success'));
    } catch (err) {
      onShowNotification(err.message, t('quotationpanel.error'));
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
        method: t('quotationpanel.patch'),
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('quotationpanel.unable_to_submit_quotation')));
      }

      onShowNotification(t('quotationpanel.quotation_has_been_submitted'), t('quotationpanel.success'));
      onRefreshTask();
    } catch (err) {
      onShowNotification(err.message, t('quotationpanel.error'));
    } finally {
      setSubmittingQuotation(false);
    }
  };

  const handleSubmitQuotation = () => {
    if (quotation.materials.length === 0) {
      onShowNotification(t('quotationpanel.the_quotation_must_contain'), t('quotationpanel.error'));
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'primary',
      title: 'Submit quotation',
      message: t('quotationpanel.the_quotation_will_be'),
      onConfirm: executeSubmitQuotation
    });
  };

  const formatVnd = (amount) => {
    if (amount === undefined || amount === null) return '0 VND';
    return amount.toLocaleString(t('quotationpanel.vivn')) + ' VND';
  };

  return (
    <div className="quotation-panel">
      <div className="panel-header-with-action">
        <h3 className="card-section-title">🔧 Repair Materials & Parts Quotation</h3>
      </div>

      {isEditMode && quotation.materials.length > 0 && (
        <div style={{ marginBottom: '16px', textAlign: t('quotationpanel.right') }}>
          <button 
            type="button" 
            onClick={handleSubmitQuotation} 
            disabled={submittingQuotation}
            className="btn-primary-dark submit-quotation-btn"
          >
            {submittingQuotation ? t('quotationpanel.sending') : '🚀 Submit for Approval'}
          </button>
        </div>
      )}

      {isEditMode && (
        <form onSubmit={handleAddMaterial} className="add-material-form">
          <div className="add-material-grid">
            <div className="form-group">
              <label className="form-label required-field">{t('quotationpanel.select_material')}</label>
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
                    {item.itemName} ({item.unit}) - {item.price > 0 ? formatVnd(item.price) : t('quotationpanel.custom_price')}
                  </option>
                ))}
              </select>
            </div>

            <div className="add-material-subrow">
              <div className="form-group quantity-group">
                <label className="form-label required-field">{t('quotationpanel.quantity')}</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step={t('quotationpanel.any')}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={submittingMaterial}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              {isCustomPriceRequired && (
                <div className="form-group custom-price-group">
                  <label className="form-label required-field">{t('quotationpanel.custom_unit_price_vnd')}</label>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder={t('quotationpanel.enter_price')}
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
                {submittingMaterial ? t('quotationpanel.adding') : '➕ Add Material'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-state-inline">{t('quotationpanel.loading_quotation')}</div>
      ) : error ? (
        <div className="error-alert">Error: {error}</div>
      ) : (
        <div className="materials-table-wrapper">
          <table className="materials-table">
            <thead>
              <tr>
                <th>{t('quotationpanel.material_part_name')}</th>
                <th style={{ textAlign: 'right' }}>{t('quotationpanel.quantity')}</th>
                <th style={{ textAlign: 'right' }}>{t('quotationpanel.unit_price')}</th>
                <th style={{ textAlign: 'right' }}>{t('quotationpanel.amount')}</th>
                {isEditMode && <th style={{ textAlign: 'center' }}>{t('quotationpanel.action')}</th>}
              </tr>
            </thead>
            <tbody>
              {quotation.materials.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 5 : 4} className="empty-table-cell">
                    No materials recorded yet. {isEditMode && t('quotationpanel.please_select_a_material')}
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
                            title={t('quotationpanel.delete_line_item')}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2} style={{ fontWeight: 'bold' }}>{t('quotationpanel.total_amount')}</td>
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
                {t('quotationpanel.cancel')}</button>
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
                {t('quotationpanel.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

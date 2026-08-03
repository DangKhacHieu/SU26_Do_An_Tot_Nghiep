import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import './RecordMeterReadingModal.css';

import { showToast } from '../../utils/alert';

export default function RecordMeterReadingModal({ stallId, baseUrl, onClose, onSuccess }) {
  const { t } = useTranslation();

  const [meters, setMeters] = useState([]);
  const [meterId, setMeterId] = useState('');
  const [selectedMeter, setSelectedMeter] = useState(null);
  
  const [newValue, setNewValue] = useState('');
  const [recordedAt, setRecordedAt] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const [loading, setLoading] = useState(false);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchMeters = async () => {
      setLoadingMeters(true);
      try {
        const response = await fetch(`${baseUrl}/api/meters/stall/${stallId}`, { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setMeters(data);
        } else {
          setSubmitError(await readProblemDetail(response, t('recordmeterreadingmodal.unable_to_load_meters')));
        }
      } catch (err) {
        console.error(t('recordmeterreadingmodal.error_loading_meters'), err);
      } finally {
        setLoadingMeters(false);
      }
    };

    fetchMeters();
  }, [stallId, baseUrl, t]);

  const handleMeterChange = (e) => {
    const id = e.target.value;
    setMeterId(id);
    setFormErrors((prev) => ({ ...prev, meterId: null }));
    if (id) {
      const meterObj = meters.find(m => m.meterId === parseInt(id));
      setSelectedMeter(meterObj || null);
    } else {
      setSelectedMeter(null);
    }
  };

  const selectImageFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t('recordmeterreadingmodal.file_size_must_not'));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError(t('recordmeterreadingmodal.only_image_files_are'));
      return;
    }

    setImageError(null);
    setFormErrors((prev) => ({ ...prev, imageUrl: null }));
    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectImageFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const validateForm = () => {
    const errors = {};
    if (!meterId) {
      errors.meterId = 'Vui lòng chọn đồng hồ đo.';
    }

    const numVal = Number(newValue);
    if (newValue === '' || isNaN(numVal) || numVal < 0) {
      errors.newValue = 'Chỉ số mới không được âm và phải là số hợp lệ.';
    } else if (!Number.isInteger(numVal)) {
      errors.newValue = 'Chỉ số mới phải là số nguyên (không chứa số thập phân).';
    } else if (numVal > 999999) {
      errors.newValue = 'Chỉ số mới không được vượt quá 999,999.';
    } else if (selectedMeter && selectedMeter.lastReadingValue !== null && numVal < selectedMeter.lastReadingValue) {
      errors.newValue = `Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ (${selectedMeter.lastReadingValue}).`;
    }

    if (!recordedAt) {
      errors.recordedAt = 'Vui lòng chọn ngày ghi nhận hợp lệ.';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(recordedAt)) {
        errors.recordedAt = 'Ngày ghi nhận phải đúng định dạng YYYY-MM-DD.';
      }
    }

    if (!selectedFile) {
      errors.imageUrl = 'Vui lòng chụp ảnh mặt đồng hồ làm bằng chứng.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSubmitError(null);

    if (!validateForm()) {
      setSubmitError('Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ bên dưới.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('meterId', meterId);
      formData.append('newValue', newValue);
      formData.append('recordedAt', recordedAt);
      formData.append('image', selectedFile);

      const response = await fetch(`${baseUrl}/api/meter-readings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('recordmeterreadingmodal.unable_to_save_meter')));
      }

      const result = await response.json();
      showToast(t('recordmeterreadingmodal.save_reading_success', 'Ghi nhận chỉ số thành công!'), 'success');
      onSuccess(result);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">⚡ {t('recordmeterreadingmodal.record_meter_reading')}</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>{t('recordmeterreadingmodal.error')}</strong> {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label required-field">{t('recordmeterreadingmodal.select_utility_meter')}</label>
            <select
              value={meterId}
              onChange={handleMeterChange}
              className={`form-input ${formErrors.meterId ? 'error-border' : ''}`}
              disabled={loadingMeters}
            >
              <option value="">{t('recordmeterreadingmodal.choose_meter')}</option>
              {meters.map(m => (
                <option key={m.meterId} value={m.meterId}>
                  {m.type === 'Electricity' ? '⚡ Electricity' : '💧 Water'} - Serial: {m.serialNumber}
                </option>
              ))}
            </select>
            {loadingMeters && <span className="helper-text">{t('recordmeterreadingmodal.loading_meters')}</span>}
            {formErrors.meterId && <span className="error-text">{formErrors.meterId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">{t('recordmeterreadingmodal.previous_reading_value_readonly')}</label>
            <input
              type="text"
              value={selectedMeter && selectedMeter.lastReadingValue !== null ? selectedMeter.lastReadingValue : '0 (No previous readings found)'}
              disabled
              className="form-input"
              style={{ backgroundColor: '#f5f5f5', color: '#666', fontWeight: 'bold' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label required-field">{t('recordmeterreadingmodal.new_reading_value')}</label>
            <input
              type="number"
              min="0"
              max="999999"
              step="1"
              onKeyDown={(e) => {
                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder={t('recordmeterreadingmodal.enter_current_meter_digit')}
              value={newValue}
              onChange={(e) => {
                setNewValue(e.target.value);
                setFormErrors((prev) => ({ ...prev, newValue: null }));
              }}
              className={`form-input ${formErrors.newValue ? 'error-border' : ''}`}
            />
            {formErrors.newValue && <span className="error-text">{formErrors.newValue}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field">{t('recordmeterreadingmodal.recorded_date')}</label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => {
                setRecordedAt(e.target.value);
                setFormErrors((prev) => ({ ...prev, recordedAt: null }));
              }}
              className={`form-input ${formErrors.recordedAt ? 'error-border' : ''}`}
            />
            {formErrors.recordedAt && <span className="error-text">{formErrors.recordedAt}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field">{t('recordmeterreadingmodal.photo_of_meter_face')}</label>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'disabled' : ''} ${formErrors.imageUrl ? 'error-border' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={!selectedFile && !loading ? onButtonClick : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {selectedFile ? (
                  <p>{t('recordmeterreadingmodal.image_uploaded_remove_the')}</p>
                ) : (
                  <p>{t('recordmeterreadingmodal.drag_and_drop_image')}<strong style={{ color: '#4f46e5' }}>{t('recordmeterreadingmodal.click_to_select')}</strong></p>
                )}
                <span className="helper-text">{t('recordmeterreadingmodal.supports_jpg_png_webp')}</span>
              </div>
            </div>

            {imageError && <div className="error-text">{t('recordmeterreadingmodal.upload_error')}: {imageError}</div>}
            {formErrors.imageUrl && <span className="error-text">{formErrors.imageUrl}</span>}

            {selectedFile && previewUrl && (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={previewUrl} alt={t('recordmeterreadingmodal.meter_evidence_preview')} className="preview-image-thumb" />
                  <button 
                    type="button" 
                    className="preview-image-remove"
                    onClick={removeImage}
                    title={t('recordmeterreadingmodal.remove_image')}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              {t('recordmeterreadingmodal.cancel')}</button>
            <button 
              type="submit" 
              className="btn-primary-dark"
              disabled={loading}
            >
              {loading ? t('recordmeterreadingmodal.saving') : t('recordmeterreadingmodal.save_reading')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

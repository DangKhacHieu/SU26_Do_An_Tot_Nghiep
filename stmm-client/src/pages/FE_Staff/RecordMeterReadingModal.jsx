import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import { showToast } from '../../utils/alert';
import './RecordMeterReadingModal.css';

export default function RecordMeterReadingModal({
  stallId,
  baseUrl,
  onClose,
  onSuccess,
  hasElectricityReadingThisMonth = false,
  hasWaterReadingThisMonth = false,
  taskCreatedAt = null
}) {
  const { t } = useTranslation();

  const [meters, setMeters] = useState([]);
  const [meterId, setMeterId] = useState('');
  const [selectedMeter, setSelectedMeter] = useState(null);
  
  const [newValue, setNewValue] = useState('');

  const maxDateStr = (() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const minDateStr = (() => {
    if (taskCreatedAt) {
      const dateObj = new Date(taskCreatedAt);
      if (!Number.isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}-01`;
  })();

  const [recordedAt, setRecordedAt] = useState(maxDateStr);
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
          const availableMeters = (Array.isArray(data) ? data : []).filter((meter) => {
            if (meter.type === 'Electricity') return !hasElectricityReadingThisMonth;
            if (meter.type === 'Water') return !hasWaterReadingThisMonth;
            return true;
          });

          setMeters(availableMeters);

          // When only one utility type remains, select it automatically so the
          // staff member cannot accidentally submit the type already recorded.
          if (availableMeters.length === 1) {
            setMeterId(String(availableMeters[0].meterId));
            setSelectedMeter(availableMeters[0]);
          }
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
  }, [baseUrl, hasElectricityReadingThisMonth, hasWaterReadingThisMonth, stallId, t]);

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
      errors.meterId = 'Please select a meter.';
    }

    const numVal = Number(newValue);
    if (newValue === '' || isNaN(numVal) || numVal < 0) {
      errors.newValue = 'New reading value cannot be negative and must be a valid number.';
    } else if (!Number.isInteger(numVal)) {
      errors.newValue = 'New reading value must be an integer (no decimals).';
    } else if (numVal > 999999) {
      errors.newValue = 'New reading value cannot exceed 999,999.';
    } else if (selectedMeter && selectedMeter.lastReadingValue !== null && numVal < selectedMeter.lastReadingValue) {
      errors.newValue = `New reading value must be greater than or equal to previous reading (${selectedMeter.lastReadingValue}).`;
    }

    if (!recordedAt) {
      errors.recordedAt = 'Please select a valid reading date.';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(recordedAt)) {
        errors.recordedAt = 'Reading date must be in YYYY-MM-DD format.';
      } else if (recordedAt > maxDateStr) {
        errors.recordedAt = t('recordmeterreadingmodal.future_date_not_allowed', { defaultValue: 'Reading date cannot exceed current date.' });
      } else if (minDateStr && recordedAt < minDateStr) {
        errors.recordedAt = t('recordmeterreadingmodal.date_before_created_not_allowed', { min: minDateStr, defaultValue: `Reading date cannot be before creation date (${minDateStr}).` });
      }
    }

    if (!selectedFile) {
      errors.imageUrl = 'Please capture/upload an image of the meter face.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSubmitError(null);

    if (!validateForm()) {
      setSubmitError(t('recordmeterreadingmodal.please_check_and_fix', 'Please check and correct the invalid fields below.'));
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
      showToast(t('recordmeterreadingmodal.save_reading_success', 'Meter reading saved successfully!'), 'success');
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
              min={minDateStr}
              max={maxDateStr}
              value={recordedAt}
              onChange={(e) => {
                setRecordedAt(e.target.value);
                setFormErrors((prev) => ({ ...prev, recordedAt: null }));
              }}
              className={`form-input ${formErrors.recordedAt ? 'error-border' : ''}`}
            />
            {minDateStr && maxDateStr ? (
              <span className="helper-text" style={{ color: '#475569', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                📅 {t('recordmeterreadingmodal.date_range_hint', { min: minDateStr, max: maxDateStr, defaultValue: `Only selection between ${minDateStr} and ${maxDateStr} (Today) is allowed.` })}
              </span>
            ) : null}
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
                  <p>{t('recordmeterreadingmodal.image_uploaded_remove_the', 'Proof image attached. Click to select another image.')}</p>
                ) : (
                  <p>{t('recordmeterreadingmodal.drag_and_drop_image', 'Drag and drop image here or ')}<strong style={{ color: '#4f46e5' }}>{t('recordmeterreadingmodal.click_to_select', 'click to select image')}</strong></p>
                )}
                <span className="helper-text">{t('recordmeterreadingmodal.supports_jpg_png_webp', 'Supports JPG, PNG or WEBP format (Max 5MB)')}</span>
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

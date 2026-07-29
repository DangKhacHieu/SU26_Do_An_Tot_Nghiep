import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import './RecordMeterReadingModal.css';

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
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
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
    if (id) {
      const meterObj = meters.find(m => m.meterId === parseInt(id));
      setSelectedMeter(meterObj || null);
    } else {
      setSelectedMeter(null);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t('recordmeterreadingmodal.file_size_must_not'));
      return;
    }

    setImageUploading(true);
    setImageError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('recordmeterreadingmodal.unable_to_upload_image')));
      }

      const result = await response.json();
      setImageUrl(result.imageUrl);
    } catch (err) {
      setImageError(err.message);
      setImageUrl('');
    } finally {
      setImageUploading(false);
    }
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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await uploadFile(file);
      } else {
        setImageError(t('recordmeterreadingmodal.only_image_files_are'));
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        await uploadFile(file);
      } else {
        setImageError(t('recordmeterreadingmodal.only_image_files_are'));
      }
    }
  };

  const removeImage = () => {
    setImageUrl('');
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const validateForm = () => {
    const errors = {};
    if (!meterId) {
      errors.meterId = t('recordmeterreadingmodal.please_select_a_utility');
    }

    if (newValue === '' || isNaN(Number(newValue)) || Number(newValue) < 0) {
      errors.newValue = t('recordmeterreadingmodal.invalid_new_value');
    } else if (selectedMeter && selectedMeter.lastReadingValue !== null && Number(newValue) < selectedMeter.lastReadingValue) {
      errors.newValue = t('recordmeterreadingmodal.new_value_must_be', { previousValue: selectedMeter.lastReadingValue });
    }

    if (!recordedAt) {
      errors.recordedAt = t('recordmeterreadingmodal.recorded_date_is_required');
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(recordedAt)) {
        errors.recordedAt = t('recordmeterreadingmodal.recorded_date_must_be');
      }
    }

    if (!imageUrl) {
      errors.imageUrl = t('recordmeterreadingmodal.an_evidence_photo_of');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setLoading(true);

    const requestData = {
      meterId: parseInt(meterId),
      newValue: parseFloat(newValue),
      recordedAt: recordedAt,
      imageUrl: imageUrl
    };

    try {
      const response = await fetch(`${baseUrl}/api/meter-readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('recordmeterreadingmodal.unable_to_save_meter')));
      }

      const result = await response.json();
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
              step="any"
              placeholder={t('recordmeterreadingmodal.enter_current_meter_digit')}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={`form-input ${formErrors.newValue ? 'error-border' : ''}`}
            />
            {formErrors.newValue && <span className="error-text">{formErrors.newValue}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field">{t('recordmeterreadingmodal.recorded_date')}</label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
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
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${imageUrl ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={!imageUrl ? onButtonClick : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {imageUrl ? (
                  <p>{t('recordmeterreadingmodal.image_uploaded_remove_the')}</p>
                ) : (
                  <p>{t('recordmeterreadingmodal.drag_and_drop_image')}<strong>{t('recordmeterreadingmodal.click_to_select')}</strong></p>
                )}
                <span className="helper-text">{t('recordmeterreadingmodal.supports_jpg_png_webp')}</span>
              </div>
            </div>

            {imageUploading && <div className="helper-text" style={{ color: '#0066cc' }}>{t('recordmeterreadingmodal.uploading_image_to_cloudinary')}</div>}
            {imageError && <div className="error-text">{t('recordmeterreadingmodal.upload_error')}: {imageError}</div>}
            {formErrors.imageUrl && <span className="error-text">{formErrors.imageUrl}</span>}

            {imageUrl && (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={imageUrl} alt={t('recordmeterreadingmodal.meter_evidence_preview')} className="preview-image-thumb" />
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
              disabled={loading || imageUploading}
            >
              {t('recordmeterreadingmodal.cancel')}</button>
            <button 
              type="submit" 
              className="btn-primary-dark"
              disabled={loading || imageUploading}
            >
              {loading ? t('recordmeterreadingmodal.saving') : t('recordmeterreadingmodal.save_reading')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import readProblemDetail from '../../utils/readProblemDetail';
import './RecordMeterReadingModal.css';

export default function RecordMeterReadingModal({ stallId, baseUrl, onClose, onSuccess }) {
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
  const [isReplaced, setIsReplaced] = useState(false);

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
        const response = await fetch(`${baseUrl}/api/meters/stall/${stallId}`);
        if (response.ok) {
          const data = await response.json();
          setMeters(data);
        } else {
          setSubmitError(await readProblemDetail(response, 'Unable to load meters for this stall.'));
        }
      } catch (err) {
        console.error("Error loading meters:", err);
      } finally {
        setLoadingMeters(false);
      }
    };

    fetchMeters();
  }, [stallId, baseUrl]);

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
      setImageError("File size must not exceed 5MB.");
      return;
    }

    setImageUploading(true);
    setImageError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, 'Unable to upload image.'));
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
        setImageError("Only image files are supported.");
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        await uploadFile(file);
      } else {
        setImageError("Only image files are supported.");
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
      errors.meterId = "Please select a utility meter.";
    }

    if (newValue === '' || isNaN(Number(newValue)) || Number(newValue) < 0) {
      errors.newValue = "New value must be a non-negative number.";
    } else if (!isReplaced && selectedMeter && selectedMeter.lastReadingValue !== null && Number(newValue) < selectedMeter.lastReadingValue) {
      errors.newValue = `New value must be greater than or equal to the previous value (${selectedMeter.lastReadingValue}).`;
    }

    if (!recordedAt) {
      errors.recordedAt = "Recorded Date is required.";
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(recordedAt)) {
        errors.recordedAt = "Recorded Date must be in YYYY-MM-DD format.";
      }
    }

    if (!imageUrl) {
      errors.imageUrl = "An evidence photo of the meter face is required.";
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
      imageUrl: imageUrl,
      isReplaced: isReplaced
    };

    try {
      const response = await fetch(`${baseUrl}/api/meter-readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, 'Unable to save meter reading.'));
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
          <h2 className="modal-title">⚡ Record Meter Reading</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label required-field">SELECT UTILITY METER</label>
            <select
              value={meterId}
              onChange={handleMeterChange}
              className={`form-input ${formErrors.meterId ? 'error-border' : ''}`}
              disabled={loadingMeters}
            >
              <option value="">Choose meter...</option>
              {meters.map(m => (
                <option key={m.meterId} value={m.meterId}>
                  {m.type === 'Electricity' ? '⚡ Electricity' : '💧 Water'} - Serial: {m.serialNumber}
                </option>
              ))}
            </select>
            {loadingMeters && <span className="helper-text">Loading meters...</span>}
            {formErrors.meterId && <span className="error-text">{formErrors.meterId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">PREVIOUS READING VALUE (READ-ONLY)</label>
            <input
              type="text"
              value={selectedMeter && selectedMeter.lastReadingValue !== null ? selectedMeter.lastReadingValue : '0 (No previous readings found)'}
              disabled
              className="form-input"
              style={{ backgroundColor: '#f5f5f5', color: '#666', fontWeight: 'bold' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label required-field">NEW READING VALUE</label>
            <input
              type="number"
              step="any"
              placeholder="Enter current meter digit value..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={`form-input ${formErrors.newValue ? 'error-border' : ''}`}
            />
            {formErrors.newValue && <span className="error-text">{formErrors.newValue}</span>}
          </div>

          <div className="form-group-checkbox">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={isReplaced}
                onChange={(e) => setIsReplaced(e.target.checked)}
              />
              <span className="checkbox-label">Meter was replaced (reset reading)</span>
            </label>
            <p className="helper-text-checkbox">
              Select this only when a physical meter was replaced and its reading restarted from zero.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label required-field">RECORDED DATE</label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className={`form-input ${formErrors.recordedAt ? 'error-border' : ''}`}
            />
            {formErrors.recordedAt && <span className="error-text">{formErrors.recordedAt}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field">PHOTO OF METER FACE (EVIDENCE)</label>
            
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
                  <p>Image uploaded. Remove the preview image to upload a new one.</p>
                ) : (
                  <p>Drag and drop image here, or <strong>click to select</strong></p>
                )}
                <span className="helper-text">Supports JPG, PNG, WEBP (Max 5MB)</span>
              </div>
            </div>

            {imageUploading && <div className="helper-text" style={{ color: '#0066cc' }}>Uploading image to Cloudinary...</div>}
            {imageError && <div className="error-text">Upload Error: {imageError}</div>}
            {formErrors.imageUrl && <span className="error-text">{formErrors.imageUrl}</span>}

            {imageUrl && (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={imageUrl} alt="Meter Evidence Preview" className="preview-image-thumb" />
                  <button 
                    type="button" 
                    className="preview-image-remove"
                    onClick={removeImage}
                    title="Remove image"
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
              CANCEL
            </button>
            <button 
              type="submit" 
              className="btn-primary-dark"
              disabled={loading || imageUploading}
            >
              {loading ? "SAVING..." : "SAVE READING"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

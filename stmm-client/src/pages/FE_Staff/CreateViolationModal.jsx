import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import { showToast } from '../../utils/alert';
import './CreateViolationModal.css';

export default function CreateViolationModal({ baseUrl, onClose, onSuccess, prefilledStallId }) {
  const { t, i18n } = useTranslation();

  const [violationTypes, setViolationTypes] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [violationTypeId, setViolationTypeId] = useState('');
  const [stallId, setStallId] = useState(prefilledStallId ? String(prefilledStallId) : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!violationTypeId) {
      errors.violationTypeId = 'Please select a violation type.';
    }
    if (!stallId) {
      errors.stallId = 'Please select a stall/location where the violation occurred.';
    }
    
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Violation title cannot be empty.';
    } else if (trimmedTitle.length < 5 || trimmedTitle.length > 100) {
      errors.title = `Violation title must be between 5 and 100 characters (current: ${trimmedTitle.length}).`;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Violation description cannot be empty.';
    } else if (trimmedDesc.length < 10 || trimmedDesc.length > 500) {
      errors.description = `Violation description must be between 10 and 500 characters (current: ${trimmedDesc.length}).`;
    }

    const fineNum = Number(fineAmount);
    if (fineAmount === '' || isNaN(fineNum) || fineNum < 0) {
      errors.fineAmount = 'Fine amount is invalid.';
    }

    if (!selectedFile) {
      errors.image = 'Please attach 1 violation evidence image.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      const file = e.dataTransfer.files[0];
      selectImageFile(file);
    }
  };

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        const [typesResponse, stallsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/violations/types`, { headers: getAuthHeaders() }),
          fetch(`${baseUrl}/api/staff/stalls/lookup`, { headers: getAuthHeaders() }),
        ]);
        if (!typesResponse.ok) {
          throw new Error(await readProblemDetail(typesResponse, 'Unable to load violation types.'));
        }
        if (!stallsResponse.ok) {
          throw new Error(await readProblemDetail(stallsResponse, t('createviolationmodal.unable_to_load_stalls')));
        }
        if (!active) return;
        const loadedStalls = await stallsResponse.json();
        const rentedStalls = Array.isArray(loadedStalls)
          ? loadedStalls.filter((stall) => stall.stallStatus === 'Rented' || Boolean(stall.vendorName))
          : [];

        setViolationTypes(await typesResponse.json());
        setStalls(rentedStalls);

        // A prefilled stall can become unavailable while the modal is opening.
        // Keep the form consistent with the selectable list in that case.
        if (prefilledStallId && !rentedStalls.some((stall) => String(stall.stallId) === String(prefilledStallId))) {
          setStallId('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoadingOptions(false);
      }
    };

    loadOptions();
    return () => { active = false; };
  }, [baseUrl, prefilledStallId, t]);

  const handleTypeChange = (event) => {
    const nextId = event.target.value;
    setViolationTypeId(nextId);
    setFieldErrors((prev) => ({ ...prev, violationTypeId: null }));
    const selectedType = violationTypes.find((item) => item.violationTypeId === Number(nextId));
    if (selectedType) {
      setTitle(`Violation: ${selectedType.name}`);
      setFineAmount(String(selectedType.defaultFine ?? 0));
    } else {
      setFineAmount('');
    }
  };

  const selectImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: t('createviolationmodal.evidence_must_be_an') }));
      return;
    }
    setError('');
    setFieldErrors((prev) => ({ ...prev, image: null }));
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    if (!validateForm()) {
      setError(t('createviolationmodal.please_check_and_fix', 'Vui lòng kiểm tra và sửa các trường chưa hợp lệ bên dưới.'));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('violationTypeId', violationTypeId);
      formData.append('stallId', stallId);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('fineAmount', fineAmount || '0');
      formData.append('image', selectedFile);

      const response = await fetch(`${baseUrl}/api/violations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('createviolationmodal.unable_to_submit_violation')));
      }
      const createdViolation = await response.json();
      showToast(t('createviolationmodal.violation_created_success', 'Violation report saved successfully!'), 'success');
      onSuccess(createdViolation);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{t('createviolationmodal.report_violation')}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('createviolationmodal.close')}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error ? <div className="error-alert"><strong>{t('createviolationmodal.error')}</strong> {error}</div> : null}

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-type">{t('createviolationmodal.violation_type')}</label>
            <select
              id="violation-type"
              className={`form-input ${fieldErrors.violationTypeId ? 'error-border' : ''}`}
              value={violationTypeId}
              onChange={handleTypeChange}
              disabled={loadingOptions}
            >
              <option value="">{t('createviolationmodal.select_a_violation_type')}</option>
              {violationTypes.map((type) => <option key={type.violationTypeId} value={type.violationTypeId}>{type.name}</option>)}
            </select>
            {fieldErrors.violationTypeId && <span className="error-text">{fieldErrors.violationTypeId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-stall">{t('createviolationmodal.location')}</label>
            <select
              id="violation-stall"
              className={`form-input ${fieldErrors.stallId ? 'error-border' : ''}`}
              value={stallId}
              onChange={(event) => {
                setStallId(event.target.value);
                setFieldErrors((prev) => ({ ...prev, stallId: null }));
              }}
              disabled={loadingOptions || (
                Boolean(prefilledStallId) &&
                stalls.some((stall) => String(stall.stallId) === String(prefilledStallId))
              )}
            >
              <option value="">{t('createviolationmodal.select_a_stall')}</option>
              {stalls.map((stall) => (
                <option key={stall.stallId} value={stall.stallId}>
                  {stall.stallCode} - {stall.areaName}{stall.vendorName ? ` (${stall.vendorName})` : ''}
                </option>
              ))}
            </select>
            {fieldErrors.stallId && <span className="error-text">{fieldErrors.stallId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-title">{t('createviolationmodal.title')}</label>
            <input
              id="violation-title"
              className={`form-input ${fieldErrors.title ? 'error-border' : ''}`}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldErrors((prev) => ({ ...prev, title: null }));
              }}
              maxLength={100}
            />
            {fieldErrors.title && <span className="error-text">{fieldErrors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-description">{t('createviolationmodal.detailed_description')}</label>
            <textarea
              id="violation-description"
              className={`form-input ${fieldErrors.description ? 'error-border' : ''}`}
              rows="4"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFieldErrors((prev) => ({ ...prev, description: null }));
              }}
              maxLength={500}
            />
            {fieldErrors.description && <span className="error-text">{fieldErrors.description}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-fine">{t('createviolationmodal.fine_amount_vnd')}</label>
            <input
              id="violation-fine"
              type="number"
              min="0"
              className={`form-input ${fieldErrors.fineAmount ? 'error-border' : ''}`}
              value={fineAmount}
              readOnly
              disabled
              style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#1e293b', fontWeight: 600 }}
            />
            {fineAmount ? (
              <span className="helper-text" style={{ color: '#475569', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                🔒 {t('createviolationmodal.auto_filled_from_type', 'Tự động áp dụng theo Mức phạt quy định của Loại vi phạm')}: <strong>{Number(fineAmount).toLocaleString(i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US')} VNĐ</strong>
              </span>
            ) : null}
            {fieldErrors.fineAmount && <span className="error-text">{fieldErrors.fineAmount}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field">{t('createviolationmodal.evidence_image')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                if (event.target.files?.[0]) selectImageFile(event.target.files[0]);
                event.target.value = '';
              }}
            />
            
            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'disabled' : ''} ${fieldErrors.image ? 'error-border' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={!selectedFile && !submitting ? () => fileInputRef.current?.click() : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {selectedFile ? (
                  <p>{t('createviolationmodal.image_uploaded_remove_the', 'Đã đính kèm ảnh minh chứng. Bấm để chọn lại ảnh khác.')}</p>
                ) : (
                  <p>{t('createviolationmodal.drag_and_drop_image', 'Kéo thả ảnh vào đây hoặc ')}<strong style={{ color: '#4f46e5' }}>{t('createviolationmodal.click_to_select', 'bấm để chọn ảnh')}</strong></p>
                )}
                <span className="helper-text">{t('createviolationmodal.supports_jpg_png_webp', 'Hỗ trợ định dạng JPG, PNG hoặc WEBP (Tối đa 5MB)')}</span>
              </div>
            </div>
            {fieldErrors.image && <span className="error-text">{fieldErrors.image}</span>}

            {selectedFile && previewUrl ? (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={previewUrl} alt={t('createviolationmodal.violation_evidence')} className="preview-image-thumb" />
                  <button type="button" className="preview-image-remove" onClick={() => setSelectedFile(null)}>&times;</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('createviolationmodal.cancel')}</button>
            <button type="submit" className="btn-primary-dark" disabled={submitting || loadingOptions}>
              {submitting ? t('createviolationmodal.submitting') : t('createviolationmodal.submit_report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

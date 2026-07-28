import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './CreateViolationModal.css';

const readProblemDetail = async (response, fallback) => {
  try {
    const problem = await response.json();
    return problem.detail || problem.title || fallback;
  } catch {
    return fallback;
  }
};

export default function CreateViolationModal({ baseUrl, onClose, onSuccess, prefilledStallId }) {
  const { t } = useTranslation();

  const [violationTypes, setViolationTypes] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [violationTypeId, setViolationTypeId] = useState('');
  const [stallId, setStallId] = useState(prefilledStallId ? String(prefilledStallId) : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
      await uploadImage(file);
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
        setViolationTypes(await typesResponse.json());
        setStalls(await stallsResponse.json());
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoadingOptions(false);
      }
    };

    loadOptions();
    return () => { active = false; };
  }, [baseUrl]);

  const handleTypeChange = (event) => {
    const nextId = event.target.value;
    setViolationTypeId(nextId);
    const selectedType = violationTypes.find((item) => item.violationTypeId === Number(nextId));
    if (selectedType) {
      setTitle(`Violation: ${selectedType.name}`);
      setFineAmount(String(selectedType.defaultFine ?? 0));
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError(t('createviolationmodal.evidence_must_be_an'));
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append(t('createviolationmodal.file'), file);
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: t('createviolationmodal.post'),
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('createviolationmodal.unable_to_upload_image')));
      }
      const result = await response.json();
      setImageUrl(result.imageUrl);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!violationTypeId || !stallId || title.trim().length < 5 || description.trim().length < 10 || !imageUrl) {
      setError(t('createviolationmodal.complete_all_required_fields'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/violations`, {
        method: t('createviolationmodal.post'),
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          violationTypeId: Number(violationTypeId),
          stallId: Number(stallId),
          title: title.trim(),
          description: description.trim(),
          fineAmount: Number(fineAmount || 0),
          imageUrl,
        }),
      });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('createviolationmodal.unable_to_submit_violation')));
      }
      onSuccess(await response.json());
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
            <label className="form-label required-field" htmlFor={t('createviolationmodal.violationtype')}>{t('createviolationmodal.violation_type')}</label>
            <select id="violation-type" className="form-input" value={violationTypeId} onChange={handleTypeChange} disabled={loadingOptions}>
              <option value="">{t('createviolationmodal.select_a_violation_type')}</option>
              {violationTypes.map((type) => <option key={type.violationTypeId} value={type.violationTypeId}>{type.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor={t('createviolationmodal.violationstall')}>{t('createviolationmodal.location')}</label>
            <select id="violation-stall" className="form-input" value={stallId} onChange={(event) => setStallId(event.target.value)} disabled={loadingOptions || Boolean(prefilledStallId)}>
              <option value="">{t('createviolationmodal.select_a_stall')}</option>
              {stalls.map((stall) => <option key={stall.stallId} value={stall.stallId}>{stall.stallCode} - {stall.areaName}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor={t('createviolationmodal.violationtitle')}>{t('createviolationmodal.title')}</label>
            <input id="violation-title" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor={t('createviolationmodal.violationdescription')}>{t('createviolationmodal.detailed_description')}</label>
            <textarea id="violation-description" className="form-input" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor={t('createviolationmodal.violationfine')}>{t('createviolationmodal.fine_amount_vnd')}</label>
            <input id="violation-fine" type="number" min="0" className="form-input" value={fineAmount} onChange={(event) => setFineAmount(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label required-field">{t('createviolationmodal.evidence_image')}</label>
            <input ref={fileInputRef} type="file" accept={t('createviolationmodal.image')} hidden onChange={(event) => uploadImage(event.target.files?.[0])} />
            
            <div 
              className={`drag-drop-zone ${dragActive ? t('createviolationmodal.active') : ''} ${imageUrl ? t('createviolationmodal.disabled') : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={!imageUrl && !uploading ? () => fileInputRef.current?.click() : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {uploading ? (
                  <p>{t('createviolationmodal.uploading_image')}</p>
                ) : imageUrl ? (
                  <p>{t('createviolationmodal.image_uploaded_remove_the')}</p>
                ) : (
                  <p>{t('createviolationmodal.drag_and_drop_image')}<strong style={{ color: '#4f46e5' }}>{t('createviolationmodal.click_to_select')}</strong></p>
                )}
                <span className="helper-text">{t('createviolationmodal.supports_jpg_png_webp')}</span>
              </div>
            </div>

            {imageUrl ? (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={imageUrl} alt={t('createviolationmodal.violation_evidence')} className="preview-image-thumb" />
                  <button type="button" className="preview-image-remove" onClick={() => setImageUrl('')}>&times;</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('createviolationmodal.cancel')}</button>
            <button type="submit" className="btn-primary-dark" disabled={submitting || uploading || loadingOptions}>
              {submitting ? t('createviolationmodal.submitting') : t('createviolationmodal.submit_report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

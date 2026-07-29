import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './CreateIssueModal.css';

const readProblemDetail = async (response, fallback) => {
  try {
    const problem = await response.json();
    return problem.detail || problem.title || fallback;
  } catch {
    return fallback;
  }
};

export default function CreateIssueModal({ baseUrl, onClose, onSuccess, prefilledStallId }) {
  const { t } = useTranslation();

  const [stalls, setStalls] = useState([]);
  const [stallId, setStallId] = useState(prefilledStallId ? String(prefilledStallId) : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loadingStalls, setLoadingStalls] = useState(true);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    let active = true;

    const loadStalls = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/staff/stalls/lookup`, { headers: getAuthHeaders() });
        if (!response.ok) {
          throw new Error(await readProblemDetail(response, t('createissuemodal.unable_to_load_stalls')));
        }
        const items = await response.json();
        if (active) setStalls(Array.isArray(items) ? items : []);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoadingStalls(false);
      }
    };

    loadStalls();
    return () => { active = false; };
  }, [baseUrl, t]);

  const uploadFiles = async (files) => {
    const available = 3 - uploadedImages.length;
    const selectedFiles = Array.from(files).slice(0, available);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');
    try {
      const urls = [];
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
          throw new Error(t('createissuemodal.each_attachment_must_be'));
        }
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${baseUrl}/api/files/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });
        if (!response.ok) {
          throw new Error(await readProblemDetail(response, t('createissuemodal.unable_to_upload_image')));
        }
        const result = await response.json();
        urls.push(result.imageUrl);
      }
      setUploadedImages((current) => [...current, ...urls]);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!stallId || title.trim().length < 5 || description.trim().length < 10) {
      setError(t('createissuemodal.select_a_stall_and'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/staff/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          stallId: Number(stallId),
          title: title.trim(),
          description: description.trim(),
          imageUrl: uploadedImages.join(';') || null,
        }),
      });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('createissuemodal.unable_to_submit_issue')));
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
          <h2 className="modal-title">{t('createissuemodal.report_infrastructure_issue')}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('createissuemodal.close')}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error ? <div className="error-alert"><strong>{t('createissuemodal.error')}</strong> {error}</div> : null}

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-stall">{t('createissuemodal.location')}</label>
            <select
              id="issue-stall"
              className="form-input"
              value={stallId}
              onChange={(event) => setStallId(event.target.value)}
              disabled={loadingStalls}
            >
              <option value="">{loadingStalls ? t('createissuemodal.loading_stalls') : t('createissuemodal.select_a_stall')}</option>
              {stalls.map((stall) => (
                <option key={stall.stallId} value={stall.stallId}>
                  {stall.stallCode} - {stall.areaName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-title">{t('createissuemodal.issue_title')}</label>
            <input id="issue-title" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={500} />
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-description">{t('createissuemodal.detailed_description')}</label>
            <textarea id="issue-description" className="form-input" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('createissuemodal.evidence_images_optional_max')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => uploadFiles(event.target.files)}
            />
            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${uploadedImages.length >= 3 ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={uploadedImages.length < 3 && !uploading ? () => fileInputRef.current?.click() : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {uploading ? (
                  <p>{t('createissuemodal.uploading_images')}</p>
                ) : uploadedImages.length >= 3 ? (
                  <p>{t('createissuemodal.maximum_3_evidence_images')}</p>
                ) : (
                  <p>{t('createissuemodal.drag_and_drop_images')}<strong style={{ color: '#4f46e5' }}>{t('createissuemodal.click_to_select')}</strong></p>
                )}
                <span className="helper-text">{t('createissuemodal.supports_jpg_png_webp')}</span>
              </div>
            </div>
            {uploadedImages.length > 0 ? (
              <div className="preview-images-grid">
                {uploadedImages.map((url, index) => (
                  <div className="preview-image-card" key={url}>
                    <img src={url} alt={`Issue evidence ${index + 1}`} className="preview-image-thumb" />
                    <button type="button" className="preview-image-remove" onClick={() => setUploadedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>&times;</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('createissuemodal.cancel')}</button>
            <button type="submit" className="btn-primary-dark" disabled={submitting || uploading || loadingStalls}>
              {submitting ? t('createissuemodal.submitting') : t('createissuemodal.submit_report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

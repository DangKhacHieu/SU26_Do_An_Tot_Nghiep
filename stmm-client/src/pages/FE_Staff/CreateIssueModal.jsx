import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import { showToast } from '../../utils/alert';
import './CreateIssueModal.css';

export default function CreateIssueModal({ baseUrl, onClose, onSuccess, prefilledStallId }) {
  const { t } = useTranslation();

  const [stalls, setStalls] = useState([]);
  const [stallId, setStallId] = useState(prefilledStallId ? String(prefilledStallId) : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loadingStalls, setLoadingStalls] = useState(true);

  useEffect(() => {
    if (!selectedImageFiles || selectedImageFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = selectedImageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedImageFiles]);
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    let active = true;

    const loadStalls = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/staff/issues/stalls/lookup`, { headers: getAuthHeaders() });
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

  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!stallId) {
      errors.stallId = 'Vui lòng chọn sạp/vị trí xảy ra sự cố.';
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Tiêu đề sự cố không được để trống.';
    } else if (trimmedTitle.length < 5 || trimmedTitle.length > 100) {
      errors.title = `Tiêu đề sự cố phải từ 5 đến 100 ký tự (hiện tại: ${trimmedTitle.length} ký tự).`;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Mô tả sự cố không được để trống.';
    } else if (trimmedDesc.length < 10 || trimmedDesc.length > 500) {
      errors.description = `Mô tả sự cố phải từ 10 đến 500 ký tự (hiện tại: ${trimmedDesc.length} ký tự).`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addFiles = (files) => {
    const available = 3 - selectedImageFiles.length;
    const newFiles = Array.from(files).slice(0, available);
    if (newFiles.length === 0) return;

    setError('');
    for (const file of newFiles) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        setError(t('createissuemodal.each_attachment_must_be'));
        return;
      }
    }
    setSelectedImageFiles((current) => [...current, ...newFiles]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    if (!validateForm()) {
      setError('Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ bên dưới.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('stallId', stallId);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      selectedImageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`${baseUrl}/api/staff/issues`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('createissuemodal.unable_to_submit_issue')));
      }
      const createdIssue = await response.json();
      showToast(t('createissuemodal.issue_created_success', 'Báo cáo sự cố đã được gửi thành công!'), 'success');
      onSuccess(createdIssue);
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
              className={`form-input ${fieldErrors.stallId ? 'error-border' : ''}`}
              value={stallId}
              onChange={(event) => {
                setStallId(event.target.value);
                setFieldErrors((prev) => ({ ...prev, stallId: null }));
              }}
              disabled={loadingStalls}
            >
              <option value="">{loadingStalls ? t('createissuemodal.loading_stalls') : t('createissuemodal.select_a_stall')}</option>
              {stalls.map((stall) => (
                <option key={stall.stallId} value={stall.stallId}>
                  {stall.stallCode} - {stall.areaName}{stall.vendorName ? ` (${stall.vendorName})` : ` (${t('createissuemodal.under_maintenance', 'Đang bảo trì')})`}
                </option>
              ))}
            </select>
            {fieldErrors.stallId && <span className="error-text">{fieldErrors.stallId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-title">{t('createissuemodal.issue_title')}</label>
            <input
              id="issue-title"
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
            <label className="form-label required-field" htmlFor="issue-description">{t('createissuemodal.detailed_description')}</label>
            <textarea
              id="issue-description"
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
            <label className="form-label">{t('createissuemodal.evidence_images_optional_max')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${selectedImageFiles.length >= 3 ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={selectedImageFiles.length < 3 && !submitting ? () => fileInputRef.current?.click() : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {selectedImageFiles.length >= 3 ? (
                  <p>{t('createissuemodal.maximum_3_evidence_images')}</p>
                ) : (
                  <p>{t('createissuemodal.drag_and_drop_images')}<strong style={{ color: '#4f46e5' }}>{t('createissuemodal.click_to_select')}</strong></p>
                )}
                <span className="helper-text">{t('createissuemodal.supports_jpg_png_webp')}</span>
              </div>
            </div>
            {selectedImageFiles.length > 0 ? (
              <div className="preview-images-grid">
                {selectedImageFiles.map((file, index) => (
                  <div className="preview-image-card" key={`${file.name}-${index}`}>
                    <img src={previewUrls[index] || ''} alt={`Issue evidence ${index + 1}`} className="preview-image-thumb" />
                    <button type="button" className="preview-image-remove" onClick={() => setSelectedImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>&times;</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('createissuemodal.cancel')}</button>
            <button type="submit" className="btn-primary-dark" disabled={submitting || loadingStalls}>
              {submitting ? t('createissuemodal.submitting') : t('createissuemodal.submit_report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

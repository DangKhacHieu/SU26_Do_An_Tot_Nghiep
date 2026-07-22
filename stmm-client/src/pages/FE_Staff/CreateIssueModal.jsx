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
          throw new Error(await readProblemDetail(response, 'Unable to load stalls.'));
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
  }, [baseUrl]);

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
          throw new Error('Each attachment must be an image no larger than 5 MB.');
        }
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${baseUrl}/api/files/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(await readProblemDetail(response, 'Unable to upload image.'));
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
      setError('Select a stall and provide a title and description with enough detail.');
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
        throw new Error(await readProblemDetail(response, 'Unable to submit issue report.'));
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
          <h2 className="modal-title">Report Infrastructure Issue</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error ? <div className="error-alert"><strong>Error:</strong> {error}</div> : null}

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-stall">LOCATION</label>
            <select
              id="issue-stall"
              className="form-input"
              value={stallId}
              onChange={(event) => setStallId(event.target.value)}
              disabled={loadingStalls}
            >
              <option value="">{loadingStalls ? 'Loading stalls...' : 'Select a stall'}</option>
              {stalls.map((stall) => (
                <option key={stall.stallId} value={stall.stallId}>
                  {stall.stallCode} - {stall.areaName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-title">ISSUE TITLE</label>
            <input id="issue-title" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={500} />
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="issue-description">DETAILED DESCRIPTION</label>
            <textarea id="issue-description" className="form-input" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">EVIDENCE IMAGES (OPTIONAL, MAX 3)</label>
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
                  <p>Uploading images...</p>
                ) : uploadedImages.length >= 3 ? (
                  <p>Maximum 3 evidence images reached.</p>
                ) : (
                  <p>Drag and drop images here, or <strong style={{ color: '#4f46e5' }}>click to select</strong></p>
                )}
                <span className="helper-text">Supports JPG, PNG, WEBP (Max 5MB each, up to 3 images)</span>
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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary-dark" disabled={submitting || uploading || loadingStalls}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

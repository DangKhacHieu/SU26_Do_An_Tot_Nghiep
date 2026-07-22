import { useEffect, useRef, useState } from 'react';
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      try {
        const [typesResponse, stallsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/violations/types`),
          fetch(`${baseUrl}/api/staff/stalls/lookup`),
        ]);
        if (!typesResponse.ok) {
          throw new Error(await readProblemDetail(typesResponse, 'Unable to load violation types.'));
        }
        if (!stallsResponse.ok) {
          throw new Error(await readProblemDetail(stallsResponse, 'Unable to load stalls.'));
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
      setError('Evidence must be an image no larger than 5 MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
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
      setError('Complete all required fields and attach an evidence image.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${baseUrl}/api/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(await readProblemDetail(response, 'Unable to submit violation report.'));
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
          <h2 className="modal-title">Report Violation</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error ? <div className="error-alert"><strong>Error:</strong> {error}</div> : null}

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-type">VIOLATION TYPE</label>
            <select id="violation-type" className="form-input" value={violationTypeId} onChange={handleTypeChange} disabled={loadingOptions}>
              <option value="">Select a violation type</option>
              {violationTypes.map((type) => <option key={type.violationTypeId} value={type.violationTypeId}>{type.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-stall">LOCATION</label>
            <select id="violation-stall" className="form-input" value={stallId} onChange={(event) => setStallId(event.target.value)} disabled={loadingOptions || Boolean(prefilledStallId)}>
              <option value="">Select a stall</option>
              {stalls.map((stall) => <option key={stall.stallId} value={stall.stallId}>{stall.stallCode} - {stall.areaName}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-title">TITLE</label>
            <input id="violation-title" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-description">DETAILED DESCRIPTION</label>
            <textarea id="violation-description" className="form-input" rows="4" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label required-field" htmlFor="violation-fine">FINE AMOUNT (VND)</label>
            <input id="violation-fine" type="number" min="0" className="form-input" value={fineAmount} onChange={(event) => setFineAmount(event.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label required-field">EVIDENCE IMAGE</label>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadImage(event.target.files?.[0])} />
            <button type="button" className="drag-drop-zone" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? 'Uploading...' : imageUrl ? 'Replace evidence image' : 'Select an image from your device'}
            </button>
            {imageUrl ? (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={imageUrl} alt="Violation evidence" className="preview-image-thumb" />
                  <button type="button" className="preview-image-remove" onClick={() => setImageUrl('')}>&times;</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary-dark" disabled={submitting || uploading || loadingOptions}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

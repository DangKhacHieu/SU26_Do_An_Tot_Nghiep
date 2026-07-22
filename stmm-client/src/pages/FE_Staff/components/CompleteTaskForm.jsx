import { useRef, useState } from 'react';
import { Camera, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { TASK_TYPE } from '../../../constants/taskEnums';

const readProblemDetail = async (response) => {
  try {
    const payload = await response.json();
    return payload.detail || payload.title || 'Unable to complete the task.';
  } catch {
    return 'Unable to complete the task.';
  }
};

export default function CompleteTaskForm({ task, baseUrl, onRefreshTask, onShowNotification, utilityProgress }) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [imageBeforeUrl, setImageBeforeUrl] = useState('');
  const [imageAfterUrl, setImageAfterUrl] = useState('');
  const [dragTarget, setDragTarget] = useState(null);
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({ before: null, after: null });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  const requiresPhotos = [TASK_TYPE.REPAIR, TASK_TYPE.MAINTENANCE].includes(task.taskType);
  const requiresBeforeUpload = requiresPhotos && !task.imageBeforeUrl;
  const isUtilityReading = task.taskType === TASK_TYPE.UTILITY_READING;
  const isChecklistIncomplete = Boolean(
    isUtilityReading
    && utilityProgress
    && utilityProgress.total > 0
    && utilityProgress.completed < utilityProgress.total
  );

  const setImage = (target, value) => {
    if (target === 'before') setImageBeforeUrl(value);
    else setImageAfterUrl(value);
  };

  const uploadFile = async (file, target) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((current) => ({ ...current, [target]: `${file.name} exceeds the 5MB limit.` }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrors((current) => ({ ...current, [target]: 'Only image files are supported.' }));
      return;
    }

    setUploadingTarget(target);
    setUploadErrors((current) => ({ ...current, [target]: null }));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(await readProblemDetail(response));
      const payload = await response.json();
      setImage(target, payload.imageUrl);
    } catch (uploadError) {
      setUploadErrors((current) => ({ ...current, [target]: uploadError.message }));
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleDrop = async (event, target) => {
    event.preventDefault();
    event.stopPropagation();
    setDragTarget(null);
    await uploadFile(event.dataTransfer.files?.[0], target);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (requiresBeforeUpload && !imageBeforeUrl) {
      setSubmitError('Please provide a before photo.');
      return;
    }
    if (requiresPhotos && !imageAfterUrl) {
      setSubmitError('Please provide an after photo.');
      return;
    }
    if (isChecklistIncomplete) {
      setSubmitError('Record readings for every stall before completing this task.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${task.taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBeforeUrl: imageBeforeUrl || task.imageBeforeUrl || null,
          imageAfterUrl: requiresPhotos ? imageAfterUrl : null,
          completionNotes: completionNotes.trim() || null,
        }),
      });

      if (!response.ok) throw new Error(await readProblemDetail(response));
      onShowNotification?.('Task completed successfully.', 'success');
      await onRefreshTask();
    } catch (completionError) {
      setSubmitError(completionError.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUpload = (target, label, value, inputRef) => (
    <div className="form-group">
      <label className="form-label required-field">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => uploadFile(event.target.files?.[0], target)}
        hidden
      />
      <div
        className={`drag-drop-zone ${dragTarget === target ? 'active' : ''} ${value ? 'has-file' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragTarget(target); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragTarget(null); }}
        onDrop={(event) => handleDrop(event, target)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
      >
        {value ? (
          <div className="uploaded-preview-container" onClick={(event) => event.stopPropagation()}>
            <img src={value} alt={`${label} preview`} className="uploaded-thumb" />
            <button type="button" className="btn-remove-uploaded" onClick={() => setImage(target, '')} aria-label={`Remove ${label.toLowerCase()}`}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="drag-drop-content">
            <UploadCloud className="upload-icon" size={30} aria-hidden="true" />
            <p>Drag and drop an image, or <strong>click to select</strong></p>
            <span className="helper-text">JPG, PNG, or WEBP up to 5MB</span>
          </div>
        )}
      </div>
      {uploadingTarget === target ? <div className="helper-text upload-status">Uploading image...</div> : null}
      {uploadErrors[target] ? <div className="error-text">{uploadErrors[target]}</div> : null}
    </div>
  );

  return (
    <section className="complete-task-form-panel">
      <h3 className="card-section-title"><CheckCircle2 size={18} aria-hidden="true" /> Report Task Completion</h3>
      <form onSubmit={handleSubmit} className="complete-form">
        {submitError ? <div className="error-alert" role="alert"><strong>Error:</strong> {submitError}</div> : null}

        {requiresPhotos ? (
          <div className="upload-fields-grid">
            {requiresBeforeUpload ? renderUpload('before', 'Before Photo', imageBeforeUrl, beforeInputRef) : null}
            {renderUpload('after', 'After Photo', imageAfterUrl, afterInputRef)}
          </div>
        ) : null}

        {isUtilityReading && utilityProgress && utilityProgress.total > 0 ? (
          <div className={`utility-completion-progress ${isChecklistIncomplete ? 'is-incomplete' : 'is-complete'}`}>
            <div className="progress-info">
              <span>Meter reading progress</span>
              <strong>{utilityProgress.completed} / {utilityProgress.total} stalls</strong>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(utilityProgress.completed / utilityProgress.total) * 100}%` }} />
            </div>
            {isChecklistIncomplete ? <p>Complete every stall reading before submitting this task.</p> : null}
          </div>
        ) : null}

        <div className="form-group complete-task-notes">
          <label className="form-label">Completion Notes (Optional)</label>
          <textarea
            placeholder="Add completion details, quality notes, or parts used."
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
            rows="3"
            className="form-input"
          />
        </div>

        <div className="form-actions complete-task-actions">
          <button
            type="submit"
            disabled={loading || uploadingTarget !== null || isChecklistIncomplete}
            className="btn-primary-dark submit-completion-btn"
          >
            <Camera size={16} aria-hidden="true" />
            {loading ? 'Submitting...' : 'Confirm Completion'}
          </button>
        </div>
      </form>
    </section>
  );
}

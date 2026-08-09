import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { Camera, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { getAuthHeaders } from '../../../utils/authHeaders';
import { TASK_STATUS, TASK_TYPE } from '../../../constants/taskEnums';

const readProblemDetail = async (response, fallback) => {
  try {
    const payload = await response.json();
    return payload.detail || payload.title || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Owns its own file input ref so the parent never has to pass one down through render.
 */
function EvidenceUploadZone({ label, fileValue, error, isDragging, onDragChange, onPick, onClear, t }) {
  const inputRef = useRef(null);
  const openPicker = () => inputRef.current?.click();

  return (
    <div className="form-group">
      <label className="form-label required-field">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          if (event.target.files?.[0]) onPick(event.target.files[0]);
          event.target.value = '';
        }}
        hidden
      />
      <div
        className={`drag-drop-zone ${isDragging ? 'active' : ''} ${fileValue ? 'has-file' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); onDragChange(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); onDragChange(false); }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDragChange(false);
          if (event.dataTransfer.files?.[0]) onPick(event.dataTransfer.files[0]);
        }}
        onClick={openPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openPicker(); }}
      >
        {fileValue ? (
          <div className="uploaded-preview-container" onClick={(event) => event.stopPropagation()}>
            <img src={URL.createObjectURL(fileValue)} alt={`${label} preview`} className="uploaded-thumb" />
            <button type="button" className="btn-remove-uploaded" onClick={onClear} aria-label={`Remove ${label.toLowerCase()}`}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="drag-drop-content">
            <UploadCloud className="upload-icon" size={30} aria-hidden="true" />
            <p>{t('completetaskform.drag_and_drop_an')}<strong>{t('completetaskform.click_to_select')}</strong></p>
            <span className="helper-text">{t('completetaskform.jpg_png_or_webp')}</span>
          </div>
        )}
      </div>
      {error ? <div className="error-text">{error}</div> : null}
    </div>
  );
}

/** Stored evidence shown outside the In_Progress window: visible, never interactive. */
function EvidencePhotoPreview({ label, storedUrl, t }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="drag-drop-zone is-readonly">
        {storedUrl ? (
          <div className="uploaded-preview-container">
            <img src={storedUrl} alt={`${label} preview`} className="uploaded-thumb" />
          </div>
        ) : (
          <div className="drag-drop-content">
            <UploadCloud className="upload-icon" size={30} aria-hidden="true" />
            <span className="helper-text">{t('completetaskform.no_photo_attached_yet', 'No photo attached')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompleteTaskForm({ task, baseUrl, onRefreshTask, onShowNotification, utilityProgress }) {
  const { t } = useTranslation();

  const [completionNotes, setCompletionNotes] = useState('');
  const [imageBeforeFile, setImageBeforeFile] = useState(null);
  const [imageAfterFile, setImageAfterFile] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({ before: null, after: null });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const requiresPhotos = task.taskType === TASK_TYPE.REPAIR;
  // Evidence photos may only be attached while the task is actually being worked on. Outside that
  // window the stored photos stay visible but read-only.
  const canEditPhotos = task.status === TASK_STATUS.IN_PROGRESS;
  const requiresBeforeUpload = requiresPhotos && canEditPhotos && !task.imageBeforeUrl;
  const hasStoredPhotos = Boolean(task.imageBeforeUrl) && Boolean(task.imageAfterUrl);
  // A repair task still needs both photos on the server, so it can only be completed outside
  // In_Progress when both were already stored.
  const photoEvidenceBlocked = requiresPhotos && !canEditPhotos && !hasStoredPhotos;
  const isPending = task.status === TASK_STATUS.PENDING;
  const isInProgress = task.status === TASK_STATUS.IN_PROGRESS;
  const isUtilityReading = task.taskType === TASK_TYPE.UTILITY_READING;
  const progressCompleted = typeof utilityProgress?.completed === 'object'
    ? Number(utilityProgress.completed.completed) || 0
    : Number(utilityProgress?.completed) || 0;
  const progressTotal = typeof utilityProgress?.completed === 'object'
    ? Number(utilityProgress.completed.total) || 0
    : Number(utilityProgress?.total) || 0;

  const isChecklistComplete = Boolean(
    isUtilityReading
    && progressTotal > 0
    && progressCompleted === progressTotal
  );
  const isChecklistIncomplete = Boolean(
    isUtilityReading
    && progressTotal > 0
    && progressCompleted < progressTotal
  );
  const isExecutionReady = isUtilityReading
    ? (isInProgress || isChecklistComplete)
    : isInProgress;

  const isLocked = !isExecutionReady;

  const setImageFile = (target, file) => {
    if (target === 'before') setImageBeforeFile(file);
    else setImageAfterFile(file);
  };

  const handleFileSelect = (file, target) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((current) => ({ ...current, [target]: t('completetaskform.file_exceeds_limit', '{{fileName}} exceeds maximum size of 5MB.', { fileName: file.name }) }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrors((current) => ({ ...current, [target]: t('completetaskform.only_image_files_are') }));
      return;
    }

    setUploadErrors((current) => ({ ...current, [target]: null }));
    setImageFile(target, file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (isLocked) {
      setSubmitError(t(
        'completetaskform.task_locked_hint',
        'Task must be in In Progress status (or completed utility checklist) to report completion.'
      ));
      return;
    }

    if (photoEvidenceBlocked) {
      setSubmitError(t(
        'completetaskform.photos_only_while_in_progress',
        'Evidence photos can only be attached while task is in progress.'
      ));
      return;
    }

    let hasError = false;
    const errors = { before: null, after: null };

    if (requiresBeforeUpload && !imageBeforeFile) {
      errors.before = t('completetaskform.please_provide_a_before', 'Please attach a before-repair photo.');
      hasError = true;
    }
    if (requiresPhotos && canEditPhotos && !task.imageAfterUrl && !imageAfterFile) {
      errors.after = t('completetaskform.please_provide_an_after', 'Please attach an after-completion photo.');
      hasError = true;
    }

    if (hasError) {
      setUploadErrors(errors);
      setSubmitError(t(
        'completetaskform.attach_all_required_evidence',
        'Please check and attach all required evidence photos below.'
      ));
      return;
    }

    if (isChecklistIncomplete) {
      setSubmitError(t('completetaskform.record_readings_for_every'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (imageBeforeFile) formData.append('imageBefore', imageBeforeFile);
      if (imageAfterFile) formData.append('imageAfter', imageAfterFile);
      if (completionNotes.trim()) formData.append('completionNotes', completionNotes.trim());

      const response = await fetch(`${baseUrl}/api/staff/tasks/${task.taskId}/complete`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) throw new Error(await readProblemDetail(response, t('completetaskform.unable_to_complete_the')));
      onShowNotification?.(t('completetaskform.task_completed_successfully'), 'success');
      await onRefreshTask();
    } catch (completionError) {
      setSubmitError(completionError.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadZoneProps = (target) => ({
    fileValue: target === 'before' ? imageBeforeFile : imageAfterFile,
    error: uploadErrors[target],
    isDragging: dragTarget === target,
    onDragChange: (dragging) => setDragTarget(dragging ? target : null),
    onPick: (file) => handleFileSelect(file, target),
    onClear: () => setImageFile(target, null),
    t,
  });

  return (
    <section className="complete-task-form-panel">
      <h3 className="card-section-title"><CheckCircle2 size={18} aria-hidden="true" /> {t('completetaskform.report_task_completion')}</h3>
      <form onSubmit={handleSubmit} className="complete-form">
        {submitError ? <div className="error-alert" role="alert"><strong>{t('completetaskform.error')}</strong> {submitError}</div> : null}

        {requiresPhotos ? (
          <>
            {!canEditPhotos ? (
              <p className="helper-text photos-locked-note">
                {t(
                  'completetaskform.photos_only_while_in_progress',
                  'Evidence photos can only be attached while task is in progress.'
                )}
              </p>
            ) : null}
            <div className="upload-fields-grid">
              {canEditPhotos ? (
                <>
                  {requiresBeforeUpload
                    ? <EvidenceUploadZone label={t('completetaskform.before_photo')} {...uploadZoneProps('before')} />
                    : <EvidencePhotoPreview label={t('completetaskform.before_photo')} storedUrl={task.imageBeforeUrl} t={t} />}
                  {/* A stored photo always wins server-side, so re-uploading one would be discarded. */}
                  {task.imageAfterUrl
                    ? <EvidencePhotoPreview label={t('completetaskform.after_photo')} storedUrl={task.imageAfterUrl} t={t} />
                    : <EvidenceUploadZone label={t('completetaskform.after_photo')} {...uploadZoneProps('after')} />}
                </>
              ) : (
                <>
                  <EvidencePhotoPreview label={t('completetaskform.before_photo')} storedUrl={task.imageBeforeUrl} t={t} />
                  <EvidencePhotoPreview label={t('completetaskform.after_photo')} storedUrl={task.imageAfterUrl} t={t} />
                </>
              )}
            </div>
          </>
        ) : null}

        {isUtilityReading && utilityProgress && progressTotal > 0 ? (
          <div className={`utility-completion-progress ${isChecklistIncomplete ? 'is-incomplete' : 'is-complete'}`}>
            <div className="progress-info">
              <span>{t('completetaskform.meter_reading_progress')}</span>
              <strong>{progressCompleted} / {progressTotal} stalls</strong>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(progressCompleted / progressTotal) * 100}%` }} />
            </div>
            {isChecklistIncomplete ? <p>{t('completetaskform.complete_every_stall_reading')}</p> : null}
          </div>
        ) : null}

        <div className="form-group complete-task-notes">
          <label className="form-label">{t('completetaskform.completion_notes_optional')}</label>
          <textarea
            placeholder={t('completetaskform.add_completion_details_quality')}
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
            disabled={isLocked || loading}
            rows="3"
            className="form-input"
          />
        </div>

        {isLocked ? (
          <p className="helper-text photos-locked-note" style={{ color: '#d97706', marginTop: '6px', fontWeight: 600 }}>
            🔒 {t('completetaskform.task_pending_lock_hint', 'Completion notes and report submission are only unlocked when task is In Progress (or utility checklist is completed).')}
          </p>
        ) : null}

        <div className="form-actions complete-task-actions">
          <button
            type="submit"
            disabled={isLocked || loading || isChecklistIncomplete || photoEvidenceBlocked}
            className="btn-primary-dark submit-completion-btn"
          >
            <Camera size={16} aria-hidden="true" />
            {loading ? t('completetaskform.submitting') : t('completetaskform.confirm_completion')}
          </button>
        </div>
      </form>
    </section>
  );
}

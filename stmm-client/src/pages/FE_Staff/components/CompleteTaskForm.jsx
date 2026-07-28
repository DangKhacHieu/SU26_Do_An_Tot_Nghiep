import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { Camera, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { getAuthHeaders } from '../../../utils/authHeaders';
import { TASK_TYPE } from '../../../constants/taskEnums';

const readProblemDetail = async (response) => {
  try {
    const payload = await response.json();
    return payload.detail || payload.title || t('completetaskform.unable_to_complete_the');
  } catch {
    return t('completetaskform.unable_to_complete_the');
  }
};

export default function CompleteTaskForm({ task, baseUrl, onRefreshTask, onShowNotification, utilityProgress }) {
  const { t } = useTranslation();

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
    if (target === t('completetaskform.before')) setImageBeforeUrl(value);
    else setImageAfterUrl(value);
  };

  const uploadFile = async (file, target) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((current) => ({ ...current, [target]: `${file.name} exceeds the 5MB limit.` }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrors((current) => ({ ...current, [target]: t('completetaskform.only_image_files_are') }));
      return;
    }

    setUploadingTarget(target);
    setUploadErrors((current) => ({ ...current, [target]: null }));
    const formData = new FormData();
    formData.append(t('completetaskform.file'), file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
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
      setSubmitError(t('completetaskform.please_provide_a_before'));
      return;
    }
    if (requiresPhotos && !imageAfterUrl) {
      setSubmitError(t('completetaskform.please_provide_an_after'));
      return;
    }
    if (isChecklistIncomplete) {
      setSubmitError(t('completetaskform.record_readings_for_every'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${task.taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          imageBeforeUrl: imageBeforeUrl || task.imageBeforeUrl || null,
          imageAfterUrl: requiresPhotos ? imageAfterUrl : null,
          completionNotes: completionNotes.trim() || null,
        }),
      });

      if (!response.ok) throw new Error(await readProblemDetail(response));
      onShowNotification?.(t('completetaskform.task_completed_successfully'), t('completetaskform.success'));
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
        accept={t('completetaskform.image')}
        onChange={(event) => uploadFile(event.target.files?.[0], target)}
        hidden
      />
      <div
        className={`drag-drop-zone ${dragTarget === target ? t('completetaskform.active') : ''} ${value ? t('completetaskform.hasfile') : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragTarget(target); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragTarget(null); }}
        onDrop={(event) => handleDrop(event, target)}
        onClick={() => inputRef.current?.click()}
        role={t('completetaskform.button')}
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === t('completetaskform.enter') || event.key === ' ') inputRef.current?.click(); }}
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
            <UploadCloud className="upload-icon" size={30} aria-hidden={t('completetaskform.true')} />
            <p>{t('completetaskform.drag_and_drop_an')}<strong>{t('completetaskform.click_to_select')}</strong></p>
            <span className="helper-text">{t('completetaskform.jpg_png_or_webp')}</span>
          </div>
        )}
      </div>
      {uploadingTarget === target ? <div className="helper-text upload-status">{t('completetaskform.uploading_image')}</div> : null}
      {uploadErrors[target] ? <div className="error-text">{uploadErrors[target]}</div> : null}
    </div>
  );

  return (
    <section className="complete-task-form-panel">
      <h3 className="card-section-title"><CheckCircle2 size={18} aria-hidden={t('completetaskform.true')} /> {t('completetaskform.report_task_completion')}</h3>
      <form onSubmit={handleSubmit} className="complete-form">
        {submitError ? <div className="error-alert" role={t('completetaskform.alert')}><strong>{t('completetaskform.error')}</strong> {submitError}</div> : null}

        {requiresPhotos ? (
          <div className="upload-fields-grid">
            {requiresBeforeUpload ? renderUpload(t('completetaskform.before'), t('completetaskform.before_photo'), imageBeforeUrl, beforeInputRef) : null}
            {renderUpload(t('completetaskform.after'), t('completetaskform.after_photo'), imageAfterUrl, afterInputRef)}
          </div>
        ) : null}

        {isUtilityReading && utilityProgress && utilityProgress.total > 0 ? (
          <div className={`utility-completion-progress ${isChecklistIncomplete ? t('completetaskform.isincomplete') : t('completetaskform.iscomplete')}`}>
            <div className="progress-info">
              <span>{t('completetaskform.meter_reading_progress')}</span>
              <strong>{utilityProgress.completed} / {utilityProgress.total} stalls</strong>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(utilityProgress.completed / utilityProgress.total) * 100}%` }} />
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
            <Camera size={16} aria-hidden={t('completetaskform.true')} />
            {loading ? t('completetaskform.submitting') : t('completetaskform.confirm_completion')}
          </button>
        </div>
      </form>
    </section>
  );
}

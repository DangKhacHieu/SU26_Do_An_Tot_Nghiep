import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { Camera, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { getAuthHeaders } from '../../../utils/authHeaders';
import { TASK_TYPE } from '../../../constants/taskEnums';

const readProblemDetail = async (response, fallback) => {
  try {
    const payload = await response.json();
    return payload.detail || payload.title || fallback;
  } catch {
    return fallback;
  }
};

export default function CompleteTaskForm({ task, baseUrl, onRefreshTask, onShowNotification, utilityProgress }) {
  const { t } = useTranslation();

  const [completionNotes, setCompletionNotes] = useState('');
  const [imageBeforeFile, setImageBeforeFile] = useState(null);
  const [imageAfterFile, setImageAfterFile] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);
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

  const setImageFile = (target, file) => {
    if (target === 'before') setImageBeforeFile(file);
    else setImageAfterFile(file);
  };

  const handleFileSelect = (file, target) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((current) => ({ ...current, [target]: `${file.name} exceeds the 5MB limit.` }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrors((current) => ({ ...current, [target]: t('completetaskform.only_image_files_are') }));
      return;
    }

    setUploadErrors((current) => ({ ...current, [target]: null }));
    setImageFile(target, file);
  };

  const handleDrop = (event, target) => {
    event.preventDefault();
    event.stopPropagation();
    setDragTarget(null);
    if (event.dataTransfer.files?.[0]) {
      handleFileSelect(event.dataTransfer.files[0], target);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    let hasError = false;
    const errors = { before: null, after: null };

    if (requiresBeforeUpload && !imageBeforeFile) {
      errors.before = 'Vui lòng đính kèm ảnh chụp trước khi sửa chữa.';
      hasError = true;
    }
    if (requiresPhotos && !imageAfterFile) {
      errors.after = 'Vui lòng đính kèm ảnh chụp sau khi hoàn thành.';
      hasError = true;
    }

    if (hasError) {
      setUploadErrors(errors);
      setSubmitError('Vui lòng kiểm tra và đính kèm đầy đủ ảnh bằng chứng bên dưới.');
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

  const renderUpload = (target, label, fileValue, inputRef) => (
    <div className="form-group">
      <label className="form-label required-field">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          if (event.target.files?.[0]) handleFileSelect(event.target.files[0], target);
          event.target.value = '';
        }}
        hidden
      />
      <div
        className={`drag-drop-zone ${dragTarget === target ? 'active' : ''} ${fileValue ? 'has-file' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragTarget(target); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragTarget(null); }}
        onDrop={(event) => handleDrop(event, target)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
      >
        {fileValue ? (
          <div className="uploaded-preview-container" onClick={(event) => event.stopPropagation()}>
            <img src={URL.createObjectURL(fileValue)} alt={`${label} preview`} className="uploaded-thumb" />
            <button type="button" className="btn-remove-uploaded" onClick={() => setImageFile(target, null)} aria-label={`Remove ${label.toLowerCase()}`}>
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
      {uploadErrors[target] ? <div className="error-text">{uploadErrors[target]}</div> : null}
    </div>
  );

  return (
    <section className="complete-task-form-panel">
      <h3 className="card-section-title"><CheckCircle2 size={18} aria-hidden="true" /> {t('completetaskform.report_task_completion')}</h3>
      <form onSubmit={handleSubmit} className="complete-form">
        {submitError ? <div className="error-alert" role="alert"><strong>{t('completetaskform.error')}</strong> {submitError}</div> : null}

        {requiresPhotos ? (
          <div className="upload-fields-grid">
            {requiresBeforeUpload ? renderUpload('before', t('completetaskform.before_photo'), imageBeforeFile, beforeInputRef) : null}
            {renderUpload('after', t('completetaskform.after_photo'), imageAfterFile, afterInputRef)}
          </div>
        ) : null}

        {isUtilityReading && utilityProgress && utilityProgress.total > 0 ? (
          <div className={`utility-completion-progress ${isChecklistIncomplete ? 'is-incomplete' : 'is-complete'}`}>
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
            disabled={loading || isChecklistIncomplete}
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

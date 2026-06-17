import React, { useState, useRef } from 'react';
import { TASK_TYPE } from '../../../constants/taskEnums';

export default function CompleteTaskForm({ task, userId, baseUrl, onRefreshTask, onShowNotification }) {
  const [completionNotes, setCompletionNotes] = useState('');
  
  // Image Before states
  const [imageBeforeUrl, setImageBeforeUrl] = useState('');
  const [dragActiveBefore, setDragActiveBefore] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadErrorBefore, setUploadErrorBefore] = useState(null);
  const fileInputBeforeRef = useRef(null);

  // Image After states
  const [imageAfterUrl, setImageAfterUrl] = useState('');
  const [dragActiveAfter, setDragActiveAfter] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [uploadErrorAfter, setUploadErrorAfter] = useState(null);
  const fileInputAfterRef = useRef(null);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Check if Image Before upload is required
  // Required when: Repair or Maintenance AND task does not have imageBeforeUrl yet
  const isImageBeforeRequired = 
    (task.taskType === TASK_TYPE.REPAIR || task.taskType === TASK_TYPE.MAINTENANCE) && 
    !task.imageBeforeUrl;

  // Check if Image After upload is required
  // Required for Repair and Maintenance
  const isImageAfterRequired = 
    task.taskType === TASK_TYPE.REPAIR || task.taskType === TASK_TYPE.MAINTENANCE;

  // Drag handlers for Before Photo
  const handleDragBefore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveBefore(true);
    } else if (e.type === "dragleave") {
      setDragActiveBefore(false);
    }
  };

  const handleDropBefore = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveBefore(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0], 'before');
    }
  };

  // Drag handlers for After Photo
  const handleDragAfter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveAfter(true);
    } else if (e.type === "dragleave") {
      setDragActiveAfter(false);
    }
  };

  const handleDropAfter = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveAfter(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0], 'after');
    }
  };

  const uploadFile = async (file, type) => {
    if (file.size > 5 * 1024 * 1024) {
      const err = `File ${file.name} exceeds the 5MB size limit.`;
      if (type === 'before') setUploadErrorBefore(err);
      else setUploadErrorAfter(err);
      return;
    }

    if (!file.type.startsWith('image/')) {
      const err = 'Only image files are supported.';
      if (type === 'before') setUploadErrorBefore(err);
      else setUploadErrorAfter(err);
      return;
    }

    if (type === 'before') {
      setUploadingBefore(true);
      setUploadErrorBefore(null);
    } else {
      setUploadingAfter(true);
      setUploadErrorAfter(null);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Error uploading image ${file.name}`);
      }

      const result = await response.json();
      if (type === 'before') {
        setImageBeforeUrl(result.imageUrl);
      } else {
        setImageAfterUrl(result.imageUrl);
      }
    } catch (err) {
      if (type === 'before') setUploadErrorBefore(err.message);
      else setUploadErrorAfter(err.message);
    } finally {
      if (type === 'before') setUploadingBefore(false);
      else setUploadingAfter(false);
    }
  };

  const triggerSelectBefore = () => fileInputBeforeRef.current.click();
  const triggerSelectAfter = () => fileInputAfterRef.current.click();

  const handleSetMockBefore = () => {
    setImageBeforeUrl('https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=600&auto=format&fit=crop');
  };

  const handleSetMockAfter = () => {
    setImageAfterUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    if (isImageBeforeRequired && !imageBeforeUrl) {
      setSubmitError('Please provide the initial photo (Image Before).');
      return;
    }

    if (isImageAfterRequired && !imageAfterUrl) {
      setSubmitError('Please provide the completion photo (Image After).');
      return;
    }

    setLoading(true);

    // Auto-fill placeholder for UtilityReading/CashCollection since backend validator requires it
    const finalImageAfterUrl = isImageAfterRequired 
      ? imageAfterUrl 
      : 'https://placehold.co/600x400/png?text=Task+Completed';

    const finalImageBeforeUrl = imageBeforeUrl || task.imageBeforeUrl || null;

    const requestData = {
      imageBeforeUrl: finalImageBeforeUrl,
      imageAfterUrl: finalImageAfterUrl,
      completionNotes: completionNotes.trim() || null
    };

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${task.taskId}/complete?userId=${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error completing task: ${response.statusText}`);
      }

      onShowNotification('Task completion reported successfully!', 'success');
      onRefreshTask();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-task-form-panel">
      <h3 className="card-section-title">✅ Report Task Completion</h3>
      
      <form onSubmit={handleSubmit} className="complete-form">
        {submitError && (
          <div className="error-alert">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        <div className="upload-fields-grid">
          {/* Image Before Field */}
          {isImageBeforeRequired && (
            <div className="form-group">
              <div className="label-with-toggle">
                <label className="form-label required-field">Initial Status Photo (Image Before)</label>
                <button 
                  type="button" 
                  className="btn-text-toggle"
                  onClick={handleSetMockBefore}
                >
                  Use Demo Photo
                </button>
              </div>

              <input 
                ref={fileInputBeforeRef}
                type="file" 
                accept="image/*"
                onChange={(e) => e.target.files && uploadFile(e.target.files[0], 'before')}
                style={{ display: 'none' }}
              />

              <div 
                className={`drag-drop-zone ${dragActiveBefore ? 'active' : ''} ${imageBeforeUrl ? 'has-file' : ''}`}
                onDragEnter={handleDragBefore}
                onDragOver={handleDragBefore}
                onDragLeave={handleDragBefore}
                onDrop={handleDropBefore}
                onClick={triggerSelectBefore}
              >
                {imageBeforeUrl ? (
                  <div className="uploaded-preview-container" onClick={(e) => e.stopPropagation()}>
                    <img src={imageBeforeUrl} alt="Before Preview" className="uploaded-thumb" />
                    <button 
                      type="button" 
                      className="btn-remove-uploaded"
                      onClick={() => setImageBeforeUrl('')}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="drag-drop-content">
                    <span className="upload-icon">📸</span>
                    <p>Drag & drop the before image here, or <strong>click to select</strong></p>
                    <span className="helper-text">Supports JPG, PNG, WEBP (Max 5MB)</span>
                  </div>
                )}
              </div>
              {uploadingBefore && <div className="helper-text upload-status">Uploading image to Cloudinary...</div>}
              {uploadErrorBefore && <div className="error-text">Upload error: {uploadErrorBefore}</div>}
            </div>
          )}

          {/* Image After Field */}
          {isImageAfterRequired && (
            <div className="form-group">
              <div className="label-with-toggle">
                <label className="form-label required-field">Completion Photo (Image After)</label>
                <button 
                  type="button" 
                  className="btn-text-toggle"
                  onClick={handleSetMockAfter}
                >
                  Use Demo Photo
                </button>
              </div>

              <input 
                ref={fileInputAfterRef}
                type="file" 
                accept="image/*"
                onChange={(e) => e.target.files && uploadFile(e.target.files[0], 'after')}
                style={{ display: 'none' }}
              />

              <div 
                className={`drag-drop-zone ${dragActiveAfter ? 'active' : ''} ${imageAfterUrl ? 'has-file' : ''}`}
                onDragEnter={handleDragAfter}
                onDragOver={handleDragAfter}
                onDragLeave={handleDragAfter}
                onDrop={handleDropAfter}
                onClick={triggerSelectAfter}
              >
                {imageAfterUrl ? (
                  <div className="uploaded-preview-container" onClick={(e) => e.stopPropagation()}>
                    <img src={imageAfterUrl} alt="After Preview" className="uploaded-thumb" />
                    <button 
                      type="button" 
                      className="btn-remove-uploaded"
                      onClick={() => setImageAfterUrl('')}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="drag-drop-content">
                    <span className="upload-icon">📸</span>
                    <p>Drag & drop the after image here, or <strong>click to select</strong></p>
                    <span className="helper-text">Supports JPG, PNG, WEBP (Max 5MB)</span>
                  </div>
                )}
              </div>
              {uploadingAfter && <div className="helper-text upload-status">Uploading image to Cloudinary...</div>}
              {uploadErrorAfter && <div className="error-text">Upload error: {uploadErrorAfter}</div>}
            </div>
          )}
        </div>

        {/* Completion Notes */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Completion Notes (Optional)</label>
          <textarea
            placeholder="Enter details of completion, quality notes, or parts used if any..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows="3"
            className="form-input"
          />
        </div>

        <div className="form-actions" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={loading || uploadingBefore || uploadingAfter}
            className="btn-primary-dark submit-completion-btn"
            style={{ width: 'auto', padding: '10px 24px' }}
          >
            {loading ? 'Submitting report...' : '✔️ Confirm Task Completion'}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';

export default function CreateViolationModal({ userId, baseUrl, onClose, onSuccess, prefilledStallId }) {
  const [violationTypes, setViolationTypes] = useState([]);
  const [stalls, setStalls] = useState([]);
  
  // Form fields
  const [violationTypeId, setViolationTypeId] = useState('');
  const [stallId, setStallId] = useState(prefilledStallId ? prefilledStallId.toString() : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Drag & drop UI state
  const [dragActive, setDragActive] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  // Fallback Stall Input in case no stalls are loaded
  const [isStallLoading, setIsStallLoading] = useState(false);
  const [isStallError, setIsStallError] = useState(false);
  const [useManualStallId, setUseManualStallId] = useState(false);
  const [manualStallId, setManualStallId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // 1. Fetch Violation Types
    const fetchTypes = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/violations/types`);
        if (response.ok) {
          const data = await response.json();
          setViolationTypes(data);
        }
      } catch (err) {
        console.error("Failed to load violation types:", err);
      }
    };

    // 2. Fetch Stalls from Stall Tasks API
    const fetchStalls = async () => {
      setIsStallLoading(true);
      setIsStallError(false);
      try {
        const response = await fetch(`${baseUrl}/api/staff/stall-tasks?userId=${userId}&pageSize=50`);
        if (response.ok) {
          const data = await response.json();
          const items = data.items || [];
          setStalls(items);
          if (items.length === 0) {
            setUseManualStallId(true); // Fallback if no stalls assigned
          }
        } else {
          setIsStallError(true);
          setUseManualStallId(true);
        }
      } catch (err) {
        console.error("Failed to load stalls:", err);
        setIsStallError(true);
        setUseManualStallId(true);
      } finally {
        setIsStallLoading(false);
      }
    };

    fetchTypes();
    fetchStalls();
  }, [userId, baseUrl]);

  // Pre-fill Fine Amount & Title when violation type is selected
  const handleViolationTypeChange = (e) => {
    const typeId = e.target.value;
    setViolationTypeId(typeId);
    
    if (typeId) {
      const selectedType = violationTypes.find(t => t.violationTypeId === parseInt(typeId));
      if (selectedType) {
        setTitle(`Violation of: ${selectedType.name}`);
        setFineAmount(selectedType.defaultFine !== null ? selectedType.defaultFine.toString() : '0');
      }
    } else {
      setTitle('');
      setFineAmount('');
    }
  };

  const handleSetMockImage = () => {
    // Standard mock image URL for easy testing
    setImageUrl('https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=600&auto=format&fit=crop');
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError("File size must not exceed 5MB.");
      return;
    }

    setImageUploading(true);
    setImageError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to upload image.');
      }

      const result = await response.json();
      setImageUrl(result.imageUrl);
    } catch (err) {
      setImageError(err.message);
      setImageUrl('');
    } finally {
      setImageUploading(false);
    }
  };

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
      if (file.type.startsWith("image/")) {
        await uploadFile(file);
      } else {
        setImageError("Only image files are supported.");
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        await uploadFile(file);
      } else {
        setImageError("Only image files are supported.");
      }
    }
  };

  const removeImage = () => {
    setImageUrl('');
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const validateForm = () => {
    const errors = {};
    if (!violationTypeId) errors.violationTypeId = "Violation Type is required.";
    
    const finalStallId = useManualStallId ? manualStallId : stallId;
    if (!finalStallId || isNaN(parseInt(finalStallId)) || parseInt(finalStallId) <= 0) {
      errors.stallId = "Stall selection or a valid positive Stall ID is required.";
    }
    
    if (!title.trim()) errors.title = "Violation Title is required.";
    if (title.length > 500) errors.title = "Title cannot exceed 500 characters.";
    if (!description.trim()) errors.description = "Detailed Description is required.";
    
    if (!imageUrl.trim()) {
      errors.imageUrl = "An evidence photo of the violation is required.";
    }

    if (fineAmount === '' || isNaN(Number(fineAmount)) || Number(fineAmount) < 0) {
      errors.fineAmount = "Fine Amount must be a non-negative number.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setLoading(true);
    const finalStallId = parseInt(useManualStallId ? manualStallId : stallId);
    
    const requestData = {
      stallId: finalStallId,
      violationTypeId: parseInt(violationTypeId),
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      fineAmount: parseFloat(fineAmount)
    };

    try {
      const response = await fetch(`${baseUrl}/api/violations?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to submit violation report: ${response.statusText}`);
      }

      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">➕ Create New Violation</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          {/* Violation Type */}
          <div className="form-group">
            <label className="form-label required-field">VIOLATION TYPE</label>
            <select
              value={violationTypeId}
              onChange={handleViolationTypeChange}
              className={`form-input ${formErrors.violationTypeId ? 'error-border' : ''}`}
            >
              <option value="">Select violation category...</option>
              {violationTypes.map(t => (
                <option key={t.violationTypeId} value={t.violationTypeId}>
                  {t.name} (Default Fine: {t.defaultFine ? t.defaultFine.toLocaleString('vi-VN') + ' VND' : 'N/A'})
                </option>
              ))}
            </select>
            {formErrors.violationTypeId && <span className="error-text">{formErrors.violationTypeId}</span>}
          </div>

          {/* Location / Stall ID */}
          <div className="form-group">
            <div className="label-with-toggle">
              <label className="form-label required-field">LOCATION / STALL ID</label>
              <button 
                type="button" 
                className="btn-text-toggle"
                onClick={() => setUseManualStallId(!useManualStallId)}
              >
                {useManualStallId ? "Switch to Dropdown Select" : "Type Stall ID manually"}
              </button>
            </div>

            {useManualStallId ? (
              <input
                type="number"
                placeholder="Enter Stall ID (e.g. 1, 2, 3...)"
                value={manualStallId}
                onChange={(e) => setManualStallId(e.target.value)}
                className={`form-input ${formErrors.stallId ? 'error-border' : ''}`}
              />
            ) : (
              <select
                value={stallId}
                onChange={(e) => setStallId(e.target.value)}
                className={`form-input ${formErrors.stallId ? 'error-border' : ''}`}
                disabled={isStallLoading}
              >
                <option value="">Select Stall Code...</option>
                {stalls.map(s => (
                  <option key={s.stallId} value={s.stallId}>
                    {s.stallCode} ({s.stallCategory || 'No Category'}) - Vendor: {s.vendorName || 'No Vendor'}
                  </option>
                ))}
              </select>
            )}
            
            {isStallLoading && <span className="helper-text">Loading active stalls...</span>}
            {isStallError && <span className="helper-text warning">Failed to load stalls from server. Fallback to manual entry.</span>}
            {formErrors.stallId && <span className="error-text">{formErrors.stallId}</span>}
          </div>

          {/* Violation Title */}
          <div className="form-group">
            <label className="form-label required-field">VIOLATION TITLE</label>
            <input
              type="text"
              placeholder="Title Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`form-input ${formErrors.title ? 'error-border' : ''}`}
            />
            {formErrors.title && <span className="error-text">{formErrors.title}</span>}
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label required-field">DETAILED DESCRIPTION</label>
            <textarea
              placeholder="Provide specific details about the violation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className={`form-input ${formErrors.description ? 'error-border' : ''}`}
            />
            {formErrors.description && <span className="error-text">{formErrors.description}</span>}
          </div>

          {/* Fine Amount */}
          <div className="form-group">
            <label className="form-label required-field">FINE AMOUNT (VND)</label>
            <input
              type="number"
              placeholder="XXX.XXX VND"
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
              className={`form-input ${formErrors.fineAmount ? 'error-border' : ''}`}
            />
            {formErrors.fineAmount && <span className="error-text">{formErrors.fineAmount}</span>}
          </div>

          {/* Evidence Image Upload */}
          <div className="form-group">
            <div className="label-with-toggle">
              <label className="form-label required-field">PHOTO OF VIOLATION (EVIDENCE)</label>
              <button 
                type="button" 
                className="btn-text-toggle"
                onClick={handleSetMockImage}
              >
                Use Mock Image URL
              </button>
            </div>
            
            {/* Hidden native input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Drag and Drop Zone */}
            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${imageUrl ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={!imageUrl ? onButtonClick : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {imageUrl ? (
                  <p>Image uploaded. Remove the preview image to upload a new one.</p>
                ) : (
                  <p>Drag and drop image here, or <strong>click to select</strong></p>
                )}
                <span className="helper-text">Supports JPG, PNG, WEBP (Max 5MB)</span>
              </div>
            </div>

            {imageUploading && <div className="helper-text" style={{ color: '#0066cc' }}>Uploading image to Cloudinary...</div>}
            {imageError && <div className="error-text">Upload Error: {imageError}</div>}
            {formErrors.imageUrl && <span className="error-text">{formErrors.imageUrl}</span>}

            {/* Previews Grid (Single Image Preview) */}
            {imageUrl && (
              <div className="preview-images-grid">
                <div className="preview-image-card">
                  <img src={imageUrl} alt="Violation Evidence Preview" className="preview-image-thumb" />
                  <button 
                    type="button" 
                    className="preview-image-remove"
                    onClick={removeImage}
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading || imageUploading}
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              className="btn-primary-dark"
              disabled={loading || imageUploading}
            >
              {loading ? "SUBMITTING..." : "SUBMIT REPORT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

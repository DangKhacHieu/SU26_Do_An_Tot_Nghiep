import React, { useState, useEffect, useRef } from 'react';

export default function CreateIssueModal({ userId, baseUrl, onClose, onSuccess }) {
  const [stalls, setStalls] = useState([]);
  
  // Form fields
  const [stallId, setStallId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  
  // Drag & drop UI state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
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
    // Fetch Stalls from Stall Tasks API
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

    fetchStalls();
  }, [userId, baseUrl]);

  // Drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file) => {
    if (uploadedImages.length >= 3) {
      setUploadError("Maximum 3 images allowed.");
      return;
    }
    
    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File ${file.name} exceeds 5MB size limit.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to upload ${file.name}`);
      }

      const result = await response.json();
      setUploadedImages(prev => [...prev, result.imageUrl]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const remainingSlots = 3 - uploadedImages.length;
      const filesToUpload = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        setUploadError(`You can only upload up to ${remainingSlots} more image(s).`);
      }

      for (const file of filesToUpload) {
        if (file.type.startsWith("image/")) {
          await uploadFile(file);
        } else {
          setUploadError("Only image files are supported.");
        }
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      const remainingSlots = 3 - uploadedImages.length;
      const filesToUpload = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        setUploadError(`You can only upload up to ${remainingSlots} more image(s).`);
      }

      for (const file of filesToUpload) {
        if (file.type.startsWith("image/")) {
          await uploadFile(file);
        } else {
          setUploadError("Only image files are supported.");
        }
      }
    }
  };

  const removeImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSetMockImages = () => {
    // Generate 3 sample images
    const mockUrls = [
      'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop'
    ];
    setUploadedImages(mockUrls);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const validateForm = () => {
    const errors = {};
    
    const finalStallId = useManualStallId ? manualStallId : stallId;
    if (!finalStallId || isNaN(parseInt(finalStallId)) || parseInt(finalStallId) <= 0) {
      errors.stallId = "Stall selection or a valid positive Stall ID is required.";
    }
    
    if (!title.trim()) {
      errors.title = "Issue Title is required.";
    } else if (title.trim().length < 5) {
      errors.title = "Title must be at least 5 characters.";
    } else if (title.length > 500) {
      errors.title = "Title cannot exceed 500 characters.";
    }

    if (!description.trim()) {
      errors.description = "Detailed Description is required.";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters.";
    }
    
    if (uploadedImages.length > 3) {
      errors.imageUrl = "You can attach a maximum of 3 images.";
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
      title: title.trim(),
      description: description.trim(),
      imageUrl: uploadedImages.join(';') || null
    };

    try {
      const response = await fetch(`${baseUrl}/api/staff/issues?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to submit issue report: ${response.statusText}`);
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
          <h2 className="modal-title">🔧 Report New Infrastructure Issue</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>Error:</strong> {submitError}
            </div>
          )}

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

          {/* Issue Title */}
          <div className="form-group">
            <label className="form-label required-field">ISSUE TITLE</label>
            <input
              type="text"
              placeholder="e.g. Broken Water Pipe, Electrical Short Circuit (Min 5 chars)"
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
              placeholder="Provide specific details about the infrastructure issue (Min 10 chars)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className={`form-input ${formErrors.description ? 'error-border' : ''}`}
            />
            {formErrors.description && <span className="error-text">{formErrors.description}</span>}
          </div>

          {/* Evidence Image Upload Zone */}
          <div className="form-group">
            <div className="label-with-toggle">
              <label className="form-label">EVIDENCE IMAGE UPLOADS (OPTIONAL - MAX 3)</label>
              <button 
                type="button" 
                className="btn-text-toggle"
                onClick={handleSetMockImages}
              >
                Set Mock Image URLs (3 photos)
              </button>
            </div>
            
            {/* Hidden native input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Drag and Drop Zone */}
            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${uploadedImages.length >= 3 ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={uploadedImages.length < 3 ? onButtonClick : undefined}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📸</span>
                {uploadedImages.length >= 3 ? (
                  <p>Maximum 3 images uploaded. Remove an image to upload more.</p>
                ) : (
                  <p>Drag and drop images here, or <strong>click to select</strong></p>
                )}
                <span className="helper-text">Supports JPG, PNG, WEBP (Max 5MB each)</span>
              </div>
            </div>

            {uploading && <div className="helper-text" style={{ color: '#0066cc' }}>Uploading image to Cloudinary...</div>}
            {uploadError && <div className="error-text">Upload Error: {uploadError}</div>}
            {formErrors.imageUrl && <span className="error-text">{formErrors.imageUrl}</span>}

            {/* Previews Grid */}
            {uploadedImages.length > 0 && (
              <div className="preview-images-grid">
                {uploadedImages.map((url, idx) => (
                  <div key={idx} className="preview-image-card">
                    <img src={url} alt={`Preview ${idx + 1}`} className="preview-image-thumb" />
                    <button 
                      type="button" 
                      className="preview-image-remove"
                      onClick={() => removeImage(idx)}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading || uploading}
            >
              CANCEL
            </button>
            <button 
              type="submit" 
              className="btn-primary-dark"
              disabled={loading || uploading}
            >
              {loading ? "SUBMITTING..." : "SUBMIT REPORT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

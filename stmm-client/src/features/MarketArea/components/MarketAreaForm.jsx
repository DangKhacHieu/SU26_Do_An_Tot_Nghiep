import React, { useState, useEffect } from 'react';
import styles from './MarketAreaForm.module.css';

const MarketAreaForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: 'General Retail'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        categoryId: initialData.categoryName || 'General Retail'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: 'General Retail'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <h2 className={styles.title}>
          <span>✎</span> {initialData ? 'EDIT_AREA' : 'NEW_AREA'}
        </h2>
        
        <div className={styles.formGroup}>
          <label>AREA NAME</label>
          <input 
            className={styles.input} 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. North Plaza Central" 
          />
        </div>

        <div className={styles.formGroup}>
          <label>DESCRIPTION</label>
          <textarea 
            className={styles.textarea} 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief technical summary..."></textarea>
        </div>

        <div className={styles.formGroup}>
          <label>CATEGORY</label>
          <select 
            className={styles.select} 
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
          >
            <option value="General Retail">General Retail</option>
            <option value="Food Court">Food Court</option>
            <option value="Fresh Produce">Fresh Produce</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleSave}>SAVE_SCHEMA</button>
        <button className={styles.btnSecondary} onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
};

export default MarketAreaForm;

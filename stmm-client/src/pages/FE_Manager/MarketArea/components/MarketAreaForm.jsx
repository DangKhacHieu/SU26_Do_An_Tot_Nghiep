import React, { useState, useEffect } from 'react';
import styles from './MarketAreaForm.module.css';
import { getAllCategories } from '../api/categoryApi';

const MarketAreaForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryName: ''
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        categoryName: initialData.categoryName || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryName: ''
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
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.section}>
          <h2 className={styles.title}>
            <span>✎</span> {initialData ? 'EDIT_AREA' : 'NEW_AREA'}
          </h2>
          <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>
          
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
            <label>CATEGORY NAME</label>
            <input 
              className={styles.input} 
              type="text" 
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              list="area-category-suggestions"
              placeholder="e.g., Food Court, General Retail..." 
              autoComplete="off"
            />
            <datalist id="area-category-suggestions">
                {categories.map(c => (
                    <option key={c.categoryId} value={c.name} />
                ))}
            </datalist>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleSave}>SAVE_SCHEMA</button>
          <button className={styles.btnSecondary} onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </div>
  );
};

export default MarketAreaForm;

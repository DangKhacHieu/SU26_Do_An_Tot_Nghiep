import React, { useState, useEffect } from 'react';
import styles from './MarketAreaForm.module.css';
import { getAllCategories } from '../api/categoryApi';

const MarketAreaForm = ({ initialData, onSave, onCancel, existingAreas = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryName: '',
    width: 200,
    height: 150
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

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
        categoryName: initialData.categoryName || '',
        width: (initialData.maxX !== null && initialData.minX !== null) ? (initialData.maxX - initialData.minX) : 200,
        height: (initialData.maxY !== null && initialData.minY !== null) ? (initialData.maxY - initialData.minY) : 150
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryName: '',
        width: 200,
        height: 150
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
        setError('Tên khu vực không được để trống.');
        return;
    }
    
    // Check for duplicate name
    const isDuplicate = existingAreas.some(a => 
        a.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        a.areaId !== initialData?.areaId
    );
    if (isDuplicate) {
        setError('Tên khu vực đã tồn tại! Vui lòng chọn tên khác.');
        return;
    }

    if (formData.width < 50 || formData.height < 50) {
        setError('Kích thước chiều rộng và chiều dài phải lớn hơn 50px.');
        return;
    }

    setError(null);
    onSave({
        ...formData,
        name: formData.name.trim(),
        width: parseInt(formData.width) || 200,
        height: parseInt(formData.height) || 150
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.section}>
          <h2 className={styles.title}>
            <span>{initialData ? '✎' : '+'}</span> {initialData ? 'SỬA KHU VỰC' : 'THÊM KHU VỰC'}
          </h2>
          <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>
          
          {error && <div style={{background: '#ffe4e6', color: '#e11d48', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold'}}>{error}</div>}
          
          <div className={styles.formGroup}>
            <label>TÊN KHU VỰC <span style={{color: 'red'}}>*</span></label>
            <input 
              className={styles.input} 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Khu A, Khu Ẩm Thực..." 
            />
          </div>

          <div className={styles.formGroup}>
            <label>MÔ TẢ</label>
            <textarea 
              className={styles.textarea} 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả ngắn gọn..."></textarea>
          </div>

          <div style={{display: 'flex', gap: '12px'}}>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label>CHIỀU RỘNG (px) <span style={{color: 'red'}}>*</span></label>
                <input 
                  className={styles.input} 
                  type="number" 
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  min="50"
                  placeholder="VD: 200" 
                />
              </div>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label>CHIỀU DÀI (px) <span style={{color: 'red'}}>*</span></label>
                <input 
                  className={styles.input} 
                  type="number" 
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min="50"
                  placeholder="VD: 150" 
                />
              </div>
          </div>

          <div className={styles.formGroup}>
            <label>NGÀNH HÀNG</label>
            <input 
              className={styles.input} 
              type="text" 
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              list="area-category-suggestions"
              placeholder="VD: Thực phẩm, Thời trang..." 
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
          <button className={styles.btnPrimary} onClick={handleSave}>LƯU THÔNG TIN</button>
          <button className={styles.btnSecondary} onClick={onCancel}>HỦY BỎ</button>
        </div>
      </div>
    </div>
  );
};

export default MarketAreaForm;

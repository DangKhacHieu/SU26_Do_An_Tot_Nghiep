import React, { useState, useEffect } from 'react';
import styles from './MarketAreaForm.module.css';
import { getAllCategories } from '../api/categoryApi';
import PolygonDrawer from './PolygonDrawer';

const MarketAreaForm = ({ 
  initialData, 
  onSave, 
  onCancel, 
  existingAreas = [],
  marketPolygon,
  marketBounds,
  marketSize,
  svgOffsetX,
  svgOffsetY,
  cWidth,
  cHeight
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryName: '',
    size: '',
    width: 200,
    height: 150,
    svgPath: ''
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
        size: initialData.size || '',
        width: (() => {
          if (initialData.maxX !== null && initialData.minX !== null) return initialData.maxX - initialData.minX;
          if (initialData.svgPath) {
              const matches = [...initialData.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
              if (matches.length > 0) {
                  const xs = matches.map(m => parseFloat(m[1]));
                  return Math.max(...xs) - Math.min(...xs);
              }
          }
          return 200;
        })(),
        height: (() => {
          if (initialData.maxY !== null && initialData.minY !== null) return initialData.maxY - initialData.minY;
          if (initialData.svgPath) {
              const matches = [...initialData.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
              if (matches.length > 0) {
                  const ys = matches.map(m => parseFloat(m[2]));
                  return Math.max(...ys) - Math.min(...ys);
              }
          }
          return 150;
        })(),
        svgPath: initialData.svgPath || '',
        minX: initialData.minX,
        minY: initialData.minY
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryName: '',
        size: '',
        width: 200,
        height: 150,
        svgPath: '',
        minX: undefined,
        minY: undefined
      });
    }
  }, [initialData]);

  const PX_PER_M2 = 900; // 1 m2 = 900 pixels vuông

  const maxAllowedAreaSize = React.useMemo(() => {
      if (!marketSize) return 999999;
      const currentTotal = existingAreas.reduce((sum, area) => {
          if (initialData && area.areaId === initialData.areaId) return sum;
          return sum + (parseFloat(area.size) || 0);
      }, 0);
      return marketSize - currentTotal;
  }, [marketSize, existingAreas, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        // Đồng bộ 2 chiều (Cách 3)
        if (name === 'size' && value) {
            const numSize = parseFloat(value);
            if (!isNaN(numSize) && numSize > 0) {
                if (!prev.svgPath) {
                    const dimension = Math.round(Math.sqrt(numSize * PX_PER_M2));
                    newData.width = dimension;
                    newData.height = dimension;
                }
            }
        } else if ((name === 'width' || name === 'height') && value) {
            const w = parseFloat(name === 'width' ? value : prev.width);
            const h = parseFloat(name === 'height' ? value : prev.height);
            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                newData.size = Math.round((w * h) / PX_PER_M2 * 100) / 100;
            }
        }
        
        return newData;
    });
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

    if (formData.size && parseFloat(formData.size) > maxAllowedAreaSize) {
        setError(`Diện tích khu vực (${formData.size} m²) vượt quá diện tích còn trống của chợ (còn lại khoảng ${Math.round(maxAllowedAreaSize * 100) / 100} m²).`);
        return;
    }

    setError(null);
    onSave({
        ...formData,
        categoryName: formData.categoryName,
        size: formData.size ? parseFloat(formData.size) : null,
        name: formData.name.trim(),
        width: parseInt(formData.width, 10),
        height: parseInt(formData.height, 10),
        svgPath: formData.svgPath || null,
        minX: formData.minX,
        minY: formData.minY
    });
  };

  const handleDrawComplete = (result) => {
      setFormData(prev => ({
          ...prev,
          svgPath: result.svgPath,
          minX: result.minX,
          minY: result.minY,
          width: result.width,
          height: result.height,
          size: prev.size ? prev.size : Math.round(result.areaM2 * 100) / 100
      }));
      setIsDrawing(false);
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

          <div className={styles.formGroup}>
            <label>DIỆN TÍCH VẬT LÝ (m²)</label>
            <input 
              className={styles.input} 
              type="number" 
              name="size"
              value={formData.size}
              onChange={handleChange}
              min="1"
              step="any"
              placeholder="VD: 50" 
            />
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
                  disabled={!!formData.svgPath}
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
                  disabled={!!formData.svgPath}
                />
              </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>HÌNH DÁNG (ĐA GIÁC)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                    onClick={() => setIsDrawing(true)}
                    style={{ 
                        background: '#3b82f6', color: 'white', border: 'none', 
                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', 
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' 
                    }}
                >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    {formData.svgPath ? 'Sửa Hình Dáng' : 'Vẽ Hình Dáng'}
                </button>
                {formData.svgPath && (
                    <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>✓ Đã tạo hình dáng</span>
                )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>NGÀNH HÀNG</label>
            <select 
              className={styles.input} 
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
            >
              <option value="">-- Chọn ngành hàng --</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleSave}>LƯU THÔNG TIN</button>
          <button className={styles.btnSecondary} onClick={onCancel}>HỦY BỎ</button>
        </div>
      </div>
      
      {isDrawing && (
          <PolygonDrawer 
              marketPolygon={marketPolygon}
              existingAreas={existingAreas.filter(a => !initialData || a.areaId !== initialData.areaId)}
              svgOffsetX={svgOffsetX}
              svgOffsetY={svgOffsetY}
              cWidth={cWidth}
              cHeight={cHeight}
              maxAllowedAreaSize={maxAllowedAreaSize}
              onComplete={handleDrawComplete}
              onCancel={() => setIsDrawing(false)}
          />
      )}
    </div>
  );
};

export default MarketAreaForm;

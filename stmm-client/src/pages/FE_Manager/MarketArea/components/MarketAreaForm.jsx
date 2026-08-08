import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import styles from './MarketAreaForm.module.css';
import PolygonDrawer from './PolygonDrawer';
import { getAllStallsByAreaId } from '../api/stallApi';

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
  cHeight,
  marketCategories
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryName: '',
    size: '',
    width: 200,
    height: 150,
    svgPath: ''
  });
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStalls, setHasStalls] = useState(false);

  useEffect(() => {
    if (initialData?.areaId) {
      getAllStallsByAreaId(initialData.areaId)
        .then(stalls => {
          setHasStalls(stalls && stalls.length > 0);
        })
        .catch(err => console.error('Error fetching stalls for area:', err));
    } else {
      setHasStalls(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
        const calcW = (() => {
          const valMaxX = initialData.maxX ?? initialData.MaxX;
          const valMinX = initialData.minX ?? initialData.MinX;
          if (valMaxX != null && valMinX != null) return valMaxX - valMinX;
          if (initialData.svgPath) {
              const matches = [...initialData.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
              if (matches.length > 0) {
                  const xs = matches.map(m => parseFloat(m[1]));
                  return Math.max(...xs) - Math.min(...xs);
              }
          }
          return 200;
        })();

        const calcH = (() => {
          const valMaxY = initialData.maxY ?? initialData.MaxY;
          const valMinY = initialData.minY ?? initialData.MinY;
          if (valMaxY != null && valMinY != null) return valMaxY - valMinY;
          if (initialData.svgPath) {
              const matches = [...initialData.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
              if (matches.length > 0) {
                  const ys = matches.map(m => parseFloat(m[2]));
                  return Math.max(...ys) - Math.min(...ys);
              }
          }
          return 150;
        })();

      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        categoryName: initialData.categoryName || '',
        size: initialData.size || Math.round((calcW * calcH) / 900 * 100) / 100,
        width: calcW,
        height: calcH,
        svgPath: initialData.svgPath || '',
        minX: initialData.minX ?? initialData.MinX,
        minY: initialData.minY ?? initialData.MinY
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryName: '',
        size: Math.round((200 * 150) / 900 * 100) / 100, // Default 33.33 m2
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
        setError(t('marketFloorPlan.areaForm.empty_name'));
        return;
    }
    
    // Check for duplicate name
    const isDuplicate = existingAreas.some(a => 
        a.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        a.areaId !== initialData?.areaId
    );
    if (isDuplicate) {
        setError(t('marketFloorPlan.areaForm.duplicate_name'));
        return;
    }

    if (formData.width < 50 || formData.height < 50) {
        setError(t('marketFloorPlan.areaForm.min_size'));
        return;
    }

    if (formData.size && parseFloat(formData.size) > maxAllowedAreaSize) {
        setError(t('marketFloorPlan.areaForm.exceeds_size', { size: formData.size, max: Math.round(maxAllowedAreaSize * 100) / 100 }));
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
      if (!result || result.length === 0) {
          setIsDrawing(false);
          return;
      }
      const poly = result[0]; // PolygonDrawer returns an array of polygons
      setFormData(prev => ({
          ...prev,
          svgPath: poly.svgPath,
          minX: poly.minX,
          minY: poly.minY,
          width: poly.width,
          height: poly.height,
          size: Math.round(poly.areaM2 * 100) / 100
      }));
      setIsDrawing(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.section}>
          <h2 className={styles.title}>
            <span>{initialData ? '✎' : '+'}</span> {initialData ? t('marketFloorPlan.areaForm.edit_title') : t('marketFloorPlan.areaForm.add_title')}
          </h2>
          <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>
          
          {error && <div style={{background: '#ffe4e6', color: '#e11d48', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold'}}>{error}</div>}
          
          <div className={styles.formGroup}>
            <label>{t('marketFloorPlan.areaForm.name')} <span style={{color: 'red'}}>*</span></label>
            <input 
              className={styles.input} 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('marketFloorPlan.areaForm.name_placeholder')} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('marketFloorPlan.areaForm.desc')}</label>
            <textarea 
              className={styles.textarea} 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('marketFloorPlan.areaForm.desc_placeholder')}></textarea>
          </div>

          <div className={styles.formGroup}>
            <label>{t('marketFloorPlan.areaForm.physical_size')}</label>
            {hasStalls && <div style={{color: '#e11d48', fontSize: '12px', marginBottom: '4px'}}>{t('marketFloorPlan.areaForm.no_resize_stall')}</div>}
            <input 
              className={styles.input} 
              type="number" 
              name="size"
              value={formData.size}
              onChange={handleChange}
              min="1"
              step="any"
              placeholder="VD: 50" 
              disabled={hasStalls}
              style={hasStalls ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}}
            />
          </div>

          <div style={{display: 'flex', gap: '12px'}}>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label>{t('marketFloorPlan.areaForm.width')} <span style={{color: 'red'}}>*</span></label>
                <input 
                  className={styles.input} 
                  type="number" 
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  min="50"
                  placeholder="VD: 200" 
                  disabled={!!formData.svgPath || hasStalls}
                  style={hasStalls ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}}
                />
              </div>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label>{t('marketFloorPlan.areaForm.height')} <span style={{color: 'red'}}>*</span></label>
                <input 
                  className={styles.input} 
                  type="number" 
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min="50"
                  placeholder="VD: 150" 
                  disabled={!!formData.svgPath || hasStalls}
                  style={hasStalls ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}}
                />
              </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>{t('marketFloorPlan.areaForm.shape')}</label>
            {hasStalls && <div style={{color: '#e11d48', fontSize: '12px', marginBottom: '4px'}}>{t('marketFloorPlan.areaForm.no_reshape_stall')}</div>}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                    onClick={() => setIsDrawing(true)}
                    disabled={hasStalls}
                    style={{ 
                        background: hasStalls ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', 
                        padding: '10px 16px', borderRadius: '8px', cursor: hasStalls ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' 
                    }}
                >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    {formData.svgPath ? t('marketFloorPlan.areaForm.edit_shape') : t('marketFloorPlan.areaForm.draw_shape')}
                </button>
                {formData.svgPath && (
                    <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>{t('marketFloorPlan.areaForm.shape_created')}</span>
                )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>{t('marketFloorPlan.areaForm.category')}</label>
            {hasStalls && <div style={{color: '#e11d48', fontSize: '12px', marginBottom: '4px'}}>{t('marketFloorPlan.areaForm.no_category_stall')}</div>}
            <select 
              className={styles.input} 
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              disabled={hasStalls}
              style={hasStalls ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}}
            >
              <option value="">{t('marketFloorPlan.areaForm.select_category')}</option>
              {(marketCategories || []).map(c => (
                <option key={c.categoryId || c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleSave}>{t('marketFloorPlan.areaForm.save')}</button>
          <button className={styles.btnSecondary} onClick={onCancel}>{t('marketFloorPlan.areaForm.cancel')}</button>
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

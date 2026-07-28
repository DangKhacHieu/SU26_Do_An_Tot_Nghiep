import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createStall, updateStall, updateStallStatus, updateStallLocation, getUnassignedMeters } from '../api/stallApi';
import { getAllCategories } from '../api/categoryApi';
import styles from './MarketAreaForm.module.css';

const StallForm = ({ initialData, drawnData, areaId, areaWidth, areaHeight, areaSize, getValidPosition, onSave, onCancel }) => {
  const { t } = useTranslation();

    const [formData, setFormData] = useState({
        code: '',
        categoryName: '',
        status: 'Available',
        size: '',
        description: '',
        width: 100,
        height: 100,
        svgPath: '',
        electricityMeterId: '',
        waterMeterId: ''
    });
    const [categories, setCategories] = useState([]);
    const [unassignedElectricityMeters, setUnassignedElectricityMeters] = useState([]);
    const [unassignedWaterMeters, setUnassignedWaterMeters] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const data = await getAllCategories();
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        const fetchMeters = async () => {
            try {
                if (!initialData) {
                    const eMeters = await getUnassignedMeters('Electricity');
                    const wMeters = await getUnassignedMeters('Water');
                    setUnassignedElectricityMeters(eMeters);
                    setUnassignedWaterMeters(wMeters);
                }
            } catch (err) {
                console.error("Failed to fetch unassigned meters", err);
            }
        };
        fetchCats();
        fetchMeters();
    }, [initialData]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code || '',
                categoryName: initialData.categoryName || '',
                status: initialData.status || 'Available',
                size: initialData.size || '',
                description: initialData.description || '',
                width: initialData.width || 100,
                height: initialData.height || 100,
                svgPath: initialData.svgPath || '',
                electricityMeterId: '',
                waterMeterId: ''
            });
        } else if (drawnData) {
            setFormData(prev => ({
                ...prev,
                size: (Math.round((drawnData.areaM2 || drawnData.area || 0) * 100) / 100).toString(),
                width: drawnData.width,
                height: drawnData.height,
                svgPath: drawnData.svgPath
            }));
        }
    }, [initialData, drawnData]);

    const PX_PER_M2 = 900; // 1 m2 = 900 pixels vuông (30px * 30px)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            
            // Đồng bộ 2 chiều (Cách 3)
            if (name === 'size' && value) {
                const numSize = parseFloat(value);
                if (!isNaN(numSize) && numSize > 0) {
                    const dimension = Math.round(Math.sqrt(numSize * PX_PER_M2));
                    newData.width = dimension;
                    newData.height = dimension;
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                size: formData.size ? parseFloat(formData.size) : null,
                electricityMeterId: formData.electricityMeterId ? parseInt(formData.electricityMeterId) : null,
                waterMeterId: formData.waterMeterId ? parseInt(formData.waterMeterId) : null
            };

            if (initialData?.stallId) {
                if (initialData.status !== formData.status) {
                    await updateStallStatus(initialData.stallId, formData.status);
                }
                
                await updateStallLocation(initialData.stallId, {
                    width: Number(formData.width),
                    height: Number(formData.height),
                    mapX: initialData.mapX,
                    mapY: initialData.mapY,
                    svgPath: formData.svgPath
                });
                
                await updateStall(initialData.stallId, {
                    code: formData.code,
                    categoryName: formData.categoryName,
                    size: Number(formData.size),
                    description: formData.description
                });
            } else {
                let currentWidth = parseFloat(formData.width) || 100;
                let currentHeight = parseFloat(formData.height) || 100;
                
                // Clamp width and height to area bounds if available
                if (areaWidth) currentWidth = Math.min(currentWidth, areaWidth);
                if (areaHeight) currentHeight = Math.min(currentHeight, areaHeight);
                
                const initialPos = drawnData 
                    ? { x: drawnData.minX, y: drawnData.minY }
                    : getValidPosition
                        ? getValidPosition(currentWidth, currentHeight)
                        : { x: 0, y: 0 };

                await createStall({ 
                    ...payload, 
                    areaId, 
                    width: currentWidth, 
                    height: currentHeight, 
                    mapX: initialPos.x, 
                    mapY: initialPos.y,
                    svgPath: formData.svgPath
                });
            }
            onSave();
        } catch (err) {
            console.error('Error saving stall:', err);
            let errorMessage = 'Failed to save stall. Please check the inputs.';
            if (!err.response) {
                errorMessage = 'Lỗi kết nối tới Server: ${err.message}. Vui lòng kiểm tra lại Backend đã chạy chưa.';
            } else if (err.response?.data?.errors) {
                // Validation error from ASP.NET
                const errors = err.response.data.errors;
                errorMessage = Object.values(errors).flat().join(' ');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.title) {
                errorMessage = 'Lỗi Server (500): ${err.response.data.title}';
            } else if (typeof err.response?.data === 'string') {
                errorMessage = err.response.data;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className={styles.overlay} style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div className={styles.panel} style={{maxHeight: '90vh', overflowY: 'auto'}}>
                <div className={styles.section}>
                    <h2 className={styles.title}>
                        <span>✎</span> {initialData ? 'Chỉnh sửa Sạp' : 'Thêm Sạp mới'}
                    </h2>
                    <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>
                
                {error && <div style={{color: '#ff4d4f', marginBottom: 16, fontSize: 13}}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {!initialData ? (
                        <div className={styles.formGroup}>
                            <label htmlFor="code">{'Mã sạp (Stall Code)'}</label>
                            <input
                                className={styles.input}
                                type="text"
                                id="code"
                                value={'Sẽ được tự động tạo'}
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', fontStyle: 'italic', color: '#888' }}
                            />
                        </div>
                    ) : (
                        <div className={styles.formGroup}>
                            <label htmlFor="code">{'Mã sạp (Stall Code)'}</label>
                            <input
                                className={styles.input}
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                disabled
                                title={'Không được phép sửa Mã sạp'}
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                        </div>
                    )}
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="categoryName">{'Tên sạp / Ngành hàng (Category)'}<span style={{color: '#ff4d4f'}}>*</span></label>
                        <select
                            className={styles.input}
                            id="categoryName"
                            name="categoryName"
                            value={formData.categoryName}
                            onChange={handleChange}
                            required
                        >
                            <option value="">{'-- Chọn ngành hàng --'}</option>
                            {categories.map(c => (
                                <option key={c.categoryId} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="size">{'Diện tích vật lý (m²)'}<span style={{color: '#ff4d4f'}}>*</span></label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.01"
                            min="0.1"
                            id="size"
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            required
                            placeholder="e.g., 20.5"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description">{'Người đang thuê (Tenant Name)'}</label>
                        <input
                            className={styles.input}
                            type="text"
                            id="description"
                            name="description"
                            value={initialData?.tenantName || ''}
                            readOnly
                            disabled
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            placeholder={'Chưa có người thuê...'}
                            title={'Tên người thuê được tự động cập nhật từ hệ thống Hợp đồng'}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="status">Tình trạng (Status) {initialData?.tenantName && <span style={{color: '#ff4d4f', fontSize: 10}}>{'(Đã khóa bởi Hợp đồng)'}</span>}</label>
                        <select
                            className={styles.select}
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={!!initialData?.tenantName}
                            style={{ backgroundColor: initialData?.tenantName ? '#f5f5f5' : 'white', cursor: initialData?.tenantName ? 'not-allowed' : 'pointer' }}
                        >
                            <option value="Available">Available</option>
                            <option value="Rented">Rented</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>

                    {!formData.svgPath && (
                        <div className={styles.formGroup} style={{display: 'flex', gap: 12}}>
                            <div style={{flex: 1}}>
                                <label htmlFor="width">{'Chiều dài hiển thị (px)'}</label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    id="width"
                                    name="width"
                                    value={formData.width}
                                    onChange={handleChange}
                                    max={areaWidth || undefined}
                                    title={areaWidth ? 'Tối đa ${areaWidth}px (bằng với Khu vực)' : ""}
                                    required
                                />
                            </div>
                            <div style={{flex: 1}}>
                                <label htmlFor="height">{'Chiều rộng hiển thị (px)'}</label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    id="height"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    max={areaHeight || undefined}
                                    title={areaHeight ? 'Tối đa ${areaHeight}px (bằng với Khu vực)' : ""}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Tạm thời ẩn phần chọn Đồng hồ theo yêu cầu
                    {!initialData && (
                        <div className={styles.formGroup} style={{display: 'flex', gap: 12}}>
                            <div style={{flex: 1}}>
                                <label htmlFor="electricityMeterId">{t('stallform.electricity_meter_optional')}</label>
                                <select
                                    className={styles.select}
                                    id="electricityMeterId"
                                    name="electricityMeterId"
                                    value={formData.electricityMeterId}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('stallform.create_new_automatically')}</option>
                                    {unassignedElectricityMeters.map(m => (
                                        <option key={m.meterId} value={m.meterId}>{m.serialNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{flex: 1}}>
                                <label htmlFor="waterMeterId">{t('stallform.water_meter_optional')}</label>
                                <select
                                    className={styles.select}
                                    id="waterMeterId"
                                    name="waterMeterId"
                                    value={formData.waterMeterId}
                                    onChange={handleChange}
                                >
                                    <option value="">{t('stallform.create_new_automatically')}</option>
                                    {unassignedWaterMeters.map(m => (
                                        <option key={m.meterId} value={m.meterId}>{m.serialNumber}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    */}
                    
                    <div className={styles.actions}>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu Sạp'}
                        </button>
                        <button type="button" onClick={onCancel} className={styles.btnSecondary} disabled={loading}>
                            {'Hủy bỏ'}</button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default StallForm;

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createStall, updateStall, updateStallStatus, updateStallLocation } from '../api/stallApi';
import { getAreaById } from '../api/marketAreaApi';
import { getAllCategories } from '../api/categoryApi';
import meterService from '../../../../services/meterService';
import styles from './MarketAreaForm.module.css';

const StallForm = ({ initialData, drawnData, areaId, areaWidth, areaHeight, areaSize, existingStalls = [], getValidPosition, onSave, onCancel, onRedrawShape, marketCategories, inline = false }) => {
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
    const [unassignedElectricityMeters, setUnassignedElectricityMeters] = useState([]);
    const [unassignedWaterMeters, setUnassignedWaterMeters] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [areaCategory, setAreaCategory] = useState(null);

    useEffect(() => {
        const fetchArea = async () => {
            if (!areaId) return;
            try {
                const areaData = await getAreaById(areaId);
                if (areaData && areaData.categoryName) {
                    setAreaCategory(areaData.categoryName);
                    // Auto-fill form data if creating new stall
                    if (!initialData) {
                        setFormData(prev => ({ ...prev, categoryName: areaData.categoryName }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch area data", err);
            }
        };

        const fetchMeters = async () => {
            try {
                const eMeters = await meterService.getUnassignedMeters('Electricity');
                const wMeters = await meterService.getUnassignedMeters('Water');
                setUnassignedElectricityMeters(eMeters || []);
                setUnassignedWaterMeters(wMeters || []);
            } catch (err) {
                console.error("Failed to fetch meters", err);
            }
        };
        
        fetchArea();
        fetchMeters();
    }, [initialData, areaId]);

    useEffect(() => {
        if (initialData) {
            const baseData = {
                ...initialData,
                size: initialData.size ? initialData.size.toString() : '',
                width: initialData.width || 100,
                height: initialData.height || 100,
                svgPath: initialData.svgPath || '',
                electricityMeterId: initialData.electricityMeterId || '',
                waterMeterId: initialData.waterMeterId || ''
            };

            if (drawnData) {
                baseData.size = (Math.round((drawnData.areaM2 || drawnData.area || 0) * 100) / 100).toString();
                baseData.width = drawnData.width;
                baseData.height = drawnData.height;
                baseData.svgPath = drawnData.svgPath;
            }

            setFormData(baseData);
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
            
            // CÁCH TÍNH DIỆN TÍCH TỪ CANVAS (GIẢ LẬP KHÔNG DÙNG POSTGIS)
            // - Frontend tự quy đổi Tỷ lệ: PX_PER_M2 = 900 (Tức là 1m2 = 30px * 30px trên màn hình)
            // - Khi người dùng thay đổi Size trong form, tự động quy ra Width/Height cho hình chữ nhật Canvas.
            // - Khi người dùng kéo Resize trên Canvas, Width/Height thay đổi -> tự động cập nhật lại Size.
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
                    // CÔNG THỨC: Diện tích (Size) = (Width * Height) / PX_PER_M2
                    // Làm tròn 2 chữ số thập phân
                    newData.size = Math.round((w * h) / PX_PER_M2 * 100) / 100;
                }
            }
            
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // VALIDATION TẠI FRONTEND: KIỂM TRA TỔNG DIỆN TÍCH
        // Validate Area Size Limit: Tổng diện tích sạp không được lớn hơn tổng diện tích Khu vực
        if (formData.size) {
            const requestedSize = parseFloat(formData.size);
            const currentTotal = existingStalls.reduce((sum, s) => {
                if (initialData && s.stallId === initialData.stallId) return sum;
                return sum + (parseFloat(s.size) || 0);
            }, 0);
            
            if (areaSize && requestedSize + currentTotal > parseFloat(areaSize)) {
                setError(`Diện tích sạp (${requestedSize} m²) làm tổng diện tích vượt quá Khu vực! (còn trống ${Math.max(0, Math.round((parseFloat(areaSize) - currentTotal) * 100) / 100)} m²)`);
                return;
            }
        }
        
        setLoading(true);

        try {
            let finalStatus = formData.status;
            if (finalStatus === 'Rented' && !initialData?.tenantName) {
                finalStatus = 'Available';
            }

            const payload = {
                ...formData,
                status: finalStatus,
                size: formData.size ? parseFloat(formData.size) : null,
                electricityMeterId: formData.electricityMeterId ? parseInt(formData.electricityMeterId) : null,
                waterMeterId: formData.waterMeterId ? parseInt(formData.waterMeterId) : null
            };

            if (initialData?.stallId) {
                if (initialData.status !== finalStatus) {
                    await updateStallStatus(initialData.stallId, finalStatus);
                }
                
                let updateMapX = initialData.mapX !== undefined ? initialData.mapX : initialData.xAxis;
                let updateMapY = initialData.mapY !== undefined ? initialData.mapY : initialData.yAxis;
                if (drawnData) {
                    updateMapX = drawnData.minX;
                    updateMapY = drawnData.minY;
                }

                await updateStallLocation(initialData.stallId, {
                    width: Number(formData.width),
                    height: Number(formData.height),
                    mapX: updateMapX,
                    mapY: updateMapY,
                    svgPath: formData.svgPath
                });
                
                await updateStall(initialData.stallId, {
                    ...payload,
                    size: Number(formData.size)
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

    const formInner = (
        <div className={inline ? '' : styles.panel} style={inline ? { display: 'flex', flexDirection: 'column', height: '100%' } : { maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.section} style={inline ? { flex: 1 } : {}}>
                <h2 className={styles.title} style={inline ? { fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' } : {}}>
                    <span>✎</span> {initialData ? 'Chỉnh sửa Sạp' : 'Thêm Sạp mới'}
                </h2>
                {!inline && <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>}
            
            {initialData && !initialData.tenantName && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Hình dáng sạp thực tế</span>
                    <button type="button" onClick={() => onRedrawShape && onRedrawShape()} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        ✎ Vẽ lại hình dáng
                    </button>
                </div>
            )}

            {error && <div style={{color: '#ff4d4f', marginBottom: 16, fontSize: 13, background: '#fff1f0', padding: 8, borderRadius: 4, border: '1px solid #ffa39e'}}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={inline ? { display: 'flex', flexDirection: 'column', gap: '12px' } : {}}>
                {!initialData ? (
                    <div className={styles.formGroup} style={inline ? { marginBottom: 0 } : {}}>
                        <label htmlFor="code" style={inline ? { fontSize: '13px' } : {}}>{'Mã sạp (Stall Code)'}</label>
                        <input
                            className={styles.input}
                            type="text"
                            id="code"
                            value={'Sẽ được tự động tạo'}
                            disabled
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', fontStyle: 'italic', color: '#888', padding: inline ? '8px' : '' }}
                        />
                    </div>
                ) : (
                    <div className={styles.formGroup} style={inline ? { marginBottom: 0 } : {}}>
                        <label htmlFor="code" style={inline ? { fontSize: '13px' } : {}}>{'Mã sạp (Stall Code)'}</label>
                        <input
                            className={styles.input}
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            disabled
                            title={'Không được phép sửa Mã sạp'}
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', padding: inline ? '8px' : '' }}
                        />
                    </div>
                )}
                
                <div className={styles.formGroup} style={inline ? { marginBottom: 0 } : {}}>
                    <label htmlFor="categoryName" style={inline ? { fontSize: '13px' } : {}}>
                        {'Tên sạp / Ngành hàng (Category)'}<span style={{color: '#ff4d4f'}}>*</span>
                        {areaCategory && <span style={{fontSize: '11px', color: '#10b981', marginLeft: '8px'}}>(Kế thừa từ khu vực)</span>}
                    </label>
                    <select
                        className={styles.input}
                        id="categoryName"
                        name="categoryName"
                        value={formData.categoryName}
                        onChange={handleChange}
                        required
                        disabled={!!areaCategory}
                        style={inline ? { padding: '8px', ...(areaCategory ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}) } : (areaCategory ? {background: '#f3f4f6', cursor: 'not-allowed'} : {})}
                    >
                        <option value="">{'-- Chọn ngành hàng --'}</option>
                        {(marketCategories || []).map(c => (
                            <option key={c.categoryId || c.id} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup} style={inline ? { marginBottom: 0 } : {}}>
                    <label htmlFor="size" style={inline ? { fontSize: '13px' } : {}}>{'Diện tích vật lý (m²)'}<span style={{color: '#ff4d4f'}}>*</span></label>
                    {<div style={{color: '#64748b', fontSize: '11px', marginBottom: '4px'}}>* Diện tích được tự động tính toán khi vẽ sạp.</div>}
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
                        disabled
                        placeholder="e.g., 20.5"
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', ...(inline ? { padding: '8px' } : {}) }}
                        title="Vui lòng dùng công cụ Vẽ lại hình dáng để thay đổi diện tích"
                    />
                </div>

                <div className={styles.formGroup} style={inline ? { marginBottom: 0 } : {}}>
                    <label htmlFor="description" style={inline ? { fontSize: '13px' } : {}}>{'Người đang thuê (Tenant Name)'}</label>
                    <input
                        className={styles.input}
                        type="text"
                        id="description"
                        name="description"
                        value={initialData?.tenantName || ''}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', padding: inline ? '8px' : '' }}
                        placeholder={'Chưa có người thuê...'}
                        title={'Tên người thuê được tự động cập nhật từ hệ thống Hợp đồng'}
                    />
                </div>
                
                <div className={styles.formGroup} style={inline ? { marginBottom: 0 } : {}}>
                    <label htmlFor="status" style={inline ? { fontSize: '13px' } : {}}>Tình trạng (Status) {initialData?.tenantName && <span style={{color: '#ff4d4f', fontSize: 10}}>{'(Đã khóa bởi Hợp đồng)'}</span>}</label>
                    <select
                        className={styles.select}
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={!!initialData?.tenantName}
                        style={{ backgroundColor: initialData?.tenantName ? '#f5f5f5' : 'white', cursor: initialData?.tenantName ? 'not-allowed' : 'pointer', padding: inline ? '8px' : '' }}
                    >
                        <option value="Available">Còn trống (Available)</option>
                        <option value="Maintenance">Đang bảo trì (Maintenance)</option>
                        {initialData?.tenantName && <option value="Rented">Đã thuê (Rented)</option>}
                    </select>
                </div>

                <div style={{display: 'flex', gap: '12px', marginBottom: inline ? 0 : '16px', marginTop: inline ? 0 : '16px'}}>
                    <div className={styles.formGroup} style={{flex: 1, marginBottom: 0}}>
                        <label htmlFor="electricityMeterId" style={inline ? { fontSize: '13px' } : {}}>Đồng hồ Điện {!initialData && <span style={{color: '#ff4d4f'}}>*</span>}</label>
                        <select
                            className={styles.select}
                            id="electricityMeterId"
                            name="electricityMeterId"
                            value={formData.electricityMeterId || ''}
                            onChange={handleChange}
                            required={!initialData}
                            style={inline ? { padding: '8px' } : {}}
                        >
                            <option value="">-- Chọn ĐH Điện --</option>
                            {initialData?.electricityMeterId && (
                                <option value={initialData.electricityMeterId}>
                                    {initialData.electricityMeterSerial || `ĐH hiện tại (${initialData.electricityMeterId})`}
                                </option>
                            )}
                            {unassignedElectricityMeters.map(m => (
                                <option key={m.meterId} value={m.meterId}>{m.serialNumber}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup} style={{flex: 1, marginBottom: 0}}>
                        <label htmlFor="waterMeterId" style={inline ? { fontSize: '13px' } : {}}>Đồng hồ Nước {!initialData && <span style={{color: '#ff4d4f'}}>*</span>}</label>
                        <select
                            className={styles.select}
                            id="waterMeterId"
                            name="waterMeterId"
                            value={formData.waterMeterId || ''}
                            onChange={handleChange}
                            required={!initialData}
                            style={inline ? { padding: '8px' } : {}}
                        >
                            <option value="">-- Chọn ĐH Nước --</option>
                            {initialData?.waterMeterId && (
                                <option value={initialData.waterMeterId}>
                                    {initialData.waterMeterSerial || `ĐH hiện tại (${initialData.waterMeterId})`}
                                </option>
                            )}
                            {unassignedWaterMeters.map(m => (
                                <option key={m.meterId} value={m.meterId}>{m.serialNumber}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {!formData.svgPath && (
                    <div className={styles.formGroup} style={inline ? { marginBottom: 0, display: 'flex', gap: 12 } : { display: 'flex', gap: 12 }}>
                        <div style={{flex: 1}}>
                            <label htmlFor="width" style={inline ? { fontSize: '13px' } : {}}>{'Chiều dài hiển thị (px)'}</label>
                            {<div style={{color: '#64748b', fontSize: '11px', marginBottom: '4px'}}>* Tự động tính toán khi vẽ sạp.</div>}
                            <input
                                className={styles.input}
                                type="number"
                                id="width"
                                name="width"
                                value={formData.width}
                                onChange={handleChange}
                                max={areaWidth || undefined}
                                disabled
                                title="Vui lòng dùng công cụ Vẽ lại hình dáng để thay đổi kích thước"
                                required
                                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', ...(inline ? { padding: '8px' } : {}) }}
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label htmlFor="height" style={inline ? { fontSize: '13px' } : {}}>{'Chiều rộng hiển thị (px)'}</label>
                            {<div style={{color: '#64748b', fontSize: '11px', marginBottom: '4px'}}>* Tự động tính toán khi vẽ sạp.</div>}
                            <input
                                className={styles.input}
                                type="number"
                                id="height"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                max={areaHeight || undefined}
                                disabled
                                title="Vui lòng dùng công cụ Vẽ lại hình dáng để thay đổi kích thước"
                                required
                                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', ...(inline ? { padding: '8px' } : {}) }}
                            />
                        </div>
                    </div>
                )}
                
                <div className={styles.actions} style={inline ? { marginTop: '16px' } : {}}>
                    <button type="submit" className={styles.btnPrimary} disabled={loading} style={inline ? { flex: 1, padding: '10px' } : {}}>
                        {loading ? 'Đang lưu...' : 'Lưu Sạp'}
                    </button>
                    <button type="button" onClick={onCancel} className={styles.btnSecondary} disabled={loading} style={inline ? { padding: '10px' } : {}}>
                        {'Hủy bỏ'}</button>
                </div>
            </form>
            </div>
        </div>
    );

    if (inline) return formInner;

    const modalContent = (
        <div className={styles.overlay} style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {formInner}
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default StallForm;

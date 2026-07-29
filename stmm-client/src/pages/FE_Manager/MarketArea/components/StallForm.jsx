import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createStall, updateStall, updateStallStatus, updateStallLocation, getUnassignedMeters } from '../api/stallApi';
import { getAllCategories } from '../api/categoryApi';
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

    useEffect(() => {
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
                    mapX: initialData.mapX !== undefined ? initialData.mapX : initialData.xAxis,
                    mapY: initialData.mapY !== undefined ? initialData.mapY : initialData.yAxis,
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

    const formInner = (
        <div className={inline ? '' : styles.panel} style={inline ? { display: 'flex', flexDirection: 'column', height: '100%' } : { maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.section} style={inline ? { flex: 1 } : {}}>
                <h2 className={styles.title} style={inline ? { fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' } : {}}>
                    <span>✎</span> {initialData ? 'Chỉnh sửa Sạp' : 'Thêm Sạp mới'}
                </h2>
                {!inline && <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>}
            
            {initialData && initialData.status === 'Available' && (
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
                    <label htmlFor="categoryName" style={inline ? { fontSize: '13px' } : {}}>{'Tên sạp / Ngành hàng (Category)'}<span style={{color: '#ff4d4f'}}>*</span></label>
                    <select
                        className={styles.input}
                        id="categoryName"
                        name="categoryName"
                        value={formData.categoryName}
                        onChange={handleChange}
                        required
                        style={inline ? { padding: '8px' } : {}}
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
                        style={inline ? { padding: '8px' } : {}}
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
                        <option value="Available">Available</option>
                        <option value="Rented">Rented</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>

                {!formData.svgPath && (
                    <div className={styles.formGroup} style={inline ? { marginBottom: 0, display: 'flex', gap: 12 } : { display: 'flex', gap: 12 }}>
                        <div style={{flex: 1}}>
                            <label htmlFor="width" style={inline ? { fontSize: '13px' } : {}}>{'Chiều dài hiển thị (px)'}</label>
                            <input
                                className={styles.input}
                                type="number"
                                id="width"
                                name="width"
                                value={formData.width}
                                onChange={handleChange}
                                max={areaWidth || undefined}
                                title={areaWidth ? `Tối đa ${areaWidth}px (bằng với Khu vực)` : ""}
                                required
                                style={inline ? { padding: '8px' } : {}}
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label htmlFor="height" style={inline ? { fontSize: '13px' } : {}}>{'Chiều rộng hiển thị (px)'}</label>
                            <input
                                className={styles.input}
                                type="number"
                                id="height"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                max={areaHeight || undefined}
                                title={areaHeight ? `Tối đa ${areaHeight}px (bằng với Khu vực)` : ""}
                                required
                                style={inline ? { padding: '8px' } : {}}
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

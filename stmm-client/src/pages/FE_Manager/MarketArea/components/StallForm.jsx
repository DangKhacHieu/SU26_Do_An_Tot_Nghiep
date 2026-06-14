import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createStall, updateStall, updateStallStatus, updateStallLocation } from '../api/stallApi';
import { getAllCategories } from '../api/categoryApi';
import styles from './MarketAreaForm.module.css';

const StallForm = ({ initialData, areaId, areaWidth, areaHeight, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        code: '',
        categoryName: '',
        status: 'Available',
        size: '',
        description: '',
        width: 100,
        height: 100
    });
    const [categories, setCategories] = useState([]);
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
        fetchCats();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code || '',
                categoryName: initialData.categoryName || '',
                status: initialData.status || 'Available',
                size: initialData.size || '',
                description: initialData.description || '',
                width: initialData.width || 100,
                height: initialData.height || 100
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                size: formData.size ? parseFloat(formData.size) : null
            };

            if (initialData?.stallId) {
                await updateStall(initialData.stallId, payload);
                
                let currentWidth = parseFloat(formData.width) || 100;
                let currentHeight = parseFloat(formData.height) || 100;
                
                // Clamp width and height to area bounds if available
                if (areaWidth) currentWidth = Math.min(currentWidth, areaWidth);
                if (areaHeight) currentHeight = Math.min(currentHeight, areaHeight);
                
                if (currentWidth !== initialData.width || currentHeight !== initialData.height) {
                    await updateStallLocation(initialData.stallId, {
                        width: currentWidth,
                        height: currentHeight,
                        mapX: initialData.mapX || 0,
                        mapY: initialData.mapY || 0
                    });
                }
            } else {
                let currentWidth = parseFloat(formData.width) || 100;
                let currentHeight = parseFloat(formData.height) || 100;
                
                // Clamp width and height to area bounds if available
                if (areaWidth) currentWidth = Math.min(currentWidth, areaWidth);
                if (areaHeight) currentHeight = Math.min(currentHeight, areaHeight);

                await createStall({ ...payload, areaId, width: currentWidth, height: currentHeight });
            }
            onSave();
        } catch (err) {
            console.error('Error saving stall:', err);
            setError('Failed to save stall. Please check the inputs.');
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
                    <div className={styles.formGroup}>
                        <label htmlFor="code">Mã sạp (Stall Code) <span style={{color: '#ff4d4f'}}>*</span></label>
                        <input
                            className={styles.input}
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            disabled={!!initialData}
                            title={initialData ? "Không được phép sửa Mã sạp" : ""}
                            placeholder="e.g., A-101"
                            style={{ backgroundColor: initialData ? '#f5f5f5' : 'white', cursor: initialData ? 'not-allowed' : 'text' }}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="categoryName">Tên sạp / Ngành hàng (Category) <span style={{color: '#ff4d4f'}}>*</span></label>
                        <input
                            className={styles.input}
                            type="text"
                            id="categoryName"
                            name="categoryName"
                            value={formData.categoryName}
                            onChange={handleChange}
                            required
                            list="category-suggestions"
                            placeholder="e.g., Fresh Seafood, Fashion..."
                            autoComplete="off"
                        />
                        <datalist id="category-suggestions">
                            {categories.map(c => (
                                <option key={c.categoryId} value={c.name} />
                            ))}
                        </datalist>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description">Người đang thuê (Tenant Name)</label>
                        <input
                            className={styles.input}
                            type="text"
                            id="description"
                            name="description"
                            value={initialData?.tenantName || ''}
                            readOnly
                            disabled
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            placeholder="Chưa có người thuê..."
                            title="Tên người thuê được tự động cập nhật từ hệ thống Hợp đồng"
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="status">Tình trạng (Status) {initialData?.tenantName && <span style={{color: '#ff4d4f', fontSize: 10}}>(Đã khóa bởi Hợp đồng)</span>}</label>
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

                    <div className={styles.formGroup} style={{display: 'flex', gap: 12}}>
                        <div style={{flex: 1}}>
                            <label htmlFor="width">Chiều dài hiển thị (px)</label>
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
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label htmlFor="height">Chiều rộng hiển thị (px)</label>
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
                            />
                        </div>
                    </div>
                    
                    <div className={styles.actions}>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu Sạp'}
                        </button>
                        <button type="button" onClick={onCancel} className={styles.btnSecondary} disabled={loading}>
                            Hủy bỏ
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default StallForm;

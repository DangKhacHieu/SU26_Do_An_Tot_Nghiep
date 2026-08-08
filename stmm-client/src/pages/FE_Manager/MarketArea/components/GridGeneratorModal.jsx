import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import styles from './MarketAreaForm.module.css';
import { getAllCategories } from '../api/categoryApi';

const GridGeneratorModal = ({ onGenerate, onCancel, marketWidth, marketHeight }) => {
  const { t } = useTranslation();

    const [rows, setRows] = useState(2);
    const [cols, setCols] = useState(2);
    const [count, setCount] = useState('');
    const [gap, setGap] = useState(50);
    const [prefix, setPrefix] = useState('Khu');
    const [categoryName, setCategoryName] = useState('');
    const [generateStalls, setGenerateStalls] = useState(true);
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

    const handleGenerate = () => {
        if (rows < 1 || cols < 1) {
            alert(t('gridgeneratormodal.the_number_of_rows'));
            return;
        }
        if (gap < 0) {
            alert(t('gridgeneratormodal.the_distance_cannot_be'));
            return;
        }
        onGenerate({ rows, cols, count, gap, prefix, categoryName, generateStalls });
    };

    return (
        <div className={styles.overlay} style={{ zIndex: 99999 }}>
            <div className={styles.panel} style={{ maxWidth: '400px' }}>
                <div className={styles.section}>
                    <h2 className={styles.title}>🪄 TẠO LƯỚI TỰ ĐỘNG</h2>
                    <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>
                    
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Hệ thống sẽ tự động chia đều mặt bằng chợ ({Math.round(marketWidth)}x{Math.round(marketHeight)} px) thành các khu vực hình chữ nhật bằng nhau.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                            <label>SỐ DÒNG (ROWS)</label>
                            <input 
                                className={styles.input} 
                                type="number" 
                                min="1" max="10"
                                value={rows}
                                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                            />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                            <label>SỐ CỘT (COLS)</label>
                            <input 
                                className={styles.input} 
                                type="number" 
                                min="1" max="10"
                                value={cols}
                                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>SỐ LƯỢNG KHU VỰC CẦN TẠO</label>
                        <input 
                            className={styles.input} 
                            type="number" 
                            min="1"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            placeholder={'Để trống để tạo tối đa theo dòng & cột...'}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>ĐỘ RỘNG LỐI ĐI (GAP - px)</label>
                        <input 
                            className={styles.input} 
                            type="number" 
                            min="0"
                            value={gap}
                            onChange={(e) => setGap(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label>TIỀN TỐ TÊN KHU VỰC</label>
                            <input 
                                className={styles.input} 
                                type="text" 
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value)}
                                placeholder="VD: Khu"
                            />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label>NGÀNH HÀNG</label>
                            <select 
                                className={styles.input} 
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}>
                                <option value="">{'Mặc định'}</option>
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <input 
                            type="checkbox" 
                            id="genStalls"
                            checked={generateStalls}
                            onChange={(e) => setGenerateStalls(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <label htmlFor="genStalls" style={{ margin: 0, cursor: 'pointer', textTransform: 'none', fontWeight: 'bold' }}>{'Tự động sinh Sạp (Stalls) bên trong'}</label>
                    </div>
                </div>

                <div className={styles.actions} style={{ marginTop: '24px' }}>
                    <button className={styles.btnPrimary} onClick={handleGenerate} style={{ background: '#10b981' }}>🪄 TẠO NGAY</button>
                    <button className={styles.btnSecondary} onClick={onCancel}>HỦY BỎ</button>
                </div>
            </div>
        </div>
    );
};

export default GridGeneratorModal;

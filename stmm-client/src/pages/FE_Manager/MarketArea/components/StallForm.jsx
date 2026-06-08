import { useState, useEffect } from 'react';
import { createStall, updateStall } from '../api/stallApi';
import { getAllCategories } from '../api/categoryApi';
import styles from './MarketAreaForm.module.css';

const StallForm = ({ initialData, areaId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        code: '',
        categoryName: '',
        status: 'Available',
        size: ''
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
                size: initialData.size || ''
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
            } else {
                await createStall({ ...payload, areaId });
            }
            onSave();
        } catch (err) {
            console.error('Error saving stall:', err);
            setError('Failed to save stall. Please check the inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.panel}>
                <div className={styles.section}>
                    <h2 className={styles.title}>
                        <span>✎</span> {initialData ? 'Edit Stall' : 'Create New Stall'}
                    </h2>
                    <button onClick={onCancel} style={{position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20}}>&times;</button>
                
                {error && <div style={{color: '#ff4d4f', marginBottom: 16, fontSize: 13}}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="code">Stall Code <span style={{color: '#ff4d4f'}}>*</span></label>
                        <input
                            className={styles.input}
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            placeholder="e.g., A-101"
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="categoryName">Category Name <span style={{color: '#ff4d4f'}}>*</span></label>
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
                        <label htmlFor="status">Status</label>
                        <select
                            className={styles.select}
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Available">Available</option>
                            <option value="Rented">Rented</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="size">Size (m²)</label>
                        <input
                            className={styles.input}
                            type="number"
                            step="0.1"
                            id="size"
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            placeholder="e.g., 20.5"
                        />
                    </div>
                    
                    <div className={styles.actions}>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Stall'}
                        </button>
                        <button type="button" onClick={onCancel} className={styles.btnSecondary} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
};

export default StallForm;

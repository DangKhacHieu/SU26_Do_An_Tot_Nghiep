import { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { 
    getAllStallsByAreaId, 
    updateStallLocation, 
    deactivateStall, 
    updateStallStatus 
} from '../api/stallApi';
import StallForm from './StallForm';
import styles from './StallLayoutEditor.module.css';

const StallLayoutEditor = ({ areaId, areaName, onBack }) => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStall, setSelectedStall] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Size of the area container, e.g., representing the full market area map
    const editorRef = useRef(null);

    useEffect(() => {
        fetchStalls();
    }, [areaId]);

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const data = await getAllStallsByAreaId(areaId);
            setStalls(data);
        } catch (error) {
            console.error('Failed to fetch stalls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStop = async (id, e, d) => {
        // Optimistic UI update
        setStalls(stalls.map(s => s.stallId === id ? { ...s, mapX: d.x, mapY: d.y } : s));
        
        try {
            await updateStallLocation(id, { mapX: d.x, mapY: d.y });
        } catch (error) {
            console.error('Failed to update stall location:', error);
            fetchStalls(); // revert on fail
        }
    };

    const handleResizeStop = async (id, e, direction, ref, delta, position) => {
        const newWidth = parseFloat(ref.style.width);
        const newHeight = parseFloat(ref.style.height);

        // Optimistic UI update
        setStalls(stalls.map(s => s.stallId === id ? { 
            ...s, 
            width: newWidth, 
            height: newHeight,
            mapX: position.x,
            mapY: position.y
        } : s));

        try {
            await updateStallLocation(id, { 
                width: newWidth, 
                height: newHeight,
                mapX: position.x,
                mapY: position.y
            });
        } catch (error) {
            console.error('Failed to update stall size:', error);
            fetchStalls(); // revert on fail
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this stall?')) {
            try {
                await deactivateStall(id);
                fetchStalls();
            } catch (error) {
                console.error('Failed to deactivate stall:', error);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return '#4caf50'; // Green
            case 'Rented': return '#2196f3'; // Blue
            case 'Maintenance': return '#ff9800'; // Orange
            default: return '#9e9e9e'; // Grey
        }
    };

    return (
        <div className={styles.editorContainer}>
            <div style={{position: 'absolute', bottom: 24, right: 24, zIndex: 100}}>
                <button 
                    onClick={() => { setSelectedStall(null); setIsFormOpen(true); }} 
                    style={{background: '#517594', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontSize: 14}}
                >
                    + Add New Stall
                </button>
            </div>

            <div className={styles.gridContainer} ref={editorRef} id="editor-bounds">
                {loading ? (
                    <div className={styles.loading}>Loading stalls...</div>
                ) : (
                    stalls.map(stall => (
                        <Rnd
                            key={stall.stallId}
                            bounds="#editor-bounds"
                            size={{ width: stall.width || 100, height: stall.height || 100 }}
                            position={{ x: stall.mapX || 0, y: stall.mapY || 0 }}
                            onDragStop={(e, d) => handleDragStop(stall.stallId, e, d)}
                            onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(stall.stallId, e, direction, ref, delta, position)}
                            className={styles.stallNode}
                            style={{ borderLeftColor: getStatusColor(stall.status) }}
                        >
                            <div className={styles.stallContent}>
                                <strong>{stall.code}</strong>
                                <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(stall.status) }}>
                                    {stall.status || 'Available'}
                                </span>
                                <div className={styles.stallActions}>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedStall(stall); setIsFormOpen(true); }} className={styles.iconBtn}>
                                        ✎
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(stall.stallId); }} className={styles.iconBtnDanger}>
                                        ×
                                    </button>
                                </div>
                            </div>
                        </Rnd>
                    ))
                )}
            </div>

            {isFormOpen && (
                <StallForm
                    initialData={selectedStall}
                    areaId={areaId}
                    onSave={() => { setIsFormOpen(false); fetchStalls(); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
};

export default StallLayoutEditor;

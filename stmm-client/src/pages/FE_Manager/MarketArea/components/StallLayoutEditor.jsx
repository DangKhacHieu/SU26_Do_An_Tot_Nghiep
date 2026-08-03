import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { 
    getAllStallsByAreaId, 
    updateStallLocation, 
    deactivateStall, 
    updateStallStatus,
    createStall
} from '../api/stallApi';
import { getAreaById } from '../api/marketAreaApi';
import StallForm from './StallForm';
import PolygonDrawer from './PolygonDrawer';
import styles from './StallLayoutEditor.module.css';

const StallLayoutEditor = ({ areaId, areaName, isEditMode, zoom = 1, areaWidth, areaHeight, areaSize, polygonClipPath, svgPath, validateStallBounds, marketCategories }) => {
  const { t } = useTranslation();

    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStall, setSelectedStall] = useState(null);
    const [viewingStall, setViewingStall] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState(null);
    const [renderKey, setRenderKey] = useState(0);
    const [isDrawingStall, setIsDrawingStall] = useState(false);
    const [drawnStallData, setDrawnStallData] = useState(null);
    
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

    // THUẬT TOÁN KIỂM TRA CHỒNG LẤN (COLLISION DETECTION) TẠI FRONTEND
    // Do không sử dụng PostGIS (yêu cầu không thay đổi Database), hệ thống dùng
    // thuật toán Axis-Aligned Bounding Box (AABB) Intersection để phát hiện va chạm sạp.
    const checkStallOverlap = (stallId, minX, minY, maxX, maxY) => {
        return stalls.some(s => {
            if (s.stallId === stallId) return false;
            
            const sMinX = s.mapX || 0;
            const sMinY = s.mapY || 0;
            const sMaxX = sMinX + (s.width || 100);
            const sMaxY = sMinY + (s.height || 100);

            return minX < sMaxX && maxX > sMinX && minY < sMaxY && maxY > sMinY;
        });
    };

    const handleDragStop = async (id, e, d) => {
        const stall = stalls.find(s => s.stallId === id);
        if (!stall) return;
        
        // Don't update if position didn't actually change
        if (stall.mapX === d.x && stall.mapY === d.y) return;

        const width = stall.width || 100;
        const height = stall.height || 100;

        if (validateStallBounds && !validateStallBounds(d.x, d.y, d.x + width, d.y + height)) {
            // RÀNG BUỘC FRONTEND: Sạp phải nằm trong ranh giới (Boundaries) của Khu vực
            setErrorMessage(t('marketFloorPlan.stallEditor.out_bounds_move'));
            setRenderKey(prev => prev + 1); // Force Rnd to revert
            return;
        }

        if (checkStallOverlap(id, d.x, d.y, d.x + width, d.y + height)) {
            setErrorMessage(t('marketFloorPlan.stallEditor.overlap_move'));
            setRenderKey(prev => prev + 1); // Force Rnd to revert
            return;
        }

        // Optimistic UI update
        setStalls(stalls.map(s => s.stallId === id ? { ...s, mapX: d.x, mapY: d.y } : s));
        
        try {
            await updateStallLocation(id, { mapX: d.x, mapY: d.y });
        } catch (error) {
            console.error('Failed to update stall location:', error);
            setErrorMessage(t('marketFloorPlan.stallEditor.resize_error'));
            fetchStalls(); // revert on fail
        }
    };

    const handleResizeStop = async (id, e, direction, ref, delta, position) => {
        const newWidth = parseFloat(ref.style.width);
        const newHeight = parseFloat(ref.style.height);
        
        // TÍNH TOÁN DIỆN TÍCH (SIZE) TỪ CANVAS REAL-TIME
        // Giả lập hệ số Tỷ lệ: PX_PER_M2 = 900 (1 mét vuông = 30x30 pixels)
        // Khi kéo kích thước, tự động quy ra m²
        const PX_PER_M2 = 900;
        const newSize = Math.round((newWidth * newHeight) / PX_PER_M2 * 100) / 100;

        if (validateStallBounds && !validateStallBounds(position.x, position.y, position.x + newWidth, position.y + newHeight)) {
            setErrorMessage(t('marketFloorPlan.stallEditor.out_bounds_resize'));
            setRenderKey(prev => prev + 1); // Force Rnd to revert
            return;
        }

        if (checkStallOverlap(id, position.x, position.y, position.x + newWidth, position.y + newHeight)) {
            setErrorMessage(t('marketFloorPlan.stallEditor.overlap_resize'));
            setRenderKey(prev => prev + 1); // Force Rnd to revert
            return;
        }

        const currentSum = stalls.reduce((sum, s) => s.stallId === id ? sum : sum + (parseFloat(s.size) || 0), 0);
        if (areaSize && newSize + currentSum > parseFloat(areaSize)) {
            setErrorMessage(t('marketFloorPlan.stallEditor.exceeds_size', { max: Math.max(0, Math.round((parseFloat(areaSize) - currentSum) * 100) / 100) }));
            setRenderKey(prev => prev + 1);
            return;
        }

        // Optimistic UI update
        setStalls(stalls.map(s => s.stallId === id ? { 
            ...s, 
            width: newWidth, 
            height: newHeight,
            mapX: position.x,
            mapY: position.y,
            size: newSize
        } : s));

        try {
            await updateStallLocation(id, { 
                width: newWidth, 
                height: newHeight,
                mapX: position.x,
                mapY: position.y,
                size: newSize
            });
        } catch (error) {
            console.error('Failed to update stall size:', error);
            
            // Check if error is due to size validation limit
            if (error.response?.data?.message) {
                setErrorMessage(t('marketFloorPlan.stallEditor.resize_error_msg', { msg: error.response.data.message }));
            } else {
                setErrorMessage(t('marketFloorPlan.stallEditor.resize_error'));
            }
            fetchStalls(); // revert on fail
        }
    };

    const requestDelete = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deactivateStall(deleteConfirmId);
            fetchStalls();
            setDeleteConfirmId(null);
            setDeleteSuccess(t('marketFloorPlan.stallEditor.delete_success'));
            setTimeout(() => setDeleteSuccess(null), 3000);
        } catch (error) {
            console.error('Failed to deactivate stall:', error);
            setDeleteConfirmId(null);
            setErrorMessage(t('marketFloorPlan.stallEditor.delete_error'));
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

    const getStatusText = (status) => {
        switch (status) {
            case 'Available': return t('marketFloorPlan.stallEditor.available');
            case 'Rented': return t('marketFloorPlan.stallEditor.rented');
            case 'Maintenance': return t('marketFloorPlan.stallEditor.maintenance');
            default: return status || t('marketFloorPlan.stallEditor.available');
        }
    };

    const getPolygonFillColor = (status) => {
        switch (status) {
            case 'Available': return '#ffffff'; // White
            case 'Maintenance': return '#facc15'; // Yellow
            case 'Rented': return '#3b82f6'; // Blue
            default: return '#ffffff';
        }
    };

    const getPolygonCentroid = (svgPath) => {
        if (!svgPath) return { x: '50%', y: '50%' };
        const matches = [...svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
        if (matches.length < 3) return { x: '50%', y: '50%' };
        
        let pts = matches.map(m => ({ x: parseFloat(m[1]), y: parseFloat(m[2]) }));
        
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const width = Math.max(...xs) - minX || 1;
        const height = Math.max(...ys) - minY || 1;

        if (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y) {
            pts.push(pts[0]);
        }
        
        let signedArea = 0;
        let cx = 0;
        let cy = 0;
        
        for (let i = 0; i < pts.length - 1; i++) {
            const x0 = pts[i].x;
            const y0 = pts[i].y;
            const x1 = pts[i+1].x;
            const y1 = pts[i+1].y;
            
            const a = x0 * y1 - x1 * y0;
            signedArea += a;
            cx += (x0 + x1) * a;
            cy += (y0 + y1) * a;
        }
        
        signedArea *= 0.5;
        cx = cx / (6 * signedArea);
        cy = cy / (6 * signedArea);
        
        if (signedArea === 0 || isNaN(cx) || isNaN(cy)) {
             return { x: '50%', y: '50%' };
        }
        
        const pctX = ((cx - minX) / width) * 100;
        const pctY = ((cy - minY) / height) * 100;

        return { x: `${pctX}%`, y: `${pctY}%` };
    };

    const getPolygonTextColor = (status) => {
        return status === 'Rented' ? '#ffffff' : '#1e293b'; // White text for blue background, dark otherwise
    };

    const renderDeleteModals = () => {
        let modals = [];
        if (deleteConfirmId) {
            modals.push(
                <div key="confirm" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>🗑️</div>
                        <h3 style={{marginTop: 0, color: 'var(--text-primary)', fontSize: '24px'}}>{t('marketFloorPlan.stallEditor.confirm_delete')}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>{t('marketFloorPlan.stallEditor.confirm_delete_desc')}</p>
                        <div style={{marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16}}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{padding: '10px 24px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>{t('marketFloorPlan.stallEditor.cancel')}</button>
                            <button onClick={confirmDelete} style={{padding: '10px 24px', background: 'var(--danger, #ff4d4f)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)', transition: 'all 0.2s'}}>{t('marketFloorPlan.stallEditor.delete')}</button>
                        </div>
                    </div>
                </div>
            );
        }
        if (errorMessage) {
            modals.push(
                <div key="error" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>⚠️</div>
                        <h3 style={{marginTop: 0, color: 'var(--danger, #ff4d4f)', fontSize: '24px'}}>{t('marketFloorPlan.stallEditor.error')}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>{errorMessage}</p>
                        <div style={{marginTop: 32}}>
                            <button onClick={() => setErrorMessage(null)} style={{padding: '10px 32px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>{t('marketFloorPlan.stallEditor.close')}</button>
                        </div>
                    </div>
                </div>
            );
        }
        if (deleteSuccess) {
            modals.push(
                <div key="success" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
                        <h3 style={{marginTop: 0, color: 'var(--success, #4caf50)', fontSize: '24px'}}>{t('marketFloorPlan.stallEditor.success')}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '15px'}}>{deleteSuccess}</p>
                    </div>
                </div>
            );
        }
        if (modals.length === 0) return null;
        return createPortal(<>{modals}</>, document.body);
    };

    const totalUsedStallArea = stalls.reduce((sum, s) => sum + (parseFloat(s.size) || 0), 0);
    const remainingStallArea = Math.max(0, Math.round(((parseFloat(areaSize) || 0) - totalUsedStallArea) * 100) / 100);

    const isSplitViewActive = isFormOpen || viewingStall || isDrawingStall;

    const modalZoom = (typeof window !== 'undefined' && isSplitViewActive) ? Math.min(Math.max(Math.min((window.innerWidth - 450) / Math.max(areaWidth || 200, 200), (window.innerHeight - 150) / Math.max(areaHeight || 200, 200)), 1), 4) : 1;

    const renderCanvas = (isModal) => (
        <div className={styles.gridContainer} ref={isModal ? editorRef : null} style={isModal ? { width: '100%', height: '100%', overflow: 'hidden', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' } : { width: '100%', height: '100%' }}>
            <div style={isModal ? { width: Math.max(areaWidth || 200, 200), height: Math.max(areaHeight || 200, 200), position: 'relative', background: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid #94a3b8', transform: `scale(${modalZoom})`, transformOrigin: 'center' } : { position: 'relative', width: '100%', height: '100%' }}>
                {svgPath && (() => {
                    const matches = [...svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                    if (matches.length > 0) {
                        const xs = matches.map(m => parseFloat(m[1]));
                        const ys = matches.map(m => parseFloat(m[2]));
                        const pMinX = Math.min(...xs);
                        const pMinY = Math.min(...ys);
                        const pMaxX = Math.max(...xs);
                        const pMaxY = Math.max(...ys);
                        const areaW = pMaxX - pMinX || areaWidth || 1000;
                        const areaH = pMaxY - pMinY || areaHeight || 1000;
                        
                        return (
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: areaW, height: areaH, pointerEvents: 'none', zIndex: 0 }}>
                                <path d={matches.map((m, i) => `${i === 0 ? 'M' : 'L'} ${parseFloat(m[1]) - pMinX},${parseFloat(m[2]) - pMinY}`).join(' ') + ' Z'} 
                                      fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
                            </svg>
                        );
                    }
                    return null;
                })()}
                {loading ? (
                    <div className={styles.loading}>Loading stalls...</div>
                ) : (
                    stalls.map(stallItem => {
                        if (isDrawingStall && selectedStall && stallItem.stallId === selectedStall.stallId) return null;
                        const isActive = (selectedStall && stallItem.stallId === selectedStall.stallId) || (viewingStall && stallItem.stallId === viewingStall.stallId);
                        
                        // If we just redrew this stall, override its shape data with the newly drawn data
                        const stall = (drawnStallData && selectedStall && stallItem.stallId === selectedStall.stallId) 
                            ? { ...stallItem, svgPath: drawnStallData.svgPath, mapX: drawnStallData.minX, mapY: drawnStallData.minY, width: drawnStallData.width, height: drawnStallData.height }
                            : stallItem;
                        
                        return (
                        <Rnd
                            key={`${stall.stallId}-${renderKey}-${isModal ? 'modal' : 'inline'}`}
                            bounds="parent"
                            scale={isModal ? modalZoom : zoom}
                            size={{ width: stall.width || 100, height: stall.height || 100 }}
                            position={{ x: (stall.mapX !== undefined && stall.mapX !== null) ? parseFloat(stall.mapX) : 0, y: (stall.mapY !== undefined && stall.mapY !== null) ? parseFloat(stall.mapY) : 0 }}
                            onDragStop={(e, d) => handleDragStop(e, d, stall)}
                            onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(e, direction, ref, delta, position, stall)}
                            disableDragging={(!isEditMode || !!stall.svgPath) || (!isModal && isSplitViewActive)}
                            enableResizing={isEditMode && !stall.svgPath && (isModal || !isSplitViewActive)}
                            className={`${styles.stallNode} stall-node-prevent-drag`}
                            style={{ 
                                position: 'absolute',
                                border: stall.svgPath ? 'none' : (isActive ? '2px solid #f59e0b' : `1px solid ${getStatusColor(stall.status)}`),
                                cursor: isEditMode && (isModal || !isSplitViewActive) ? 'move' : 'default',
                                zIndex: isActive ? 50 : (isEditMode ? 10 : 1),
                                ...(stall.svgPath ? {
                                    background: 'transparent',
                                    border: 'none',
                                    boxShadow: 'none',
                                    overflow: 'visible',
                                    pointerEvents: 'none'
                                } : {})
                            }}
                        >
                            {stall.svgPath && (
                                <svg 
                                    width="100%" 
                                    height="100%" 
                                    preserveAspectRatio="none" 
                                    viewBox={(() => {
                                        const matches = [...stall.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                                        if(matches.length > 0) {
                                            const xs = matches.map(m => parseFloat(m[1]));
                                            const ys = matches.map(m => parseFloat(m[2]));
                                            const pMinX = Math.min(...xs);
                                            const pMinY = Math.min(...ys);
                                            const pMaxX = Math.max(...xs);
                                            const pMaxY = Math.max(...ys);
                                            return `${pMinX} ${pMinY} ${Math.max(1, pMaxX - pMinX)} ${Math.max(1, pMaxY - pMinY)}`;
                                        }
                                        return `0 0 ${stall.width || 100} ${stall.height || 100}`;
                                    })()} 
                                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
                                >
                                    <path d={stall.svgPath} fill={getPolygonFillColor(stall.status)} fillOpacity={isActive ? 0.8 : 1.0} stroke={isActive ? '#f59e0b' : '#64748b'} strokeWidth={isActive ? "2.5" : "1.5"} vectorEffect="non-scaling-stroke" />
                                </svg>
                            )}
                            <div className={styles.stallContent} style={{ 
                                position: stall.svgPath ? 'absolute' : 'relative', 
                                zIndex: 2,
                                ...(stall.svgPath ? {
                                    left: getPolygonCentroid(stall.svgPath).x,
                                    top: getPolygonCentroid(stall.svgPath).y,
                                    transform: 'translate(-50%, -50%)',
                                    width: 'auto',
                                    height: 'auto',
                                    background: 'transparent',
                                    padding: '0',
                                    margin: '0',
                                    pointerEvents: 'auto'
                                } : {})
                            }}>
                                <strong style={stall.svgPath ? { color: getPolygonTextColor(stall.status), fontSize: '18px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' } : {}}>{stall.code}</strong>
                                {!stall.svgPath && (
                                    <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(stall.status) }}>
                                        {getStatusText(stall.status)}
                                    </span>
                                )}
                                <div className={stall.svgPath ? styles.stallActionsPolygon : styles.stallActions}>
                                    {isEditMode ? (
                                        <>
                                            <button 
                                                className={styles.iconBtn} 
                                                onClick={(e) => { e.stopPropagation(); setSelectedStall(stall); setIsFormOpen(true); }}
                                                title={t('marketFloorPlan.stallEditor.edit_stall')}
                                            >
                                                ✎
                                            </button>
                                            <button 
                                                className={styles.iconBtnDanger} 
                                                onClick={(e) => { e.stopPropagation(); requestDelete(stall.stallId); }}
                                                title={t('marketFloorPlan.stallEditor.delete_stall')}
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            className={styles.iconBtn} 
                                            onClick={(e) => { e.stopPropagation(); setViewingStall(stall); }}
                                            title={t('marketFloorPlan.stallEditor.stall_info')}
                                        >
                                            ℹ
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Rnd>
                        );
                    })
                )}
                
                {drawnStallData && !selectedStall && !isDrawingStall && isFormOpen && (() => {
                    const tempStall = {
                        stallId: 'new-temp',
                        code: t('marketFloorPlan.stallEditor.new_stall'),
                        status: 'Available',
                        svgPath: drawnStallData.svgPath,
                        mapX: drawnStallData.minX,
                        mapY: drawnStallData.minY,
                        width: drawnStallData.width,
                        height: drawnStallData.height
                    };
                    return (
                        <Rnd
                            key="new-temp-stall"
                            bounds="parent"
                            scale={isModal ? modalZoom : zoom}
                            size={{ width: tempStall.width, height: tempStall.height }}
                            position={{ x: tempStall.mapX, y: tempStall.mapY }}
                            disableDragging={true}
                            enableResizing={false}
                            className={`${styles.stallNode} stall-node-prevent-drag`}
                            style={{ 
                                position: 'absolute',
                                border: 'none',
                                cursor: 'default',
                                zIndex: 50,
                                background: 'transparent',
                                boxShadow: 'none',
                                overflow: 'visible'
                            }}
                        >
                            <svg 
                                width="100%" 
                                height="100%" 
                                preserveAspectRatio="none" 
                                viewBox={(() => {
                                    const matches = [...tempStall.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                                    if(matches.length > 0) {
                                        const xs = matches.map(m => parseFloat(m[1]));
                                        const ys = matches.map(m => parseFloat(m[2]));
                                        const pMinX = Math.min(...xs);
                                        const pMinY = Math.min(...ys);
                                        const pMaxX = Math.max(...xs);
                                        const pMaxY = Math.max(...ys);
                                        return `${pMinX} ${pMinY} ${Math.max(1, pMaxX - pMinX)} ${Math.max(1, pMaxY - pMinY)}`;
                                    }
                                    return `0 0 ${tempStall.width} ${tempStall.height}`;
                                })()} 
                                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
                            >
                                <path d={tempStall.svgPath} fill="rgba(59, 130, 246, 0.15)" fillOpacity={0.8} stroke="#f59e0b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                            </svg>
                            <div className={styles.stallContent} style={{ 
                                position: 'absolute', 
                                zIndex: 2,
                                left: getPolygonCentroid(tempStall.svgPath).x,
                                top: getPolygonCentroid(tempStall.svgPath).y,
                                transform: 'translate(-50%, -50%)',
                                width: 'auto',
                                height: 'auto',
                                background: 'transparent',
                                padding: '0',
                                margin: '0',
                                pointerEvents: 'auto'
                            }}>
                                <strong style={{ color: getPolygonTextColor('Available'), fontSize: '18px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{tempStall.code}</strong>
                            </div>
                        </Rnd>
                    );
                })()}

                {isDrawingStall && isModal && (
                    <PolygonDrawer 
                        stallMode={true}
                        cWidth={4000}
                        cHeight={4000}
                        svgOffsetX={2000 - (areaWidth || 0) / 2}
                        svgOffsetY={2000 - (areaHeight || 0) / 2}
                        maxAllowedAreaSize={areaSize}
                        existingAreas={stalls.filter(s => !(selectedStall && s.stallId === selectedStall.stallId))}
                        marketPolygon={(() => {
                            if (!svgPath) {
                                if (!areaWidth || !areaHeight) return null;
                                return [
                                    [0, 0],
                                    [areaWidth, 0],
                                    [areaWidth, areaHeight],
                                    [0, areaHeight]
                                ];
                            }
                            const matches = [...svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                            if (matches.length === 0) return null;
                            return matches.map(m => [
                                parseFloat(m[1]),
                                parseFloat(m[2])
                            ]);
                        })()}
                        onComplete={async (drawnArray) => {
                            if (!Array.isArray(drawnArray)) {
                                drawnArray = [drawnArray];
                            }
                            setIsDrawingStall(false);

                            if (selectedStall && drawnArray.length === 1) {
                                // If redrawing, selectedStall stays active, form opens to update it.
                                setDrawnStallData(drawnArray[0]);
                                setIsFormOpen(true);
                            } else if (drawnArray.length > 0) {
                                // Bulk create new stalls
                                setLoading(true);
                                try {
                                    let areaCat = '';
                                    try {
                                        const areaData = await getAreaById(areaId);
                                        if (areaData && areaData.categoryName) {
                                            areaCat = areaData.categoryName;
                                        }
                                    } catch (err) {
                                        console.error('Failed to fetch area category', err);
                                    }
                                    
                                    for (let i = 0; i < drawnArray.length; i++) {
                                        const data = drawnArray[i];
                                        const size = Math.round((data.areaM2 || 0) * 100) / 100;
                                        await createStall({
                                            areaId,
                                            status: 'Available',
                                            categoryName: areaCat,
                                            size: size,
                                            width: data.width,
                                            height: data.height,
                                            mapX: data.minX,
                                            mapY: data.minY,
                                            svgPath: data.svgPath,
                                            electricityMeterId: null,
                                            waterMeterId: null
                                        });
                                    }
                                    await fetchStalls();
                                } catch (error) {
                                    console.error('Failed to bulk create stalls:', error);
                                    let errorMsg = error.message;
                                    if (error.response?.data?.errors) {
                                        errorMsg = Object.values(error.response.data.errors).flat().join(' ');
                                    } else if (error.response?.data?.message) {
                                        errorMsg = error.response.data.message;
                                    }
                                    setErrorMessage(t('marketFloorPlan.stallEditor.error') + ': ' + errorMsg);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        onCancel={() => {
                            setIsDrawingStall(false);
                            if (selectedStall) {
                                setIsFormOpen(true);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );

    const inlineContent = (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255, 255, 255, 0.95)', padding: '6px 12px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, zIndex: 200, border: '1px solid var(--border-color)', width: 'max-content', backdropFilter: 'blur(4px)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.stallEditor.area_label')}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{areaSize} m²</strong>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.stallEditor.used_label')}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{Math.round(totalUsedStallArea * 100) / 100} m²</strong>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: remainingStallArea > 0 ? '#eab308' : '#ef4444' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.stallEditor.empty_label')}</span>
                  <strong style={{ color: remainingStallArea > 0 ? 'var(--text-primary)' : '#ef4444' }}>{remainingStallArea} m²</strong>
               </div>

               {isEditMode && !isSplitViewActive && (
                  <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedStall(null); setDrawnStallData(null); setIsDrawingStall(true); }} 
                      style={{background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '8px', fontSize: '13px'}}
                  >
                      <i className="fa-solid fa-plus" style={{marginRight: 4}}></i> {t('marketFloorPlan.stallEditor.draw_new')}
                  </button>
               )}
            </div>
            <div className={styles.editorContainer} style={{ width: '100%', height: '100%' }}>
                {renderCanvas(false)}
            </div>
        </div>
    );

    const modalContent = isSplitViewActive ? (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', padding: '32px' }}>
            <div className={styles.splitContainer} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                {/* LEFT PANEL */}
                <div className={styles.leftPanel} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                        <h2 style={{ margin: 0, fontSize: 18, color: 'var(--color-primary)' }}>{areaName || t('marketFloorPlan.viewer.areas')}</h2>
                        <button onClick={() => { setIsFormOpen(false); setViewingStall(null); setIsDrawingStall(false); setDrawnStallData(null); setSelectedStall(null); }} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>&times;</button>
                    </div>

                    {(isFormOpen && isEditMode) ? (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <StallForm 
                                inline={true}
                                initialData={selectedStall} 
                                drawnData={drawnStallData}
                                areaId={areaId}
                                areaWidth={areaWidth}
                                areaHeight={areaHeight}
                                areaSize={areaSize || 1000}
                                existingStalls={stalls}
                                marketCategories={marketCategories}
                                onSave={() => {
                                    setIsFormOpen(false);
                                    setDrawnStallData(null);
                                    fetchStalls();
                                }}
                                onCancel={() => {
                                    setIsFormOpen(false);
                                    setDrawnStallData(null);
                                }}
                                onRedrawShape={() => {
                                    setIsFormOpen(false);
                                    setIsDrawingStall(true);
                                }}
                            />
                        </div>
                    ) : viewingStall ? (
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
                            <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏪</div>
                                <h3 style={{margin: 0, color: 'var(--color-primary)', fontSize: '20px'}}>{viewingStall.code}</h3>
                                <div style={{marginTop: '8px'}}>
                                    <span style={{display: 'inline-block', backgroundColor: getStatusColor(viewingStall.status), color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                                        {getStatusText(viewingStall.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>{t('marketFloorPlan.stallEditor.category')}</span>
                                    <span style={{fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px'}}>{viewingStall.categoryName || t('marketFloorPlan.stallEditor.none')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>{t('marketFloorPlan.stallEditor.tenant')}</span>
                                    <span style={{fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px'}}>{viewingStall.tenantName || viewingStall.description || t('marketFloorPlan.stallEditor.empty')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>{t('marketFloorPlan.stallEditor.size_wh')}</span>
                                    <span style={{fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px'}}>{viewingStall.width} x {viewingStall.height}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>{t('marketFloorPlan.stallEditor.area')}</span>
                                    <span style={{fontWeight: 'bold', fontSize: '14px', color: '#10b981'}}>{viewingStall.size} m²</span>
                                </div>
                            </div>
                            
                            <div style={{marginTop: 'auto', padding: '16px', background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                <h4 style={{margin: '0 0 12px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span>⚡</span> {t('marketFloorPlan.stallEditor.utilities')}
                                </h4>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                    <div style={{background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
                                        <div style={{fontSize: '11px', color: '#64748b', marginBottom: '4px'}}>{t('marketFloorPlan.stallEditor.elec_meter')}</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                                            <strong style={{fontSize: '13px', color: '#1e293b'}}>{viewingStall.electricityMeterSerial || t('marketFloorPlan.stallEditor.not_installed')}</strong>
                                            <span style={{color: '#3b82f6', fontWeight: 'bold', fontSize: '14px'}}>{viewingStall.currentElectricityIndex ?? 0} kWh</span>
                                        </div>
                                    </div>
                                    <div style={{background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
                                        <div style={{fontSize: '11px', color: '#64748b', marginBottom: '4px'}}>{t('marketFloorPlan.stallEditor.water_meter')}</div>
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                                            <strong style={{fontSize: '13px', color: '#1e293b'}}>{viewingStall.waterMeterSerial || t('marketFloorPlan.stallEditor.not_installed')}</strong>
                                            <span style={{color: '#06b6d4', fontWeight: 'bold', fontSize: '14px'}}>{viewingStall.currentWaterIndex ?? 0} m³</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.stallEditor.select_tool')}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL */}
                <div className={styles.rightPanel}>
                    {renderCanvas(true)}
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            {inlineContent}
            {isSplitViewActive && createPortal(modalContent, document.body)}
            {renderDeleteModals()}
        </>
    );
};

export default StallLayoutEditor;

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { 
    getAllStallsByAreaId, 
    updateStallLocation, 
    deactivateStall, 
    updateStallStatus 
} from '../api/stallApi';
import StallForm from './StallForm';
import PolygonDrawer from './PolygonDrawer';
import styles from './StallLayoutEditor.module.css';

const StallLayoutEditor = ({ areaId, areaName, isEditMode, zoom = 1, areaWidth, areaHeight, areaSize, polygonClipPath, svgPath, validateStallBounds }) => {
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

    // Helper to check collision between stalls
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

        if (checkStallOverlap(id, d.x, d.y, d.x + width, d.y + height)) {
            setErrorMessage('Không thể di chuyển: Sạp này bị chồng lấp lên Sạp khác!');
            setRenderKey(prev => prev + 1); // Force Rnd to revert
            return;
        }

        // Optimistic UI update
        setStalls(stalls.map(s => s.stallId === id ? { ...s, mapX: d.x, mapY: d.y } : s));
        
        try {
            await updateStallLocation(id, { mapX: d.x, mapY: d.y });
        } catch (error) {
            console.error('Failed to update stall location:', error);
            setErrorMessage('Có lỗi xảy ra khi lưu kích thước sạp.');
            fetchStalls(); // revert on fail
        }
    };

    const handleResizeStop = async (id, e, direction, ref, delta, position) => {
        const newWidth = parseFloat(ref.style.width);
        const newHeight = parseFloat(ref.style.height);
        
        const PX_PER_M2 = 900;
        const newSize = Math.round((newWidth * newHeight) / PX_PER_M2 * 100) / 100;

        if (checkStallOverlap(id, position.x, position.y, position.x + newWidth, position.y + newHeight)) {
            setErrorMessage('Không thể thay đổi kích thước: Sạp này bị chồng lấp lên Sạp khác!');
            setRenderKey(prev => prev + 1); // Force Rnd to revert
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
                setErrorMessage('Không thể thay đổi kích thước sạp: ${error.response.data.message}');
            } else {
                setErrorMessage('Có lỗi xảy ra khi lưu kích thước sạp.');
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
            setDeleteSuccess('Đã xóa sạp thành công!');
            setTimeout(() => setDeleteSuccess(null), 3000);
        } catch (error) {
            console.error('Failed to deactivate stall:', error);
            setDeleteConfirmId(null);
            setErrorMessage('Không thể xóa sạp này! Sạp đang có hợp đồng hiệu lực (có người thuê).');
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
        
        return { x: cx, y: cy };
    };

    const getPolygonTextColor = (status) => {
        return status === 'Rented' ? '#ffffff' : '#1e293b'; // White text for blue background, dark otherwise
    };

    const renderViewModal = () => {
        if (!viewingStall) return null;
        
        const modalContent = (
            <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', position: 'relative'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                        <h3 style={{margin: 0, color: 'var(--color-primary)', fontSize: '20px'}}>{'Thông tin Sạp'}</h3>
                        <button onClick={() => setViewingStall(null)} style={{background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)'}}>&times;</button>
                    </div>
                    <div style={{marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        <div style={{fontSize: '15px'}}><strong>{'Mã sạp:'}</strong> {viewingStall.code}</div>
                        <div style={{fontSize: '15px'}}><strong>{'Ngành hàng:'}</strong> {viewingStall.categoryName || 'Không có'}</div>
                        <div style={{fontSize: '15px'}}><strong>{'Tình trạng:'}</strong> <span style={{backgroundColor: getStatusColor(viewingStall.status), color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', marginLeft: '8px', fontWeight: 'bold'}}>{viewingStall.status}</span></div>
                        <div style={{fontSize: '15px'}}><strong>{'Người thuê:'}</strong> {viewingStall.tenantName || viewingStall.description || 'Trống'}</div>
                        <div style={{fontSize: '15px'}}><strong>{'Kích thước (WxH):'}</strong> {viewingStall.width} x {viewingStall.height}</div>
                        
                        <div style={{marginTop: '8px', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                            <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)'}}>{'⚡ Tiện ích (Điện / Nước)'}</h4>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <div style={{fontSize: '14px', display: 'flex', justifyContent: 'space-between'}}>
                                    <span>{'Mã đồng hồ điện:'}<strong>{viewingStall.electricityMeterSerial || 'Chưa lắp'}</strong></span>
                                    <span>{'Chỉ số:'}<strong>{viewingStall.currentElectricityIndex ?? 0} kWh</strong></span>
                                </div>
                                <div style={{fontSize: '14px', display: 'flex', justifyContent: 'space-between'}}>
                                    <span>{'Mã đồng hồ nước:'}<strong>{viewingStall.waterMeterSerial || 'Chưa lắp'}</strong></span>
                                    <span>{'Chỉ số:'}<strong>{viewingStall.currentWaterIndex ?? 0} m³</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '32px'}}>
                        <button onClick={() => setViewingStall(null)} style={{padding: '10px 24px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>{'Đóng'}</button>
                    </div>
                </div>
            </div>
        );
        return createPortal(modalContent, document.body);
    };

    const renderDeleteModals = () => {
        let modals = [];
        if (deleteConfirmId) {
            modals.push(
                <div key="confirm" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>🗑️</div>
                        <h3 style={{marginTop: 0, color: 'var(--text-primary)', fontSize: '24px'}}>{'Xác nhận xóa Sạp'}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>{'Bạn có chắc chắn muốn xóa sạp này không?'}<br/>{'Hành động này không thể hoàn tác.'}</p>
                        <div style={{marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16}}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{padding: '10px 24px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>{'Hủy'}</button>
                            <button onClick={confirmDelete} style={{padding: '10px 24px', background: 'var(--danger, #ff4d4f)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)', transition: 'all 0.2s'}}>{'Xóa Sạp'}</button>
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
                        <h3 style={{marginTop: 0, color: 'var(--danger, #ff4d4f)', fontSize: '24px'}}>{'Lỗi'}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>{errorMessage}</p>
                        <div style={{marginTop: 32}}>
                            <button onClick={() => setErrorMessage(null)} style={{padding: '10px 32px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>{'Đóng'}</button>
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
                        <h3 style={{marginTop: 0, color: 'var(--success, #4caf50)', fontSize: '24px'}}>{'Thành công!'}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '15px'}}>{deleteSuccess}</p>
                    </div>
                </div>
            );
        }
        if (modals.length === 0) return null;
        return createPortal(<>{modals}</>, document.body);
    };

    return (
        <div className={styles.editorContainer}>
            {isEditMode && (
              <div style={{position: 'absolute', bottom: 8, right: 8, zIndex: 100, display: 'flex', gap: 8}}>
                  <button 
                      onClick={() => setIsDrawingStall(true)} 
                      style={{background: 'var(--color-secondary, #64748b)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(81, 117, 148, 0.4)', fontSize: 11}}
                  >
                      🖊️ VẼ SẠP
                  </button>
                  <button 
                      onClick={() => { setSelectedStall(null); setDrawnStallData(null); setIsFormOpen(true); }} 
                      style={{background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(81, 117, 148, 0.4)', fontSize: 11}}
                  >
                      + THÊM SẠP
                  </button>
              </div>
            )}

            <div className={styles.gridContainer} ref={editorRef}>
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
                    stalls.map(stall => (
                        <Rnd
                            key={`${stall.stallId}-${renderKey}`}
                            bounds="parent"
                            scale={zoom}
                            size={{ width: stall.width || 100, height: stall.height || 100 }}
                            position={{ x: stall.mapX || 0, y: stall.mapY || 0 }}
                            onDragStop={(e, d) => handleDragStop(stall.stallId, e, d)}
                            onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(stall.stallId, e, direction, ref, delta, position)}
                            disableDragging={!isEditMode}
                            enableResizing={isEditMode}
                            className={`${styles.stallNode} stall-node-prevent-drag`}
                            style={{ 
                                borderLeftColor: stall.svgPath ? 'transparent' : getStatusColor(stall.status),
                                cursor: isEditMode ? 'move' : 'default',
                                zIndex: isEditMode ? 10 : 1,
                                ...(stall.svgPath ? {
                                    background: 'transparent',
                                    border: 'none',
                                    boxShadow: 'none',
                                    overflow: 'visible'
                                } : {})
                            }}
                        >
                            {stall.svgPath && (
                                <svg width={stall.width || 100} height={stall.height || 100} viewBox={`0 0 ${stall.width || 100} ${stall.height || 100}`} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                                    <path d={stall.svgPath} fill={getPolygonFillColor(stall.status)} fillOpacity={1.0} stroke="#64748b" strokeWidth="1.5" />
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
                                        {stall.status || 'Available'}
                                    </span>
                                )}
                                <div className={stall.svgPath ? styles.stallActionsPolygon : styles.stallActions}>
                                    {isEditMode ? (
                                        <>
                                            <button 
                                                className={styles.iconBtn} 
                                                onClick={(e) => { e.stopPropagation(); setSelectedStall(stall); setIsFormOpen(true); }}
                                                title={'Sửa Sạp'}
                                            >
                                                ✎
                                            </button>
                                            <button 
                                                className={styles.iconBtnDanger} 
                                                onClick={(e) => { e.stopPropagation(); requestDelete(stall.stallId); }}
                                                title={'Xóa Sạp'}
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            className={styles.iconBtn} 
                                            onClick={(e) => { e.stopPropagation(); setViewingStall(stall); }}
                                            title={'Thông tin Sạp'}
                                        >
                                            ℹ
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Rnd>
                    ))
                )}
            </div>

            {isFormOpen && (
                <StallForm 
                    initialData={selectedStall} 
                    drawnData={drawnStallData}
                    areaId={areaId}
                    areaWidth={areaWidth}
                    areaHeight={areaHeight}
                    areaSize={1000} // Temporary fallback if areaSize isn't passed
                    onSave={() => {
                        setIsFormOpen(false);
                        setDrawnStallData(null);
                        fetchStalls();
                    }}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setDrawnStallData(null);
                    }}
                />
            )}

            {isDrawingStall && (
                <PolygonDrawer 
                    stallMode={true}
                    cWidth={4000}
                    cHeight={4000}
                    svgOffsetX={2000 - (areaWidth || 0) / 2}
                    svgOffsetY={2000 - (areaHeight || 0) / 2}
                    maxAllowedAreaSize={areaSize}
                    existingAreas={stalls}
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
                        const xs = matches.map(m => parseFloat(m[1]));
                        const ys = matches.map(m => parseFloat(m[2]));
                        const pMinX = Math.min(...xs);
                        const pMinY = Math.min(...ys);
                        return matches.map(m => [
                            parseFloat(m[1]) - pMinX,
                            parseFloat(m[2]) - pMinY
                        ]);
                    })()}
                    onComplete={(drawData) => {
                        setDrawnStallData(drawData);
                        setIsDrawingStall(false);
                        setSelectedStall(null);
                        setIsFormOpen(true);
                    }}
                    onCancel={() => setIsDrawingStall(false)}
                />
            )}
            
            {renderViewModal()}
            {renderDeleteModals()}
        </div>
    );
};

export default StallLayoutEditor;

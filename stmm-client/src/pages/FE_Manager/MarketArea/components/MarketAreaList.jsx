import React, { useState, useEffect } from 'react';
import styles from './MarketAreaList.module.css';
import MarketAreaForm from './MarketAreaForm';
import { getAllAreas, createArea, updateArea, deleteArea } from '../api/marketAreaApi';
import { Rnd } from 'react-rnd';
import StallLayoutEditor from './StallLayoutEditor';

const MarketAreaList = () => {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null); // For editing
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedAreas, setExpandedAreas] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [infoArea, setInfoArea] = useState(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const data = await getAllAreas(1); 
      setAreas(data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handleAddNew = () => {
    setSelectedArea(null);
    setIsFormVisible(true);
  };

  const handleEdit = (e, area) => {
    e.stopPropagation();
    setSelectedArea(area);
    setIsFormVisible(true);
  };

  const requestDelete = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteArea(deleteConfirmId);
      fetchAreas();
      if(selectedArea && selectedArea.areaId === deleteConfirmId) {
        setIsFormVisible(false);
      }
      setDeleteConfirmId(null);
      setDeleteSuccess('Đã xóa khu vực thành công!');
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting area:', error);
      setDeleteConfirmId(null);
      setDeleteError('Không thể xóa khu vực này! Có thể bên trong khu vực đang có sạp được thuê.');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedArea) {
        const updatePayload = {
          name: formData.name,
          description: formData.description,
          categoryName: formData.categoryName,
          minX: selectedArea.minX,
          minY: selectedArea.minY,
          maxX: selectedArea.minX !== null ? selectedArea.minX + formData.width : formData.width,
          maxY: selectedArea.minY !== null ? selectedArea.minY + formData.height : formData.height
        };
        await updateArea(selectedArea.areaId, updatePayload);
      } else {
        // Create new area. Place it at some default coordinates if we want, 
        // but backend expects minX, minY, maxX, maxY.
        const createPayload = {
          name: formData.name,
          description: formData.description,
          categoryName: formData.categoryName,
          marketId: 1, // default market for now
          minX: 24, // default starting X
          minY: 24, // default starting Y
          maxX: 24 + formData.width,
          maxY: 24 + formData.height
        };
        await createArea(createPayload);
      }
      setIsFormVisible(false);
      fetchAreas();
    } catch (error) {
      console.error('Error saving area:', error);
    }
  };

  const toggleAreaExpand = (e, areaId) => {
    e.stopPropagation();
    setExpandedAreas(prev => 
      prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]
    );
  };



  // Drag and Drop handlers
  const handleDragStop = async (e, d, area) => {
    try {
      // Don't update if position didn't actually change
      if (area.minX === d.x && area.minY === d.y) return;
      
      const width = (area.maxX !== null && area.minX !== null) ? (area.maxX - area.minX) : 180;
      const height = (area.maxY !== null && area.minY !== null) ? (area.maxY - area.minY) : 140;

      const updateData = {
        name: area.name,
        description: area.description,
        categoryId: area.categoryId,
        categoryName: area.categoryName,
        minX: d.x,
        minY: d.y,
        maxX: d.x + width,
        maxY: d.y + height
      };

      // Update local state immediately for smooth UI
      setAreas(prev => prev.map(a => a.areaId === area.areaId ? { ...a, ...updateData } : a));

      await updateArea(area.areaId, updateData);
    } catch (error) {
      console.error('Error updating position:', error);
      fetchAreas(); // revert on error
    }
  };

  const handleResizeStop = async (e, direction, ref, delta, position, area) => {
    try {
      const width = parseInt(ref.style.width, 10);
      const height = parseInt(ref.style.height, 10);

      const updateData = {
        name: area.name,
        description: area.description,
        categoryId: area.categoryId,
        categoryName: area.categoryName,
        minX: position.x,
        minY: position.y,
        maxX: position.x + width,
        maxY: position.y + height
      };

      // Update local state immediately for smooth UI
      setAreas(prev => prev.map(a => a.areaId === area.areaId ? { ...a, ...updateData } : a));

      await updateArea(area.areaId, updateData);
    } catch (error) {
      console.error('Error updating size:', error);
      fetchAreas(); // revert on error
    }
  };

  return (
      <div className={styles.main}>
        {/* Form Panel */}
        {isFormVisible && (
          <MarketAreaForm 
            initialData={selectedArea} 
            existingAreas={areas}
            onSave={handleSave} 
            onCancel={() => setIsFormVisible(false)} 
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🗑️</div>
              <h3 style={{marginTop: 0, color: 'var(--text-primary)', fontSize: '24px'}}>Xác nhận xóa Khu vực</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>Bạn có chắc chắn muốn xóa khu vực này không?<br/>Hành động này không thể hoàn tác.</p>
              <div style={{display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px'}}>
                <button onClick={() => setDeleteConfirmId(null)} style={{padding: '10px 24px', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>Hủy</button>
                <button onClick={confirmDelete} style={{padding: '10px 24px', border: 'none', background: 'var(--danger, #ff4d4f)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)', transition: 'all 0.2s'}}>Xóa Khu vực</button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {deleteError && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>⚠️</div>
              <h3 style={{marginTop: 0, color: 'var(--danger, #ff4d4f)', fontSize: '24px'}}>Không thể xóa</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>{deleteError}</p>
              <div style={{marginTop: 32}}>
                <button onClick={() => setDeleteError(null)} style={{padding: '10px 32px', border: 'none', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {deleteSuccess && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
              <h3 style={{marginTop: 0, color: 'var(--success, #4caf50)', fontSize: '24px'}}>Thành công!</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '15px'}}>{deleteSuccess}</p>
            </div>
          </div>
        )}

        {/* Area Info Modal */}
        {infoArea && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                <h3 style={{margin: 0, color: 'var(--color-primary)', fontSize: '20px'}}>ℹ️ Thông tin Khu vực</h3>
                <button onClick={() => setInfoArea(null)} style={{background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)'}}>&times;</button>
              </div>
              <div style={{marginTop: '24px'}}>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>Tên khu vực:</strong> {infoArea.name}</p>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>Mô tả:</strong> {infoArea.description || 'Không có mô tả'}</p>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>Kích thước hiển thị:</strong> {infoArea.maxX - infoArea.minX}px x {infoArea.maxY - infoArea.minY}px</p>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '32px'}}>
                <button onClick={() => setInfoArea(null)} style={{padding: '10px 24px', border: 'none', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>Đóng lại</button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.actionsBar}>
          <div>
            <h3 className={styles.sectionTitle}>
               SƠ ĐỒ MẶT BẰNG CHỢ
            </h3>
             <p style={{fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '4px'}}>
               {isEditMode ? 'CHẾ ĐỘ CHỈNH SỬA: Kéo thả khu vực và sạp. Thay đổi kích thước tùy ý.' : 'CHẾ ĐỘ XEM: Chỉ xem sơ đồ, click vào nút (ℹ) trên sạp để xem thông tin chi tiết.'}
             </p>
          </div>
          <div className={styles.actionsRight} style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border-color)', gap: 8}}>
                 <button onClick={handleZoomOut} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'}} title="Thu nhỏ">-</button>
                 <span style={{fontSize: 13, fontWeight: 'bold', minWidth: 45, textAlign: 'center', color: 'var(--text-primary)'}}>{Math.round(zoom * 100)}%</span>
                 <button onClick={handleZoomIn} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'}} title="Phóng to">+</button>
                 <button onClick={handleResetZoom} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, marginLeft: 4, color: 'var(--color-primary)'}} title="Khôi phục">↺</button>
              </div>
              {isEditMode && (
                <button onClick={handleAddNew} style={{background: '#517594', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>+ THÊM KHU VỰC</button>
              )}
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                style={{
                  background: isEditMode ? 'var(--success)' : 'var(--primary)', 
                  color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {isEditMode ? '✓ HOÀN TẤT CHỈNH SỬA' : '✏️ CHỈNH SỬA SƠ ĐỒ'}
              </button>
          </div>
        </div>

        {/* Canvas / List Area */}
        <div className={styles.canvasArea} style={{overflow: 'auto'}}>
          <div className={styles.canvasContainer}>
            <div className={styles.gridBg}>
              <div style={{ position: 'relative', width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                
                {/* 1. Interactive Area Map */}
                {areas.map((area, index) => {
                  const defaultX = (index % 4) * 200 + 24;
                  const defaultY = Math.floor(index / 4) * 160 + 24;
                  const x = area.minX !== null ? area.minX : defaultX;
                  const y = area.minY !== null ? area.minY : defaultY;
                  const width = (area.maxX !== null && area.minX !== null) ? (area.maxX - area.minX) : 180;
                  const height = (area.maxY !== null && area.minY !== null) ? (area.maxY - area.minY) : 140;
                  const isInteractive = isEditMode;

                  return (
                    <Rnd
                      key={area.areaId}
                      size={{ width, height }}
                      position={{ x, y }}
                      onDragStop={(e, d) => handleDragStop(e, d, area)}
                      onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(e, direction, ref, delta, position, area)}
                      dragGrid={[10, 10]}
                      resizeGrid={[10, 10]}
                      scale={zoom}
                      cancel={`.${styles.actionsBar}, .stall-node-prevent-drag, button, input`}
                      disableDragging={!isInteractive}
                      enableResizing={isInteractive}
                      style={{
                        background: 'var(--color-accent-2)', 
                        border: '1px solid var(--color-primary)', 
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: isInteractive ? 'move' : 'default',
                        borderRadius: '8px',
                        transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
                        zIndex: isInteractive ? 50 : 1,
                        color: 'var(--text-primary)',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => { 
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)'; 
                          if(isInteractive) e.currentTarget.style.zIndex = 100; 
                      }}
                      onMouseLeave={(e) => { 
                          e.currentTarget.style.boxShadow = 'none'; 
                          if(isInteractive) e.currentTarget.style.zIndex = 50; 
                      }}
                    >
                      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        {/* Header Bar for Area */}
                        <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', userSelect: 'none', cursor: isInteractive ? 'move' : 'default' }}>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <span title={area.description}>{area.name}</span>
                            <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => toggleAreaExpand(e, area.areaId)} style={{background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px', marginLeft: 8}} title="Bật/Tắt hiển thị Sạp">
                              {expandedAreas.includes(area.areaId) ? '👁 Ẩn sạp' : '👁 Xem sạp'}
                            </button>
                          </div>
                          {isEditMode ? (
                            <div style={{display: 'flex', gap: '4px'}}>
                              <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleEdit(e, area)} style={{background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}} title="Sửa Khu vực">✎</button>
                              <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => requestDelete(e, area.areaId)} style={{background: 'rgba(255,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}} title="Xóa Khu vực">✕</button>
                            </div>
                          ) : (
                            <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setInfoArea(area); }} style={{background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}} title="Thông tin Khu vực">ℹ</button>
                          )}
                        </div>
                        {/* Nested StallLayoutEditor or Empty Info */}
                        {expandedAreas.includes(area.areaId) ? (
                          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <StallLayoutEditor areaId={area.areaId} areaName={area.name} isEditMode={isEditMode} zoom={zoom} areaWidth={width} areaHeight={height} />
                          </div>
                        ) : (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: 12, textAlign: 'center' }}>
                            <div style={{fontSize: 14, fontWeight: 'bold', color: 'var(--color-primary)'}}>{area.name}</div>
                            <div style={{fontSize: 12, marginTop: 4}}>{area.description || 'Chưa có mô tả'}</div>
                            <div style={{fontSize: 11, marginTop: 12, opacity: 0.6}}>(Bấm "👁 Xem sạp" ở góc trên để hiển thị sạp bên trong)</div>
                          </div>
                        )}
                      </div>
                    </Rnd>
                  );
                })}

                {areas.length === 0 && (
                  <div style={{color: 'var(--text-secondary)', position: 'absolute', top: '24px', left: '24px'}}>
                    No areas found. Click NEW_AREA to create one!
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MarketAreaList;

import React, { useState, useEffect } from 'react';
import styles from './MarketAreaList.module.css';
import MarketAreaForm from './MarketAreaForm';
import { getAllAreas, createArea, updateArea, deleteArea } from '../api/marketAreaApi';
import { Rnd } from 'react-rnd';

const DraggableArea = ({ area, index, onDragStop, onResizeStop, onViewStalls, onEdit, onDelete }) => {
  const defaultX = (index % 4) * 200 + 24;
  const defaultY = Math.floor(index / 4) * 160 + 24;

  const initX = area.minX ?? defaultX;
  const initY = area.minY ?? defaultY;
  const initW = (area.maxX != null && area.minX != null) ? (area.maxX - area.minX) : 180;
  const initH = (area.maxY != null && area.minY != null) ? (area.maxY - area.minY) : 140;

  const [pos, setPos] = useState({ x: initX, y: initY });
  const [size, setSize] = useState({ width: initW, height: initH });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e) => {
    // Left click only
    if (e.button !== 0) return;

    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pos.x,
      posY: pos.y
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPos({
      x: dragStart.current.posX + dx,
      y: dragStart.current.posY + dy
    });
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    const finalX = dragStart.current.posX + (e.clientX - dragStart.current.x);
    const finalY = dragStart.current.posY + (e.clientY - dragStart.current.y);
    onDragStop(e, { x: finalX, y: finalY }, area);
  };

  return (
    <Rnd
      size={size}
      position={pos}
      disableDragging={true}
      onResize={(e, direction, ref, delta, position) => {
        setSize({ width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10) });
        setPos(position);
      }}
      onResizeStop={(e, direction, ref, delta, position) => onResizeStop(e, direction, ref, delta, position, area)}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(59,130,246,0.6)',
        borderRadius: '8px',
        zIndex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
    >
      {/* 
        CUSTOM DRAG HANDLE 
        We use raw DOM events here to guarantee dragging works bypassing library bugs.
      */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onViewStalls(area)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'move', zIndex: 1 }}
        title="Double click to view Stalls. Drag to move."
      />

      {/* CONTENT LAYER */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', color: 'white' }}>{area.name}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 8px' }}>{area.description}</div>
      </div>

      {/* ACTION BUTTONS LAYER */}
      <div style={{ position: 'absolute', top: 4, right: 8, display: 'flex', gap: '4px', zIndex: 3 }}>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => onEdit(e, area)} style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Edit Area">✎</button>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => onDelete(e, area)} style={{ background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Delete Area">✕</button>
      </div>
    </Rnd>
  );
};

const MarketAreaList = () => {
  const [activeZone, setActiveZone] = useState('ZONES');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null); // For editing
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [viewingAreaStalls, setViewingAreaStalls] = useState(null); // For drilling down into Stalls
  const [areaToDelete, setAreaToDelete] = useState(null); // For custom delete confirmation
  const [modifiedAreas, setModifiedAreas] = useState({}); // Track changed areas
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const data = await getAllAreas(1);
      setAreas(data || []);
      setModifiedAreas({}); // Reset modifications when fetching fresh data
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

  const handleDeleteClick = (e, area) => {
    e.stopPropagation();
    setAreaToDelete(area);
  };

  const confirmDelete = async () => {
    if (!areaToDelete) return;
    try {
      await deleteArea(areaToDelete.areaId);
      fetchAreas();
      if (selectedArea && selectedArea.areaId === areaToDelete.areaId) {
        setIsFormVisible(false);
      }
      if (viewingAreaStalls && viewingAreaStalls.areaId === areaToDelete.areaId) {
        setViewingAreaStalls(null);
      }
    } catch (err) {
      console.error(err);
    }
    setAreaToDelete(null);
  };

  const cancelDelete = () => {
    setAreaToDelete(null);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedArea) {
        // Update existing area
        await updateArea(selectedArea.areaId, {
          ...selectedArea,
          name: formData.name,
          description: formData.description,
          categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null
        });
      } else {
        // Create new area
        await createArea({ 
          name: formData.name,
          description: formData.description,
          categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
          marketId: 1, // Currently defaulting to Market 1
          minX: 50,    // Default starting positions
          minY: 50,
          maxX: 230,
          maxY: 190
        });
      }
      setIsFormVisible(false);
      fetchAreas();
    } catch (error) {
      console.error('Error saving area:', error);
      alert('Có lỗi xảy ra khi lưu thông tin!');
    }
  };

  const handleViewStalls = (area) => {
    setViewingAreaStalls(area);
  };

  const handleDragStop = (e, d, area) => {
    if (area.minX === d.x && area.minY === d.y) return;
    
    const width = (area.maxX !== null && area.minX !== null) ? (area.maxX - area.minX) : 180;
    const height = (area.maxY !== null && area.minY !== null) ? (area.maxY - area.minY) : 140;

    const updateData = {
      name: area.name,
      description: area.description,
      categoryId: area.categoryId,
      minX: d.x,
      minY: d.y,
      maxX: d.x + width,
      maxY: d.y + height
    };

    setAreas(prev => prev.map(a => a.areaId === area.areaId ? { ...a, ...updateData } : a));
    setModifiedAreas(prev => ({ ...prev, [area.areaId]: updateData }));
  };

  const handleResizeStop = (e, direction, ref, delta, position, area) => {
    const width = parseInt(ref.style.width, 10);
    const height = parseInt(ref.style.height, 10);

    const updateData = {
      name: area.name,
      description: area.description,
      categoryId: area.categoryId,
      minX: position.x,
      minY: position.y,
      maxX: position.x + width,
      maxY: position.y + height
    };

    setAreas(prev => prev.map(a => a.areaId === area.areaId ? { ...a, ...updateData } : a));
    setModifiedAreas(prev => ({ ...prev, [area.areaId]: updateData }));
  };

  const handleSaveLayout = async () => {
    const ids = Object.keys(modifiedAreas);
    if (ids.length === 0) return;
    setIsSavingLayout(true);
    try {
      await Promise.all(ids.map(id => updateArea(id, modifiedAreas[id])));
      setModifiedAreas({});
      // Optional: alert('Lưu sơ đồ thành công!');
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Có lỗi xảy ra khi lưu sơ đồ!');
    } finally {
      setIsSavingLayout(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Delete Confirmation Modal */}
      {areaToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '24px', borderRadius: '8px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Xóa Khu Vực</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Bạn có chắc chắn muốn xóa khu vực <strong>{areaToDelete.name}</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button onClick={cancelDelete} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
              <button onClick={confirmDelete} style={{ padding: '6px 12px', background: 'var(--danger-color)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>M.</span>
          <span>MARKET_AREA_MANAGER</span>
          <span className={styles.brandVersion}>V1.0.4</span>
        </div>
        <nav className={styles.nav}>
          <button className={`${styles.navBtn} ${activeZone === 'OVERVIEW' ? styles.navBtnActive : ''}`} onClick={() => setActiveZone('OVERVIEW')}>OVERVIEW</button>
          <button className={`${styles.navBtn} ${activeZone === 'ZONES' ? styles.navBtnActive : ''}`} onClick={() => setActiveZone('ZONES')}>ZONES</button>
          <button className={`${styles.navBtn} ${activeZone === 'LOGS' ? styles.navBtnActive : ''}`} onClick={() => setActiveZone('LOGS')}>LOGS</button>
        </nav>
        <div className={styles.actions}>
          {!viewingAreaStalls && Object.keys(modifiedAreas).length > 0 && (
            <button 
              onClick={handleSaveLayout} 
              disabled={isSavingLayout} 
              style={{ background: 'var(--success-color)', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
            >
              {isSavingLayout ? 'ĐANG LƯU...' : 'LƯU SƠ ĐỒ'}
            </button>
          )}
          {!viewingAreaStalls && (
            <button onClick={handleAddNew} style={{ background: 'var(--accent-color)', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>NEW_AREA</button>
          )}
        </div>
      </header>

      <div className={styles.main}>
        {/* Form Panel */}
        {isFormVisible && (
          <MarketAreaForm
            initialData={selectedArea}
            onSave={handleSave}
            onCancel={() => setIsFormVisible(false)}
          />
        )}

        {/* Canvas / List Area */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasHeader}>
            <div className={styles.canvasTitle}>
              {viewingAreaStalls ? `CANVAS: STALLS IN ${viewingAreaStalls.name.toUpperCase()}` : 'CANVAS: MAP AREA'}
            </div>
            {viewingAreaStalls && (
              <button
                onClick={() => setViewingAreaStalls(null)}
                style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ← BACK TO AREAS
              </button>
            )}
          </div>
          <div className={styles.canvasContainer}>
            <div className={styles.gridBg}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                {/* 1. Interactive Area Map */}
                {!viewingAreaStalls && areas.map((area, index) => (
                  <DraggableArea
                    key={area.areaId}
                    area={area}
                    index={index}
                    onDragStop={handleDragStop}
                    onResizeStop={handleResizeStop}
                    onViewStalls={handleViewStalls}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}

                {!viewingAreaStalls && areas.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', position: 'absolute', top: '24px', left: '24px' }}>
                    No areas found. Click NEW_AREA to create one!
                  </div>
                )}

                {/* 2. Stalls View (Mock) */}
                {viewingAreaStalls && (
                  <div style={{ color: 'var(--text-secondary)', width: '100%', textAlign: 'center', marginTop: '40px', position: 'absolute' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏬</div>
                    <h3>Khu vực: {viewingAreaStalls.name}</h3>
                    <p>Hiện tại chưa có dữ liệu quầy sạp (Stalls) cho khu vực này.</p>
                    <p>Chúng ta sẽ cần gọi API Stalls từ Backend để đổ dữ liệu vào đây.</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAreaList;

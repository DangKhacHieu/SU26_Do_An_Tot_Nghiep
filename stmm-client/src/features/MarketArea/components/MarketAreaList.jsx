import React, { useState, useEffect } from 'react';
import styles from './MarketAreaList.module.css';
import MarketAreaForm from './MarketAreaForm';
import { getAllAreas, createArea, updateArea, deleteArea } from '../api/marketAreaApi';
import { Rnd } from 'react-rnd';

const MarketAreaList = () => {
  const [activeZone, setActiveZone] = useState('ZONES');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null); // For editing
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [viewingAreaStalls, setViewingAreaStalls] = useState(null); // For drilling down into Stalls

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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(window.confirm('Delete this area?')) {
      try {
        await deleteArea(id);
        fetchAreas();
        if(selectedArea && selectedArea.areaId === id) {
          setIsFormVisible(false);
        }
        if(viewingAreaStalls && viewingAreaStalls.areaId === id) {
          setViewingAreaStalls(null);
        }
      } catch(err) {
        console.error(err);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedArea) {
        await updateArea(selectedArea.areaId, formData);
      } else {
        await createArea({ ...formData, marketId: 1 });
      }
      setIsFormVisible(false);
      fetchAreas();
    } catch (error) {
      console.error('Error saving area:', error);
    }
  };

  const handleViewStalls = (area) => {
    setViewingAreaStalls(area);
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
    <div className={styles.container}>
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
          {!viewingAreaStalls && (
            <button onClick={handleAddNew} style={{background: 'var(--accent-color)', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>NEW_AREA</button>
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
                style={{background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}
              >
                ← BACK TO AREAS
              </button>
            )}
          </div>
          <div className={styles.canvasContainer}>
            <div className={styles.gridBg}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                
                {/* 1. Interactive Area Map */}
                {!viewingAreaStalls && areas.map((area, index) => {
                  // Fallback values if DB doesn't have coordinates yet
                  const defaultX = (index % 4) * 200 + 24;
                  const defaultY = Math.floor(index / 4) * 160 + 24;
                  const x = area.minX !== null ? area.minX : defaultX;
                  const y = area.minY !== null ? area.minY : defaultY;
                  const width = (area.maxX !== null && area.minX !== null) ? (area.maxX - area.minX) : 180;
                  const height = (area.maxY !== null && area.minY !== null) ? (area.maxY - area.minY) : 140;

                  return (
                    <Rnd
                      key={area.areaId}
                      size={{ width, height }}
                      position={{ x, y }}
                      onDragStop={(e, d) => handleDragStop(e, d, area)}
                      onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(e, direction, ref, delta, position, area)}
                      bounds="parent"
                      dragGrid={[10, 10]}
                      resizeGrid={[10, 10]}
                      style={{
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--text-secondary)', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'move',
                        borderRadius: '8px',
                        transition: 'background-color 0.3s, border-color 0.3s',
                        zIndex: 1
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.zIndex = 10; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.zIndex = 1; }}
                    >
                      <div 
                        onDoubleClick={() => handleViewStalls(area)}
                        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        title="Double click to view Stalls"
                      >
                        <div style={{position: 'absolute', top: 8, right: 8, display: 'flex', gap: '4px'}}>
                          <button 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={(e) => handleEdit(e, area)}
                            style={{background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}}
                            title="Edit Area"
                          >
                            ✎
                          </button>
                          <button 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={(e) => handleDelete(e, area.areaId)}
                            style={{background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}}
                            title="Delete Area"
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', userSelect: 'none'}}>{area.name}</div>
                        <div style={{fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 8px', userSelect: 'none'}}>{area.description}</div>
                      </div>
                    </Rnd>
                  );
                })}

                {!viewingAreaStalls && areas.length === 0 && (
                  <div style={{color: 'var(--text-secondary)', position: 'absolute', top: '24px', left: '24px'}}>
                    No areas found. Click NEW_AREA to create one!
                  </div>
                )}

                {/* 2. Stalls View (Mock) */}
                {viewingAreaStalls && (
                  <div style={{color: 'var(--text-secondary)', width: '100%', textAlign: 'center', marginTop: '40px', position: 'absolute'}}>
                    <div style={{fontSize: '40px', marginBottom: '16px'}}>🏬</div>
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

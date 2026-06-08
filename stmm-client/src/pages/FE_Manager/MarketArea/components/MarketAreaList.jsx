import React, { useState, useEffect } from 'react';
import styles from './MarketAreaList.module.css';
import MarketAreaForm from './MarketAreaForm';
import { getAllAreas, createArea, updateArea, deleteArea } from '../api/marketAreaApi';
import { Rnd } from 'react-rnd';
import StallLayoutEditor from './StallLayoutEditor';
import ManagerLayout from './ManagerLayout';

const MarketAreaList = () => {
  const [activeTab, setActiveTab] = useState('ZONES');
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
      const payload = {
        ...formData
      };

      if (selectedArea) {
        const updatePayload = {
          ...payload,
          minX: selectedArea.minX,
          minY: selectedArea.minY,
          maxX: selectedArea.maxX,
          maxY: selectedArea.maxY
        };
        await updateArea(selectedArea.areaId, updatePayload);
      } else {
        await createArea({ ...payload, marketId: 1 });
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
    <ManagerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className={styles.main}>
        {/* Form Panel */}
        {isFormVisible && (
          <MarketAreaForm 
            initialData={selectedArea} 
            onSave={handleSave} 
            onCancel={() => setIsFormVisible(false)} 
          />
        )}

        <div className={styles.actionsBar}>
          <div>
            <h3 className={styles.sectionTitle}>
               {viewingAreaStalls ? `CANVAS: STALLS IN ${viewingAreaStalls.name.toUpperCase()}` : 'MAP LAYOUT'}
            </h3>
            {!viewingAreaStalls && (
               <p style={{fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '4px'}}>
                 Drag and resize areas within the grid. Changes are saved automatically.
               </p>
            )}
          </div>
          <div className={styles.actionsRight}>
            {viewingAreaStalls ? (
                <button 
                  onClick={() => setViewingAreaStalls(null)}
                  style={{background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}
                >
                  ← BACK TO AREAS
                </button>
            ) : (
                <button onClick={handleAddNew} style={{background: '#517594', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>+ NEW AREA</button>
            )}
          </div>
        </div>

        {/* Canvas / List Area */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasContainer}>
            <div className={styles.gridBg}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                
                {/* 1. Interactive Area Map */}
                {areas.map((area, index) => {
                  const defaultX = (index % 4) * 200 + 24;
                  const defaultY = Math.floor(index / 4) * 160 + 24;
                  const x = area.minX !== null ? area.minX : defaultX;
                  const y = area.minY !== null ? area.minY : defaultY;
                  const width = (area.maxX !== null && area.minX !== null) ? (area.maxX - area.minX) : 180;
                  const height = (area.maxY !== null && area.minY !== null) ? (area.maxY - area.minY) : 140;
                  const isActive = viewingAreaStalls && viewingAreaStalls.areaId === area.areaId;

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
                      disableDragging={isActive}
                      style={{
                        background: 'var(--color-accent-2)', 
                        border: '1px solid var(--color-primary)', 
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: isActive ? 'default' : 'move',
                        borderRadius: '8px',
                        transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s',
                        zIndex: isActive ? 50 : 1,
                        color: 'var(--text-primary)',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => { 
                        if(!isActive) {
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)'; 
                          e.currentTarget.style.background = 'var(--color-accent-1)'; 
                          e.currentTarget.style.zIndex = 10; 
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if(!isActive) {
                          e.currentTarget.style.boxShadow = 'none'; 
                          e.currentTarget.style.background = 'var(--color-accent-2)'; 
                          e.currentTarget.style.zIndex = 1; 
                        }
                      }}
                    >
                      {isActive ? (
                        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                          {/* Header Bar for Active Area */}
                          <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                            <span>{area.name} - Editing Stalls</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingAreaStalls(null); }}
                              style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}
                            >
                              Close
                            </button>
                          </div>
                          {/* Nested StallLayoutEditor */}
                          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <StallLayoutEditor areaId={area.areaId} areaName={area.name} />
                          </div>
                        </div>
                      ) : (
                        <div 
                          onDoubleClick={() => handleViewStalls(area)}
                          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                          title="Double click to edit Stalls inside"
                        >
                          <div style={{position: 'absolute', top: 8, right: 8, display: 'flex', gap: '4px'}}>
                            <button 
                              onMouseDown={(e) => e.stopPropagation()} 
                              onClick={(e) => handleEdit(e, area)}
                              style={{background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}}
                              title="Edit Area Details"
                            >
                              ✎
                            </button>
                            <button 
                              onMouseDown={(e) => e.stopPropagation()} 
                              onClick={(e) => handleDelete(e, area.areaId)}
                              style={{background: '#e11d48', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px'}}
                              title="Delete Area"
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{fontWeight: 'bold', marginBottom: '8px', textAlign: 'center', userSelect: 'none', color: 'var(--color-primary)'}}>{area.name}</div>
                          <div style={{fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 8px', userSelect: 'none'}}>{area.description}</div>
                        </div>
                      )}
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
    </ManagerLayout>
  );
};

export default MarketAreaList;

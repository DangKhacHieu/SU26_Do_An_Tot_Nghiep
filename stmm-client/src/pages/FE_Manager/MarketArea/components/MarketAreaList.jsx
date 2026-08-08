import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useRef } from 'react';
import styles from './MarketAreaList.module.css';
import MarketAreaForm from './MarketAreaForm';
import { getAllAreas, createArea, updateArea, deleteArea } from '../api/marketAreaApi';
import { getAllStallsByAreaId } from '../api/stallApi';
import { getAllCategories } from '../api/categoryApi';
import { getAllMarkets, deactivateMarket } from '../../../../services/marketApi';
import { Rnd } from 'react-rnd';
import StallLayoutEditor from './StallLayoutEditor';
import PolygonDrawer from './PolygonDrawer';
import { translateError } from '../../../../utils/errorTranslator';

const MarketAreaList = ({ user }) => {
  const { t } = useTranslation();

  const [areas, setAreas] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [marketSvgPath, setMarketSvgPath] = useState(null);
  const [marketSize, setMarketSize] = useState(0);
  const [marketCategories, setMarketCategories] = useState([]);

  // --- Pan Canvas State ---
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const handlePanStart = (e) => {
    // Only pan if clicking on the background grid (not interacting with Area Rnd components)
    if (e.target.closest('.react-draggable') || e.target.closest('button')) return;
    setIsPanning(true);
    setPanStartX(e.clientX - panOffset.x);
    setPanStartY(e.clientY - panOffset.y);
  };

  const handlePanMove = (e) => {
    if (!isPanning) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - panStartX,
      y: e.clientY - panStartY
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const [selectedArea, setSelectedArea] = useState(null); // For editing
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDrawingMultipleAreas, setIsDrawingMultipleAreas] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // To force re-render when needed
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [infoArea, setInfoArea] = useState(null);
  const [infoAreaStallCount, setInfoAreaStallCount] = useState(null);
  
  // Track hovered area to show action buttons
  const [hoveredAreaId, setHoveredAreaId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [expandedAreas, setExpandedAreas] = useState([]);

  const marketId = user?.marketId;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleResetZoom = () => setZoom(1);

  useEffect(() => {
    if (marketId) {
      fetchMarketStatusAndAreas();
    }
  }, [marketId]);

  const fetchMarketStatusAndAreas = async () => {
    try {
      // 1. Check market status first
      const marketsData = await getAllMarkets();
      const myMarket = marketsData.find(m => m.marketId === marketId);
      setMarketStatus(myMarket?.status || null);
      setMarketSvgPath(myMarket?.svgPath || null);
      setMarketSize(myMarket?.size || 0);

      // 2. Fetch areas
      const data = await getAllAreas(marketId); 
      setAreas(data || []);

      // 3. Fetch categories
      const categoriesData = await getAllCategories();
      setMarketCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await getAllAreas(marketId); 
      setAreas(data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const handleDeactivateMarket = async () => {
    if (!window.confirm(t('marketFloorPlan.areaList.confirm_deactivate'))) return;
    
    try {
      await deactivateMarket(marketId);
      // Update local storage to remove marketId
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        storedUser.marketId = null;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
      
      // Force reload to clear states and get back to market creation
      window.location.reload();
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi khi ngưng hoạt động chợ.';
      setErrorMessage(msg);
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

  const handleShowInfo = async (e, area) => {
    e.stopPropagation();
    setInfoArea(area);
    setInfoAreaStallCount(null); // Set to loading state initially
    try {
      const stalls = await getAllStallsByAreaId(area.areaId);
      setInfoAreaStallCount(stalls.length);
    } catch (error) {
      console.error('Error fetching stalls for area info:', error);
      setInfoAreaStallCount(0); // fallback
    }
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
      setDeleteSuccess(t('marketFloorPlan.areaList.delete_success'));
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting area:', error);
      setDeleteConfirmId(null);
      setErrorMessage(t('marketFloorPlan.areaList.delete_error'));
    }
  };

  const handleSave = async (formData) => {
    try {
      if (selectedArea) {
        const updatePayload = {
          name: formData.name,
          description: formData.description,
          categoryName: formData.categoryName,
          size: formData.size,
          minX: formData.minX !== undefined ? formData.minX : selectedArea.minX,
          minY: formData.minY !== undefined ? formData.minY : selectedArea.minY,
          maxX: formData.maxX !== undefined ? formData.maxX : (formData.minX !== undefined ? formData.minX : selectedArea.minX) + formData.width,
          maxY: formData.maxY !== undefined ? formData.maxY : (formData.minY !== undefined ? formData.minY : selectedArea.minY) + formData.height,
          svgPath: formData.svgPath
        };
        await updateArea(selectedArea.areaId, updatePayload);
      } else {
        const createPayload = {
          name: formData.name,
          description: formData.description,
          categoryName: formData.categoryName,
          size: formData.size,
          marketId: marketId,
          minX: formData.minX !== undefined ? formData.minX : 24,
          minY: formData.minY !== undefined ? formData.minY : 24,
          maxX: formData.maxX !== undefined ? formData.maxX : (formData.minX !== undefined ? formData.minX : 24) + formData.width,
          maxY: formData.maxY !== undefined ? formData.maxY : (formData.minY !== undefined ? formData.minY : 24) + formData.height,
          svgPath: formData.svgPath
        };
        await createArea(createPayload);
      }
      setIsFormVisible(false);
      fetchAreas();
    } catch (error) {
      console.error('Error saving area:', error);
    }
  };

  const handleSaveMultipleAreas = async (polygons) => {
    try {
      let localAreas = [...areas];
      for (let i = 0; i < polygons.length; i++) {
        const p = polygons[i];
        
        let baseName = "Khu vực mới";
        let counter = 1;
        let newName = `${baseName} ${counter}`;
        while (localAreas.some(a => a.name === newName)) {
            counter++;
            newName = `${baseName} ${counter}`;
        }
        localAreas.push({name: newName});
        
        const createPayload = {
          name: newName,
          description: '',
          categoryName: '',
          size: Math.round(p.areaM2 * 100) / 100,
          marketId: marketId,
          minX: p.minX,
          minY: p.minY,
          maxX: p.minX + p.width,
          maxY: p.minY + p.height,
          svgPath: p.svgPath
        };
        await createArea(createPayload);
      }
      setIsDrawingMultipleAreas(false);
      fetchAreas();
    } catch (error) {
      console.error('Error saving multiple areas:', error);
      setErrorMessage(error.message || 'Lỗi khi lưu khu vực mới');
    }
  };

  const categoryColors = {
    'Thời trang': '#9333ea',
    'Ẩm thực': '#eab308',
    'Vui chơi': '#3b82f6',
    'Trang sức': '#ec4899',
    'Đồ gia dụng': '#f97316'
  };

  const getCategoryColor = (name) => {
    return categoryColors[name] || '#10b981';
  };

  const toggleAreaExpand = (e, areaId) => {
    e.stopPropagation();
    setExpandedAreas(prev => 
      prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]
    );
  };

  const getPolygonClipPath = (area) => {
    if (!area.svgPath) return null;
    const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
    if (matches.length === 0) return null;
    const xs = matches.map(m => parseFloat(m[1]));
    const ys = matches.map(m => parseFloat(m[2]));
    const pMinX = Math.min(...xs);
    const pMinY = Math.min(...ys);
    const pMaxX = Math.max(...xs);
    const pMaxY = Math.max(...ys);
    const width = pMaxX - pMinX;
    const height = pMaxY - pMinY;
    
    const points = matches.map(m => {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        const px = ((x - pMinX) / width) * 100;
        const py = ((y - pMinY) / height) * 100;
        return `${px}% ${py}%`;
    });
    return `polygon(${points.join(', ')})`;
  };

  const pointInPolygon = (point, vs) => {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      let xi = vs[i][0], yi = vs[i][1];
      let xj = vs[j][0], yj = vs[j][1];
      let intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const validateStallBounds = (area, x, y, w, h) => {
    if (!area.svgPath) {
        const areaW = (area.maxX !== undefined && area.maxX !== null && area.minX !== undefined && area.minX !== null) ? (parseFloat(area.maxX) - parseFloat(area.minX)) : 180;
        const areaH = (area.maxY !== undefined && area.maxY !== null && area.minY !== undefined && area.minY !== null) ? (parseFloat(area.maxY) - parseFloat(area.minY)) : 140;
        return x >= 0 && y >= 0 && (x + w) <= areaW && (y + h) <= areaH;
    }
    const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
    if (matches.length === 0) return true;
    const xs = matches.map(m => parseFloat(m[1]));
    const ys = matches.map(m => parseFloat(m[2]));
    const pMinX = Math.min(...xs);
    const pMinY = Math.min(...ys);
    
    const polygon = matches.map(m => [
        parseFloat(m[1]) - pMinX,
        parseFloat(m[2]) - pMinY
    ]);
    
    const corners = [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h]
    ];
    
    return corners.every(c => pointInPolygon(c, polygon));
  };

  // Helper to check collision between areas
  const checkOverlap = (areaId, minX, minY, maxX, maxY) => {
    return areas.some((a, index) => {
      if (a.areaId === areaId) return false;
      
      const defaultX = (index % 4) * 200 + 24;
      const defaultY = Math.floor(index / 4) * 160 + 24;

      const aMinX = (a.minX !== undefined && a.minX !== null) ? parseFloat(a.minX) : defaultX;
      const aMinY = (a.minY !== undefined && a.minY !== null) ? parseFloat(a.minY) : defaultY;
      const aWidth = (a.maxX !== undefined && a.maxX !== null && a.minX !== undefined && a.minX !== null) ? (parseFloat(a.maxX) - parseFloat(a.minX)) : 180;
      const aHeight = (a.maxY !== undefined && a.maxY !== null && a.minY !== undefined && a.minY !== null) ? (parseFloat(a.maxY) - parseFloat(a.minY)) : 140;
      const aMaxX = aMinX + aWidth;
      const aMaxY = aMinY + aHeight;

      // AABB Collision logic
      return minX < aMaxX && maxX > aMinX && minY < aMaxY && maxY > aMinY;
    });
  };

  // Tính toán canvas dimensions dựa trên Market Boundary (Không thay đổi theo Area)
  const { cWidth, cHeight, svgOffsetX, svgOffsetY } = React.useMemo(() => {
      let width = 4000;
      let height = 4000;
      let offsetX = 0;
      let offsetY = 0;
      
      if (marketSvgPath) {
          const matches = [...marketSvgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
          if (matches.length > 0) {
              const xs = matches.map(m => parseFloat(m[1]));
              const ys = matches.map(m => parseFloat(m[2]));
              const minX = Math.min(...xs);
              const minY = Math.min(...ys);
              const maxX = Math.max(...xs);
              const maxY = Math.max(...ys);
              
              width = maxX - minX + 100;
              height = maxY - minY + 100;
              offsetX = -minX + 50;
              offsetY = -minY + 50;
          }
      }
      // Không fallback fallback sang areas nữa, marketSvgPath là cố định!
      return { cWidth: width, cHeight: height, svgOffsetX: offsetX, svgOffsetY: offsetY };
  }, [marketSvgPath]);

  // Parse market boundary points
  const marketPolygon = React.useMemo(() => {
    if (!marketSvgPath) return null;
    const matches = [...marketSvgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
    if (matches.length > 0) {
      return matches.map(m => [parseFloat(m[1]), parseFloat(m[2])]);
    }
    return null;
  }, [marketSvgPath]);

  // Categories are now fetched from API

  // Ray-casting algorithm for a single point
  const isPointInPolygon = (point, vs) => {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      let xi = vs[i][0], yi = vs[i][1];
      let xj = vs[j][0], yj = vs[j][1];
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check if a rectangle is fully inside the polygon
  const isRectInsidePolygon = (minX, minY, maxX, maxY, polygon) => {
    if (!polygon || polygon.length < 3) return true; // if no boundary, allow
    // Check 4 corners
    const corners = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY]
    ];
    for (let point of corners) {
      if (!isPointInPolygon(point, polygon)) {
        return false;
      }
    }
    return true;
  };

  // Drag and Drop handlers
  const handleDragStop = async (e, d, area) => {
    try {
      // Revert shift for db
      const dbX = d.x - svgOffsetX;
      const dbY = d.y - svgOffsetY;

      // Don't update if position didn't actually change much (tolerance for accidental clicks)
      if (Math.abs(area.minX - dbX) <= 2 && Math.abs(area.minY - dbY) <= 2) return;
      
      let width = 180;
      let height = 140;

      if (area.maxX !== undefined && area.maxX !== null && area.minX !== undefined && area.minX !== null) {
          width = area.maxX - area.minX;
      } else if (area.svgPath) {
          const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
          if (matches.length > 0) {
              const xs = matches.map(m => parseFloat(m[1]));
              width = Math.max(...xs) - Math.min(...xs);
          }
      }

      if (area.maxY !== undefined && area.maxY !== null && area.minY !== undefined && area.minY !== null) {
          height = area.maxY - area.minY;
      } else if (area.svgPath) {
          const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
          if (matches.length > 0) {
              const ys = matches.map(m => parseFloat(m[2]));
              height = Math.max(...ys) - Math.min(...ys);
          }
      }

      if (!isRectInsidePolygon(dbX, dbY, dbX + width, dbY + height, marketPolygon)) {
          setErrorMessage(t('marketFloorPlan.areaList.move_out_bounds'));
          setRenderKey(prev => prev + 1); // Force Rnd to revert
          return;
      }

      if (checkOverlap(area.areaId, dbX, dbY, dbX + width, dbY + height)) {
          setErrorMessage(t('marketFloorPlan.areaList.move_overlap'));
          setRenderKey(prev => prev + 1); // Force Rnd to revert
          return;
      }

      const updateData = {
        name: area.name,
        description: area.description,
        categoryId: area.categoryId,
        categoryName: area.categoryName,
        size: area.size,
        minX: dbX,
        minY: dbY,
        maxX: dbX + width,
        maxY: dbY + height,
        svgPath: area.svgPath
      };

      // Update local state immediately for smooth UI
      setAreas(prev => prev.map(a => a.areaId === area.areaId ? { ...a, ...updateData } : a));

      await updateArea(area.areaId, updateData);
    } catch (error) {
      console.error('Error updating position:', error);
      setErrorMessage(t('marketFloorPlan.areaList.resize_error'));
      fetchAreas(); // revert on error
    }
  };

  const handleResizeStop = async (e, direction, ref, delta, position, area) => {
    try {
      const dbX = position.x - svgOffsetX;
      const dbY = position.y - svgOffsetY;

      const width = parseInt(ref.style.width, 10);
      const height = parseInt(ref.style.height, 10);
      
      // If position didn't change and size didn't change much, ignore
      let oldWidth = 180;
      let oldHeight = 140;
      if (area.maxX !== undefined && area.maxX !== null && area.minX !== undefined && area.minX !== null) oldWidth = area.maxX - area.minX;
      if (area.maxY !== undefined && area.maxY !== null && area.minY !== undefined && area.minY !== null) oldHeight = area.maxY - area.minY;
      
      if (Math.abs(area.minX - dbX) <= 2 && Math.abs(area.minY - dbY) <= 2 &&
          Math.abs(oldWidth - width) <= 2 && Math.abs(oldHeight - height) <= 2) return;
      
      if (!isRectInsidePolygon(dbX, dbY, dbX + width, dbY + height, marketPolygon)) {
          setErrorMessage(t('marketFloorPlan.areaList.resize_overlap'));
          setRenderKey(prev => prev + 1); // Force Rnd to revert
          return;
      }

      if (checkOverlap(area.areaId, dbX, dbY, dbX + width, dbY + height)) {
          setErrorMessage(t('marketFloorPlan.areaList.resize_overlap'));
          setRenderKey(prev => prev + 1); // Force Rnd to revert
          return;
      }
      
      const PX_PER_M2 = 900;
      const newSize = area.svgPath ? area.size : Math.round((width * height) / PX_PER_M2 * 100) / 100;

      const updateData = {
        name: area.name,
        description: area.description,
        categoryId: area.categoryId,
        categoryName: area.categoryName,
        size: newSize,
        minX: dbX,
        minY: dbY,
        maxX: dbX + width,
        maxY: dbY + height,
        svgPath: area.svgPath
      };

      // Update local state immediately for smooth UI
      setAreas(prev => prev.map(a => a.areaId === area.areaId ? { ...a, ...updateData } : a));

      await updateArea(area.areaId, updateData);
    } catch (error) {
      console.error('Error updating size:', error);
      if (error.response?.data?.message) {
          setErrorMessage(t('marketFloorPlan.areaList.resize_error_msg', { msg: error.response.data.message }));
      } else {
          setErrorMessage(t('marketFloorPlan.areaList.resize_error'));
      }
      fetchAreas(); // revert on error
    }
  };

  const totalUsedArea = React.useMemo(() => {
     let total = 0;
     areas.forEach(a => {
        total += parseFloat(a.size) || 0;
     });
     return Math.round(total * 100) / 100;
  }, [areas]);
  
  const remainingArea = React.useMemo(() => {
     const remaining = marketSize - totalUsedArea;
     return Math.max(0, Math.round(remaining * 100) / 100);
  }, [marketSize, totalUsedArea]);

  return (
      <div className={styles.main}>
        {!marketId && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <h3>{t('marketFloorPlan.areaList.no_areas')}</h3>
            <p>{t('marketFloorPlan.areaList.create_market_first')}</p>
          </div>
        )}
        
        {marketId && marketStatus === 'Pending' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3 style={{ color: 'var(--warning, #faad14)' }}>{t('marketFloorPlan.areaList.market_pending')}</h3>
            <p>{t('marketFloorPlan.areaList.market_pending_desc')}</p>
          </div>
        )}

        {marketId && marketStatus === 'Rejected' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h3 style={{ color: 'var(--danger, #ff4d4f)' }}>{t('marketFloorPlan.areaList.market_rejected')}</h3>
            <p>{t('marketFloorPlan.areaList.market_rejected_desc')}</p>
          </div>
        )}

        {marketId && marketStatus === null && (
           <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <p>{t('marketFloorPlan.areaList.loading_plan')}</p>
           </div>
        )}

        {marketId && marketStatus === 'Active' && (
          <>
            {/* Form Panel */}
        {isFormVisible && (
          <MarketAreaForm 
            initialData={selectedArea} 
            existingAreas={areas}
            onSave={handleSave} 
            onCancel={() => setIsFormVisible(false)} 
            marketPolygon={marketPolygon}
            marketSize={marketSize}
            svgOffsetX={svgOffsetX}
            svgOffsetY={svgOffsetY}
            cWidth={cWidth}
            cHeight={cHeight}
            marketCategories={marketCategories}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🗑️</div>
              <h3 style={{marginTop: 0, color: 'var(--text-primary)', fontSize: '24px'}}>{t('marketFloorPlan.areaList.confirm_delete_area')}</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>{t('marketFloorPlan.areaList.confirm_delete_area_desc')}<br/>{t('marketFloorPlan.areaList.cannot_undo')}</p>
              <div style={{display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px'}}>
                <button onClick={() => setDeleteConfirmId(null)} style={{padding: '10px 24px', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>{t('marketFloorPlan.areaList.cancel')}</button>
                <button onClick={confirmDelete} style={{padding: '10px 24px', border: 'none', background: 'var(--danger, #ff4d4f)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)', transition: 'all 0.2s'}}>{t('marketFloorPlan.areaList.delete_area')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Draw Modal */}
        {isDrawingMultipleAreas && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999}}>
            <PolygonDrawer 
              marketPolygon={marketPolygon}
              existingAreas={areas}
              svgOffsetX={svgOffsetX}
              svgOffsetY={svgOffsetY}
              cWidth={cWidth}
              cHeight={cHeight}
              maxAllowedAreaSize={marketSize}
              allowMultiple={true}
              onComplete={handleSaveMultipleAreas}
              onCancel={() => setIsDrawingMultipleAreas(false)}
            />
          </div>
        )}
        
        {/* Header Actions */}
        {errorMessage && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>⚠️</div>
              <h3 style={{marginTop: 0, color: 'var(--danger, #ff4d4f)', fontSize: '24px'}}>{t('marketFloorPlan.areaList.error')}</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5'}}>{translateError(errorMessage)}</p>
              <div style={{marginTop: 32}}>
                <button onClick={() => setErrorMessage(null)} style={{padding: '10px 32px', border: 'none', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'}}>{t('marketFloorPlan.areaList.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {deleteSuccess && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>✅</div>
              <h3 style={{marginTop: 0, color: 'var(--success, #4caf50)', fontSize: '24px'}}>{t('marketFloorPlan.areaList.success')}</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '15px'}}>{deleteSuccess}</p>
            </div>
          </div>
        )}

        {/* Area Info Modal */}
        {infoArea && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div style={{background: 'var(--bg-panel)', padding: '32px', borderRadius: '16px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                <h3 style={{margin: 0, color: 'var(--color-primary)', fontSize: '20px'}}>{t('marketFloorPlan.areaList.area_info')}</h3>
                <button onClick={() => setInfoArea(null)} style={{background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)'}}>&times;</button>
              </div>
              <div style={{marginTop: '24px'}}>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>{t('marketFloorPlan.areaList.area_name_label')}</strong> {infoArea.name}</p>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>{t('marketFloorPlan.areaList.description_label')}</strong> {infoArea.description || t('marketFloorPlan.areaList.no_description')}</p>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>{t('marketFloorPlan.areaList.category_label')}</strong> {infoArea.categoryName || t('marketFloorPlan.areaList.none')}</p>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>{t('marketFloorPlan.areaList.stall_count_label')}</strong> {infoAreaStallCount === null ? t('marketFloorPlan.areaList.loading') : `${infoAreaStallCount} ${t('marketFloorPlan.areaList.stalls')}`}</p>
                <p style={{margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px'}}><strong>{t('marketFloorPlan.areaList.area_size_label')}</strong> {infoArea.size ? `${infoArea.size} m²` : t('marketFloorPlan.areaList.updating')}</p>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '32px'}}>
                <button onClick={() => setInfoArea(null)} style={{padding: '10px 24px', border: 'none', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>{t('marketFloorPlan.areaList.close')}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '12px 24px', backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.areaList.total_size')}</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{marketSize} m²</strong>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.areaList.planned_size')}</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{totalUsedArea} m²</strong>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: remainingArea > 0 ? '#eab308' : '#ef4444' }}></div>
              <span style={{ color: 'var(--text-secondary)' }}>{t('marketFloorPlan.areaList.empty_size')}</span>
              <strong style={{ fontSize: '16px', color: remainingArea > 0 ? 'var(--text-primary)' : '#ef4444' }}>{remainingArea} m²</strong>
           </div>
        </div>

        <div className={styles.actionsBar}>
          <div>
            <h3 className={styles.sectionTitle}>
               {t('marketFloorPlan.areaList.title')}
            </h3>
             <p style={{fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '4px'}}>
               {isEditMode ? t('marketFloorPlan.areaList.edit_mode_desc') : t('marketFloorPlan.areaList.view_mode_desc')}
             </p>
          </div>
          <div className={styles.actionsRight} style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border-color)', gap: 8}}>
                 <button onClick={handleZoomOut} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'}} title={t('marketFloorPlan.areaList.zoom_out', 'Thu nhỏ')}>-</button>
                 <span style={{fontSize: 13, fontWeight: 'bold', minWidth: 45, textAlign: 'center', color: 'var(--text-primary)'}}>{Math.round(zoom * 100)}%</span>
                 <button onClick={handleZoomIn} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'}} title={t('marketFloorPlan.areaList.zoom_in', 'Phóng to')}>+</button>
                 <button onClick={handleResetZoom} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, marginLeft: 4, color: 'var(--color-primary)'}} title={t('marketFloorPlan.areaList.zoom_reset', 'Khôi phục')}>↺</button>
              </div>
              {isEditMode && (
                <>
                  <button onClick={() => setIsDrawingMultipleAreas(true)} style={{background: '#10b981', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '8px'}}>{t('marketFloorPlan.areaList.draw_multiple_areas', '+ Vẽ nhanh khu vực')}</button>
                  <button onClick={handleAddNew} style={{background: '#517594', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>{t('marketFloorPlan.areaList.add_area')}</button>
                </>
              )}
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                style={{
                  background: isEditMode ? 'var(--success)' : 'var(--primary)', 
                  color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {isEditMode ? '✓ ' + t('marketFloorPlan.areaList.save_changes') : '✏️ ' + t('marketFloorPlan.areaList.edit_plan')}
              </button>
              
              {!isEditMode && (
                <button 
                  onClick={handleDeactivateMarket}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--danger, #ff4d4f)',
                    color: 'var(--danger, #ff4d4f)', 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  🛑 {t('marketFloorPlan.areaList.deactivate')}
                </button>
              )}
          </div>
        </div>


        {/* Canvas / List Area */}
        <div className={styles.canvasArea} style={{ position: 'relative' }}>
          <div 
            ref={containerRef}
            className={styles.canvasContainer} 
            style={{ 
              overflow: 'hidden', 
              flex: 1, 
              position: 'relative',
              cursor: isPanning ? 'grabbing' : 'grab',
              backgroundColor: 'var(--bg-main)'
            }}
            onMouseDown={handlePanStart}
            onMouseLeave={handlePanEnd}
            onMouseUp={handlePanEnd}
            onMouseMove={handlePanMove}
          >
            {/* Map Scale */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 100, background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13, fontWeight: 'bold', color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', pointerEvents: 'none' }}>
                {t('marketFloorPlan.wizard.map_scale', 'Tỉ lệ')} 1:{Math.round(100 / zoom)}
            </div>

            {/* Rulers */}
            <div style={{ position: 'absolute', top: 0, left: 30, right: 0, height: 30, backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', zIndex: 90, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <div style={{ display: 'flex', transform: `translateX(${panOffset.x}px) scale(${zoom})`, transformOrigin: '0 0', height: '100%' }}>
                {Array.from({ length: Math.min(300, Math.max(50, Math.ceil(cWidth / 100))) }).map((_, i) => (
                  <div key={i} style={{ width: 100, flexShrink: 0, borderLeft: '1px solid #cbd5e1', paddingLeft: 4, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 30, left: 0, bottom: 0, width: 30, backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1', zIndex: 90, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', transform: `translateY(${panOffset.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '100%' }}>
                {Array.from({ length: Math.min(300, Math.max(50, Math.ceil(cHeight / 100))) }).map((_, i) => (
                  <div key={i} style={{ height: 100, flexShrink: 0, borderTop: '1px solid #cbd5e1', paddingTop: 4, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>
                    {String.fromCharCode(65 + (i % 26))}{i >= 26 ? Math.floor(i / 26) : ''}
                  </div>
                ))}
              </div>
            </div>
            
            <div 
              className={styles.gridBg} 
              style={{ 
                minWidth: `${cWidth * zoom}px`, 
                minHeight: `${cHeight * zoom}px`, 
                width: `${cWidth * zoom}px`, 
                height: `${cHeight * zoom}px`, 
                position: 'absolute',
                left: 30,
                top: 30,
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.1s',
                backgroundColor: '#f8fafc',
                backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`
              }}
            >
                      <div style={{ position: 'relative', width: `${cWidth}px`, height: `${cHeight}px`, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                        
                        {/* 0. Market Boundary Outline */}
                        {marketSvgPath && (
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                             <g transform={`translate(${svgOffsetX}, ${svgOffsetY})`}>
                                <path d={marketSvgPath} fill="transparent" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
                             </g>
                          </svg>
                        )}

                {/* 1. Interactive Area Map */}
                {areas.map((area, index) => {
                  const defaultX = (index % 4) * 200 + 24;
                  const defaultY = Math.floor(index / 4) * 160 + 24;
                  // For rendering, we shift it by svgOffset so it visually matches the SVG shift
                  const dbX = (area.minX !== undefined && area.minX !== null) ? parseFloat(area.minX) : defaultX;
                  const dbY = (area.minY !== undefined && area.minY !== null) ? parseFloat(area.minY) : defaultY;
                  const x = dbX + svgOffsetX;
                  const y = dbY + svgOffsetY;
                  
                  let width = 180;
                  let height = 140;

                  if (area.svgPath) {
                      const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                      if (matches.length > 0) {
                          const xs = matches.map(m => parseFloat(m[1]));
                          width = Math.max(...xs) - Math.min(...xs);
                          const ys = matches.map(m => parseFloat(m[2]));
                          height = Math.max(...ys) - Math.min(...ys);
                      }
                  } else {
                      if (area.maxX !== undefined && area.maxX !== null && area.minX !== undefined && area.minX !== null) {
                          width = parseFloat(area.maxX) - parseFloat(area.minX);
                      }
                      if (area.maxY !== undefined && area.maxY !== null && area.minY !== undefined && area.minY !== null) {
                          height = parseFloat(area.maxY) - parseFloat(area.minY);
                      }
                  }
                  const isInteractive = isEditMode;

                  return (
                    <Rnd
                      key={`${area.areaId}-${renderKey}`}
                      size={{ width, height }}
                      position={{ x, y }}
                      onDragStop={(e, d) => handleDragStop(e, d, area)}
                      onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(e, direction, ref, delta, position, area)}
                      dragGrid={[10, 10]}
                      resizeGrid={[10, 10]}
                      scale={zoom}
                      cancel={`.${styles.actionsBar}, .stall-node-prevent-drag, button, input`}
                      disableDragging={!isInteractive}
                      enableResizing={isInteractive && !area.svgPath}
                      style={{
                        position: 'absolute',
                        display: 'flex', 
                        flexDirection: 'column',
                        cursor: isInteractive ? 'move' : 'default',
                        transition: 'all 0.2s',
                        zIndex: isInteractive ? (hoveredAreaId === area.areaId ? 100 : 50) : (hoveredAreaId === area.areaId ? 10 : 1),
                        border: area.svgPath ? 'none' : '1px solid #10b981',
                        borderRadius: area.svgPath ? '0' : '2px',
                        background: area.svgPath ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                        pointerEvents: area.svgPath ? 'none' : 'auto',
                      }}
                      onMouseEnter={() => setHoveredAreaId(area.areaId)}
                      onMouseLeave={() => setHoveredAreaId(null)}
                    >
                      {/* Custom Shape Background */}
                      {area.svgPath && (
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1, overflow: 'visible' }} preserveAspectRatio="none" 
                             viewBox={(() => {
                                 const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                                 if(matches.length > 0) {
                                     const xs = matches.map(m => parseFloat(m[1]));
                                     const ys = matches.map(m => parseFloat(m[2]));
                                     const pMinX = Math.min(...xs);
                                     const pMinY = Math.min(...ys);
                                     const pMaxX = Math.max(...xs);
                                     const pMaxY = Math.max(...ys);
                                     return `${pMinX} ${pMinY} ${pMaxX - pMinX} ${pMaxY - pMinY}`;
                                 }
                                 return "0 0 100 100";
                             })()}
                        >
                          <path 
                            d={area.svgPath} 
                            fill={getCategoryColor(area.categoryName)} 
                            fillOpacity="0.15"
                            stroke={getCategoryColor(area.categoryName)} 
                            strokeWidth="3" 
                            strokeDasharray="none" 
                            vectorEffect="non-scaling-stroke" 
                            strokeLinejoin="round" 
                            style={{ pointerEvents: 'auto', cursor: !isEditMode ? 'pointer' : (isInteractive ? 'move' : 'default') }}
                            onClick={(e) => { if (!isEditMode) toggleAreaExpand(e, area.areaId); }}
                          />
                        </svg>
                      )}

                      <div 
                        style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', cursor: !isEditMode ? 'pointer' : 'default', pointerEvents: area.svgPath ? 'none' : 'auto' }}
                        onClick={(e) => { if (!isEditMode && !area.svgPath) toggleAreaExpand(e, area.areaId); }}
                      >
                        {/* Area Label Overlay */}
                        {!expandedAreas.includes(area.areaId) && hoveredAreaId !== area.areaId && (
                          <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              color: area.svgPath ? getCategoryColor(area.categoryName) : 'white',
                              fontWeight: 'bold',
                              fontSize: `${Math.max(Math.min(100, Math.max(14, Math.sqrt(width * height) / 25)), 11 / zoom)}px`,
                              whiteSpace: 'nowrap',
                              textShadow: area.svgPath ? '0px 1px 3px rgba(255,255,255,0.8)' : '0px 1px 4px rgba(0,0,0,0.6)',
                              textAlign: 'center',
                              zIndex: 10
                          }}>
                              <div>{area.name}</div>
                              {area.categoryName && (
                                  <div style={{ fontSize: '0.7em', fontWeight: 'normal', opacity: 0.9, marginTop: '4px' }}>
                                      {area.categoryName} {area.size ? ` - ${area.size} m²` : ''}
                                  </div>
                              )}
                              {!area.categoryName && area.size && (
                                  <div style={{ fontSize: '0.7em', fontWeight: 'normal', opacity: 0.9, marginTop: '2px' }}>
                                      {area.size} m²
                                  </div>
                              )}
                          </div>
                        )}

                        {hoveredAreaId === area.areaId && (
                          <div style={{ 
                            position: 'absolute', 
                            top: expandedAreas.includes(area.areaId) ? -48 : '50%', 
                            left: expandedAreas.includes(area.areaId) ? 'auto' : '50%', 
                            right: expandedAreas.includes(area.areaId) ? 0 : 'auto', 
                            transformOrigin: expandedAreas.includes(area.areaId) ? 'bottom right' : 'center',
                            transform: (expandedAreas.includes(area.areaId) ? '' : 'translate(-50%, -50%) ') + `scale(${1/zoom})`,
                            display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.95)', padding: '4px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 100,
                            pointerEvents: 'auto' 
                          }}>
                            {/* Cầu nối vô hình giúp chống flickr khi di chuột */}
                            {expandedAreas.includes(area.areaId) && (
                               <div style={{ position: 'absolute', top: '100%', right: 0, width: '100%', height: '30px', background: 'transparent' }} />
                            )}
                            <div style={{ padding: '0 8px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', borderRight: '1px solid #e2e8f0' }}>
                              {area.name}
                            </div>
                            
                            <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); toggleAreaExpand(e, area.areaId); }} style={{background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'}} title={expandedAreas.includes(area.areaId) ? t('marketFloorPlan.areaList.hide') : t('marketFloorPlan.areaList.show_stall')}>
                              {expandedAreas.includes(area.areaId) ? `👁️‍🗨️ ${t('marketFloorPlan.areaList.hide')}` : `👁️ ${t('marketFloorPlan.areaList.show_stall')}`}
                            </button>
                            
                            {isEditMode ? (
                              <>
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleEdit(e, area)} style={{background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'}} title={t('marketFloorPlan.areaList.edit')}>✎ {t('marketFloorPlan.areaList.edit')}</button>
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => requestDelete(e, area.areaId)} style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'}} title={t('marketFloorPlan.areaList.delete')}>✕ {t('marketFloorPlan.areaList.delete')}</button>
                              </>
                            ) : (
                              <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleShowInfo(e, area)} style={{background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold'}} title={t('marketFloorPlan.areaList.area_info')}>ℹ {t('marketFloorPlan.areaList.detail')}</button>
                            )}
                          </div>
                        )}
                        
                        {/* Conditionally show StallLayoutEditor only if expanded */}
                        {(isEditMode || zoom > 0.7) && expandedAreas.includes(area.areaId) && (
                          <div style={{ flex: 1, position: 'relative', overflow: 'visible', pointerEvents: 'auto' }}>
                            <StallLayoutEditor 
                              areaId={area.areaId} 
                              areaName={area.name}
                              isEditMode={isEditMode}
                              zoom={zoom}
                              areaWidth={width}
                              areaHeight={height}
                              areaSize={area.size}
                              svgPath={area.svgPath}
                              polygonClipPath={getPolygonClipPath(area)}
                              validateStallBounds={(x, y, w, h) => validateStallBounds(area, x, y, w, h)}
                              marketCategories={marketCategories}
                              isHovered={hoveredAreaId === area.areaId}
                            />
                          </div>
                        )}
                      </div>
                    </Rnd>
                  );
                })}

                {areas.length === 0 && (
                  <div style={{color: 'var(--text-secondary)', position: 'absolute', top: '24px', left: '24px'}}>
                    {t('marketFloorPlan.areaList.no_areas_found')}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
  );
};

export default MarketAreaList;

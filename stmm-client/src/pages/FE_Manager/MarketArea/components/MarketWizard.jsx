import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import styles from './LayoutEditor.module.css';
import { createMarketBulk, getGridPreview } from '../../../../services/marketApi';
import polygonClipping from 'polygon-clipping';
import { getAllCategories } from '../api/categoryApi';
import PolygonDrawer from './PolygonDrawer';

// Helper to check if point is inside polygon (Ray-Casting Algorithm)
function pointInPolygon(point, vs) {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

const getBoundingBox = (points) => {
    if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
};

const pointsToSvgPath = (points, isClosed) => {
    if (!points || points.length === 0) return '';
    const d = points.map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ');
    return isClosed ? `${d} Z` : d;
};

// Calculate polygon area in square pixels (Shoelace formula)
const getPolygonArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i][0] * points[j][1];
        area -= points[j][0] * points[i][1];
    }
    return Math.abs(area / 2.0);
};

// Calculate centroid of a polygon
const getPolygonCentroid = (points) => {
    let x = 0, y = 0, area = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        const factor = (points[i][0] * points[j][1] - points[j][0] * points[i][1]);
        x += (points[i][0] + points[j][0]) * factor;
        y += (points[i][1] + points[j][1]) * factor;
        area += factor;
    }
    area /= 2.0;
    if (area === 0) return points[0]; // fallback
    return [Math.abs(x / (6.0 * area)), Math.abs(y / (6.0 * area))];
};

// Scale a polygon from its centroid by a scaleFactor
const scalePolygon = (points, scaleFactor) => {
    if (!points || points.length === 0) return [];
    const centroid = getPolygonCentroid(points);
    return points.map(p => [
        centroid[0] + (p[0] - centroid[0]) * scaleFactor,
        centroid[1] + (p[1] - centroid[1]) * scaleFactor
    ]);
};

const MarketWizard = ({ onCancel, onComplete }) => {
  const { t } = useTranslation();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isDrawingStall, setIsDrawingStall] = useState(false);

    // Step 1: Market Info & Shape
    const [marketInfo, setMarketInfo] = useState({
        name: '',
        address: '',
        size: '',
        points: [],
        isClosed: false
    });

    // Step 2: Areas (Grid Layout)
    const [areas, setAreas] = useState([]);
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

    const [gridConfig, setGridConfig] = useState({
        rows: 2,
        cols: 2,
        count: '',
        gap: 10,
        prefix: 'Khu',
        categoryName: '',
        startPoint: 'TopLeft',
        orderStrategy: 'RowMajor',
        namingStrategy: 'Numeric',
        generateStalls: false
    });
    
    const [gridStats, setGridStats] = useState(null);
    const [gridError, setGridError] = useState(null);

    // Real-time Preview Debounce Effect
    useEffect(() => {
        if (step !== 2 || !marketInfo.isClosed || marketInfo.points.length < 3) return;

        const timer = setTimeout(async () => {
            setGridError(null);
            try {
                const requestPayload = {
                    rows: gridConfig.rows || 1,
                    cols: gridConfig.cols || 1,
                    aisleWidthPixels: gridConfig.gap || 0,
                    startPoint: gridConfig.startPoint,
                    orderStrategy: gridConfig.orderStrategy,
                    namingStrategy: gridConfig.namingStrategy,
                    prefix: gridConfig.prefix,
                    polygonPoints: marketInfo.points
                };

                const res = await getGridPreview(requestPayload);
                if (res && res.isValid === false) {
                    setGridError(res.errorMessage || t("marketFloorPlan.wizard.err_grid"));
                    setGridStats(res);
                    setAreas([]);
                } else if (res && res.isValid) {
                    setGridStats(res);
                    // Map preview zones back to areas
                    const newAreas = res.zones.map(z => {
                        const bbox = getBoundingBox(z.polygon);
                        // Normalize polygon points to origin (0,0) for svgPath storage
                        // Viewers use translate(minX, minY) + svgPath, so svgPath must be relative
                        const normalizedPoints = z.polygon.map(p => [p[0] - bbox.minX, p[1] - bbox.minY]);
                        return {
                            name: z.name,
                            categoryName: gridConfig.categoryName,
                            points: z.polygon,
                            svgPath: pointsToSvgPath(normalizedPoints, true),
                            minX: bbox.minX,
                            minY: bbox.minY,
                            maxX: bbox.maxX,
                            maxY: bbox.maxY,
                            size: z.areaM2,
                            stalls: [] // Stalls hidden
                        };
                    });
                    setAreas(newAreas);
                }
            } catch (err) {
                console.error("Preview error", err);
                setGridError(t("marketFloorPlan.wizard.err_preview_conn"));
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [step, gridConfig, marketInfo.points, marketInfo.isClosed]);

    // Step 3: Stalls
    const [selectedAreaIndex, setSelectedAreaIndex] = useState(null);
    const [stallsConfig, setStallsConfig] = useState({ prefix: 'S', count: 10, width: 2, height: 2, size: 4 });

    // Drag and Drop State
    const [dragState, setDragState] = useState(null);
    const [editingAreaIndex, setEditingAreaIndex] = useState(null);
    const [editingAreaData, setEditingAreaData] = useState({ name: '', size: '', categoryName: '' });

    const svgRef = useRef(null);

    // Common SVG click handler
    const handleSvgClick = (e) => {
        if (!svgRef.current || isDrawingStall) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / zoom);
        const y = Math.round((e.clientY - rect.top) / zoom);

        if (step === 1 && !marketInfo.isClosed) {
            setMarketInfo(prev => ({ ...prev, points: [...prev.points, [x, y]] }));
        }
    };

    // Drag Handlers
    const handleMouseDown = (type, index, e, initialData) => {
        if (isDrawingStall) return;
        e.stopPropagation(); // Ngăn kích hoạt handleSvgClick
        
        // Chỉ cho phép kéo đúng loại đối tượng theo từng bước
        if (type === 'market' && step !== 1) return;
        if ((type === 'area' || type === 'area-vertex') && step !== 2) return;
        if (type === 'stall' && step !== 3) return;

        if (type === 'area' && step === 2) {
            setSelectedAreaIndex(index);
        }

        setDragState({
            type,
            index,
            startX: e.clientX,
            startY: e.clientY,
            initialData
        });
    };

    const handleGlobalMouseMove = (e) => {
        if (!dragState) return;

        const dx = (e.clientX - dragState.startX) / zoom;
        const dy = (e.clientY - dragState.startY) / zoom;

        if (dragState.type === 'market') {
            const newPoints = dragState.initialData.map(p => [p[0] + dx, p[1] + dy]);
            setMarketInfo(prev => ({ ...prev, points: newPoints }));
        } else if (dragState.type === 'area') {
            const newPoints = dragState.initialData.map(p => [p[0] + dx, p[1] + dy]);
            setAreas(prev => {
                const updated = [...prev];
                updated[dragState.index] = { 
                    ...updated[dragState.index], 
                    points: newPoints 
                };
                return updated;
            });
        } else if (dragState.type === 'area-vertex') {
            const { areaIndex, vertexIndex } = dragState.index;
            setAreas(prev => {
                const updated = [...prev];
                const area = { ...updated[areaIndex] };
                const newPoints = [...area.points];
                newPoints[vertexIndex] = [
                    dragState.initialData.startX + dx, 
                    dragState.initialData.startY + dy
                ];
                area.points = newPoints;
                updated[areaIndex] = area;
                return updated;
            });
        } else if (dragState.type === 'stall') {
            const { areaIndex, stallIndex } = dragState.index;
            setAreas(prev => {
                const updated = [...prev];
                const area = { ...updated[areaIndex] };
                const stalls = [...area.stalls];
                stalls[stallIndex] = {
                    ...stalls[stallIndex],
                    mapX: Math.round(dragState.initialData.mapX + dx),
                    mapY: Math.round(dragState.initialData.mapY + dy)
                };
                area.stalls = stalls;
                updated[areaIndex] = area;
                return updated;
            });
        }
    };

    const handleGlobalMouseUp = () => {
        if (!dragState) return;
        
        // Cập nhật lại bounding box & svgPath sau khi kéo xong
        if (dragState.type === 'area' || dragState.type === 'area-vertex') {
            const indexToUpdate = dragState.type === 'area' ? dragState.index : dragState.index.areaIndex;
            setAreas(prev => {
                const updated = [...prev];
                const area = updated[indexToUpdate];
                const bbox = getBoundingBox(area.points);
                // Normalize svgPath to origin (0,0) - viewers use translate(minX, minY)
                const normalizedPoints = area.points.map(p => [p[0] - bbox.minX, p[1] - bbox.minY]);
                updated[indexToUpdate] = {
                    ...area,
                    svgPath: pointsToSvgPath(normalizedPoints, true),
                    minX: bbox.minX,
                    minY: bbox.minY,
                    maxX: bbox.maxX,
                    maxY: bbox.maxY,
                };
                return updated;
            });
        }
        
        setDragState(null);
    };

    // Step 1 Actions
    const closeMarketShape = () => {
        setMarketInfo(prev => {
            const closed = { ...prev, isClosed: true };
            if (parseFloat(closed.size) > 0) {
                const targetAreaPx = parseFloat(closed.size) * 900;
                const currentAreaPx = getPolygonArea(closed.points);
                if (currentAreaPx > 0) {
                    const scaleFactor = Math.sqrt(targetAreaPx / currentAreaPx);
                    closed.points = scalePolygon(closed.points, scaleFactor);
                }
            }
            return closed;
        });
    };
    
    const resetMarketShape = () => setMarketInfo(prev => ({ ...prev, points: [], isClosed: false }));

    // Hardcode pixelsPerMeter to 30 (30px = 1m -> 900px² = 1m²) to sync with MarketAreaList
    const pixelsPerMeter = 30;

    const handleMarketSizeChange = (newSize) => {
        setMarketInfo(prev => {
            const updated = { ...prev, size: newSize };
            if (prev.isClosed && parseFloat(newSize) > 0) {
                const targetAreaPx = parseFloat(newSize) * 900;
                const currentAreaPx = getPolygonArea(prev.points);
                if (currentAreaPx > 0) {
                    const scaleFactor = Math.sqrt(targetAreaPx / currentAreaPx);
                    updated.points = scalePolygon(prev.points, scaleFactor);
                }
            }
            return updated;
        });
    };

    // Step 2 Actions
    // generateGridAreas has been replaced by Real-time Preview in backend

    // Step 3 Actions
    const handleStallDrawComplete = (drawData) => {
        setIsDrawingStall(false);
        if (selectedAreaIndex === null) return;
        
        const newAreas = [...areas];
        const area = newAreas[selectedAreaIndex];
        
        let maxNum = 0;
        let mostCommonPrefix = t("marketFloorPlan.wizard.stall_prefix");
        
        if (area.stalls.length > 0) {
            const firstCode = area.stalls[0].code;
            const match = firstCode.match(/^(.+?)(\d+)$/);
            if (match) {
                mostCommonPrefix = match[1];
            }
            
            area.stalls.forEach(s => {
                const m = s.code.match(/^(.+?)(\d+)$/);
                if (m && m[1] === mostCommonPrefix) {
                    const num = parseInt(m[2], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
        } else {
            maxNum = area.stalls.length;
        }

        const newStall = {
            code: `${mostCommonPrefix}${maxNum + 1}`,
            width: drawData.width,
            height: drawData.height,
            mapX: drawData.minX,
            mapY: drawData.minY,
            svgPath: drawData.svgPath,
            size: drawData.area,
            isPolygon: true
        };
        newAreas[selectedAreaIndex].stalls.push(newStall);
        setAreas(newAreas);
    };

    const generateStalls = () => {
        if (selectedAreaIndex === null) return;
        const area = areas[selectedAreaIndex];
        let wMeters = parseFloat(stallsConfig.width);
        let hMeters = parseFloat(stallsConfig.height);
        
        let w = wMeters;
        let h = hMeters;
        if (pixelsPerMeter) {
            w = wMeters * pixelsPerMeter;
            h = hMeters * pixelsPerMeter;
        }

        const count = parseInt(stallsConfig.count);
        const spacing = 5;

        const newStalls = [];
        let codeCounter = 1;

        for (let y = area.minY; y <= area.maxY - h; y += h + spacing) {
            for (let x = area.minX; x <= area.maxX - w; x += w + spacing) {
                if (newStalls.length >= count) break;
                
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                
                const corners = [
                    [x, y], [x + w, y], [x + w, y + h], [x, y + h]
                ];
                
                if (corners.every(c => pointInPolygon(c, area.points))) {
                    newStalls.push({
                        code: `${stallsConfig.prefix}${codeCounter++}`,
                        width: w,
                        height: h,
                        size: stallsConfig.size ? parseFloat(stallsConfig.size) : null,
                        mapX: x - area.minX,
                        mapY: y - area.minY
                    });
                }
            }
            if (newStalls.length >= count) break;
        }

        const newAreas = [...areas];
        newAreas[selectedAreaIndex].stalls = newStalls;
        setAreas(newAreas);
    };

    // Final Save
    const handleNextStep1 = () => {
        if (!marketInfo.name || marketInfo.name.length < 5) {
            alert(t("marketFloorPlan.wizard.err_name_len"));
            return;
        }
        if (!marketInfo.address) {
            alert(t("marketFloorPlan.wizard.err_address"));
            return;
        }
        if (!marketInfo.size || parseFloat(marketInfo.size) <= 0) {
            alert(t("marketFloorPlan.wizard.err_area"));
            return;
        }
        if (!marketInfo.isClosed) {
            alert(t("marketFloorPlan.wizard.err_draw_boundary"));
            return;
        }
        
        const drawnAreaPx = getPolygonArea(marketInfo.points);
        const drawnAreaM2 = drawnAreaPx / 900;
        const declaredSize = parseFloat(marketInfo.size);
        
        if (drawnAreaM2 > declaredSize * 1.5) {
            alert(t("marketFloorPlan.wizard.err_area_mismatch", { drawn: Math.round(drawnAreaM2), declared: declaredSize }));
            return;
        }

        setStep(2);
    };

    const handleNextStep2 = () => {
        if (areas.length === 0) {
            alert(t("marketFloorPlan.wizard.err_min_area"));
            return;
        }
        
        const declaredMarketSize = parseFloat(marketInfo.size);
        let totalAreasSize = 0;
        const marketPoly = [[...marketInfo.points, marketInfo.points[0]]];
        
        for (let i = 0; i < areas.length; i++) {
            const a = areas[i];
            const areaM2 = getPolygonArea(a.points) / 900;
            totalAreasSize += areaM2;
            
            const areaPoly = [[...a.points, a.points[0]]];
            
            try {
                // Check if Area is completely inside Market
                const diff = polygonClipping.difference(areaPoly, marketPoly);
                if (diff.length > 0) {
                    let diffArea = 0;
                    diff.forEach(poly => poly.forEach(ring => {
                        diffArea += getPolygonArea(ring.slice(0, -1));
                    }));
                    if (diffArea > 500) { // Tolerance 0.5m^2
                        alert(t("marketFloorPlan.wizard.err_area_out", { name: a.name }));
                        return;
                    }
                }
                
                // Check overlap with OTHER areas
                for (let j = i + 1; j < areas.length; j++) {
                    const otherAreaPoly = [[...areas[j].points, areas[j].points[0]]];
                    const overlap = polygonClipping.intersection(areaPoly, otherAreaPoly);
                    if (overlap.length > 0) {
                        let overlapArea = 0;
                        overlap.forEach(poly => poly.forEach(ring => {
                            overlapArea += getPolygonArea(ring.slice(0, -1));
                        }));
                        if (overlapArea > 500) {
                            alert(t("marketFloorPlan.wizard.err_area_overlap", { name1: a.name, name2: areas[j].name }));
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Polygon validation failed", err);
            }
        }
        
        if (totalAreasSize > declaredMarketSize) {
            alert(t("marketFloorPlan.wizard.err_capacity_total", { total: Math.round(totalAreasSize), max: declaredMarketSize }));
            return;
        }
        setStep(3);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const mBbox = getBoundingBox(marketInfo.points);
            
            const payload = {
                MarketName: marketInfo.name,
                Address: marketInfo.address,
                Size: parseFloat(marketInfo.size) || 0,
                SvgPath: pointsToSvgPath(marketInfo.points, true),
                MinX: mBbox.minX,
                MinY: mBbox.minY,
                MaxX: mBbox.maxX,
                MaxY: mBbox.maxY,
                Areas: areas.map(a => ({
                    Name: a.name,
                    SvgPath: a.svgPath,
                    MinX: a.minX,
                    MinY: a.minY,
                    MaxX: a.maxX,
                    MaxY: a.maxY,
                    Size: a.size,
                    Stalls: a.stalls.map(s => ({
                        Code: s.code,
                        Width: s.width,
                        Height: s.height,
                        Size: s.size,
                        MapX: s.mapX,
                        MapY: s.mapY,
                        SvgPath: s.svgPath || '',
                        IsPolygon: s.isPolygon || false
                    }))
                }))
            };

            await createMarketBulk(payload);
            if (onComplete) onComplete();
        } catch (error) {
            console.error("Error creating market", error);
            const errorData = error.response?.data;
            let errorMsg = t('marketFloorPlan.wizard.err_save');
            if (errorData) {
                if (errorData.message) errorMsg = errorData.message;
                else if (errorData.title) {
                    errorMsg = errorData.title;
                    if (errorData.errors) {
                        const firstError = Object.values(errorData.errors)[0];
                        if (firstError && firstError.length > 0) errorMsg += " " + firstError[0];
                    }
                }
                else errorMsg = JSON.stringify(errorData);
            }
            alert(t("marketFloorPlan.wizard.err_save_detail", { msg: errorMsg, detail: error.message, status: error.response?.status }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.wizardContainer}>
            {/* SEO-correct top navigation */}
            <header className={styles.wizardNav}>
                <div className={styles.wizardNavBrand}>
                    {'🏪 ' + t('marketFloorPlan.wizard.create')}<span>{t('marketFloorPlan.wizard.new_market')}</span>
                </div>

                {/* Step indicator */}
                <nav aria-label={t('marketFloorPlan.wizard.steps')} className={styles.stepsIndicator}>
                    {[
                        { num: 1, label: t('marketFloorPlan.wizard.step_info') },
                        { num: 2, label: t('marketFloorPlan.wizard.step_area') }
                        // { num: 3, label: 'Sinh sạp tự động' } // HIDDEN
                    ].map((s, i) => (
                        <React.Fragment key={s.num}>
                            {i > 0 && <div className={styles.stepConnector} aria-hidden="true" />}
                            <div className={`${styles.stepPill} ${step === s.num ? styles.active : ''} ${step > s.num ? styles.completed : ''}`}>
                                <div className={styles.stepPillNum}>
                                    {step > s.num ? '✓' : s.num}
                                </div>
                                <span>{s.label}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </nav>

                <button className={styles.secondaryBtn} onClick={onCancel} aria-label={t('marketFloorPlan.wizard.cancel_title')}>
                    {'← ' + t('marketFloorPlan.wizard.cancel')}</button>
            </header>

            {/* Body */}
            <div className={styles.wizardBody}>
                {/* ─── Sidebar ─── */}
                <aside className={styles.wizardSidebar}>
                    <div className={styles.sidebarInner}>

                        {/* STEP 1 */}
                        {step === 1 && (
                            <>
                                <h2 className={styles.sidebarTitle}>{'📋 ' + t('marketFloorPlan.wizard.general_info')}</h2>
                                <div className={styles.formGroup}>
                                    <label htmlFor="market-name">{t('marketFloorPlan.wizard.market_name')}<span style={{color:'var(--mw-danger)'}}>*</span></label>
                                    <input id="market-name" className={styles.formInput} value={marketInfo.name}
                                        onChange={e => setMarketInfo({...marketInfo, name: e.target.value})}
                                        placeholder={t('marketFloorPlan.wizard.market_name_ph')} autoComplete="off" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="market-address">{t('marketFloorPlan.wizard.address')}</label>
                                    <input id="market-address" className={styles.formInput} value={marketInfo.address}
                                        onChange={e => setMarketInfo({...marketInfo, address: e.target.value})}
                                        placeholder={t('marketFloorPlan.wizard.address_ph')} autoComplete="off" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="market-size">{t('marketFloorPlan.wizard.total_area')}</label>
                                    <input id="market-size" className={styles.formInput} type="number" min="0"
                                        value={marketInfo.size}
                                        onChange={e => handleMarketSizeChange(e.target.value)}
                                        placeholder="Vd: 10000" />
                                </div>

                                <hr style={{border:'none', borderTop:'1.5px solid var(--mw-border)', margin:'4px 0'}} />

                                <h2 className={styles.sidebarTitle}>{t('marketFloorPlan.wizard.draw_boundary')}</h2>
                                <div className={styles.infoBox}>
                                    {t('marketFloorPlan.wizard.draw_inst_1')}<strong>{t('marketFloorPlan.wizard.close_shape')}</strong>.
                                </div>

                                {marketInfo.points.length > 0 && !marketInfo.isClosed && (
                                    <button className={styles.primaryBtn} style={{width:'100%'}} onClick={closeMarketShape}>
                                        ✔ {t('marketFloorPlan.wizard.close_shape')} ({marketInfo.points.length} {t('marketFloorPlan.wizard.points')})
                                    </button>
                                )}
                                {marketInfo.isClosed && (
                                    <>
                                        <div className={`${styles.infoBox} ${styles.success}`}>{'✅ ' + t('marketFloorPlan.wizard.shape_done')}</div>
                                        <button className={styles.secondaryBtn} onClick={resetMarketShape}>{'↺ ' + t('marketFloorPlan.wizard.redraw')}</button>
                                    </>
                                )}
                            </>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <>
                                <h2 className={styles.sidebarTitle}>{'🗺️ ' + t('marketFloorPlan.wizard.grid_area')}</h2>

                                <div className={styles.infoBox}>{t('marketFloorPlan.wizard.grid_desc')}</div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.rows')}</label>
                                        <input className={styles.formInput} type="number" min="1" max="10"
                                            value={gridConfig.rows}
                                            onChange={e => setGridConfig({...gridConfig, rows: parseInt(e.target.value) || 1})} />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.cols')}</label>
                                        <input className={styles.formInput} type="number" min="1" max="10"
                                            value={gridConfig.cols}
                                            onChange={e => setGridConfig({...gridConfig, cols: parseInt(e.target.value) || 1})} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.start_from')}</label>
                                        <select className={styles.formInput} 
                                            value={gridConfig.startPoint}
                                            onChange={e => setGridConfig({...gridConfig, startPoint: e.target.value})}>
                                            <option value="TopLeft">{t('marketFloorPlan.wizard.top_left')}</option>
                                            <option value="TopRight">{t('marketFloorPlan.wizard.top_right')}</option>
                                            <option value="BottomLeft">{t('marketFloorPlan.wizard.bottom_left')}</option>
                                            <option value="BottomRight">{t('marketFloorPlan.wizard.bottom_right')}</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.numbering_dir')}</label>
                                        <select className={styles.formInput} 
                                            value={gridConfig.orderStrategy}
                                            onChange={e => setGridConfig({...gridConfig, orderStrategy: e.target.value})}>
                                            <option value="RowMajor">{t('marketFloorPlan.wizard.by_row')}</option>
                                            <option value="ColMajor">{t('marketFloorPlan.wizard.by_col')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.naming_style')}</label>
                                        <select className={styles.formInput} 
                                            value={gridConfig.namingStrategy}
                                            onChange={e => setGridConfig({...gridConfig, namingStrategy: e.target.value})}>
                                            <option value="Numeric">{t('marketFloorPlan.wizard.num_only')}</option>
                                            <option value="Alphabetic">{t('marketFloorPlan.wizard.letter_only')}</option>
                                            <option value="AlphaNumeric">{t('marketFloorPlan.wizard.letter_num')}</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.aisle_width')}</label>
                                        <input className={styles.formInput} type="number" min="0"
                                            value={gridConfig.gap}
                                            onChange={e => setGridConfig({...gridConfig, gap: parseInt(e.target.value) || 0})} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.prefix')}</label>
                                        <input className={styles.formInput} type="text"
                                            value={gridConfig.prefix}
                                            onChange={e => setGridConfig({...gridConfig, prefix: e.target.value})} />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>{t('marketFloorPlan.wizard.category')}</label>
                                        <select className={styles.formInput} 
                                            value={gridConfig.categoryName}
                                            onChange={e => setGridConfig({...gridConfig, categoryName: e.target.value})}>
                                            <option value="">{t('marketFloorPlan.wizard.select_cat')}</option>
                                            {categories.map(cat => (
                                                <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* REAL-TIME STATS PANEL */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>📊 {t('marketFloorPlan.wizard.preview_stats')}</h4>
                                    
                                    {gridError ? (
                                        <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                                            ⚠️ {gridError}
                                        </div>
                                    ) : gridStats ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#475569' }}>
                                            <div>{t('marketFloorPlan.wizard.total_area_colon')} <b>{gridStats.totalAreaM2} m²</b></div>
                                            <div>{t('marketFloorPlan.wizard.usable_area')} <b>{gridStats.usableAreaM2} m²</b></div>
                                            <div>{t('marketFloorPlan.wizard.aisle_area')} <b>{gridStats.aisleAreaM2} m²</b></div>
                                            <div>{t('marketFloorPlan.wizard.avg_lot_area')} <b>{gridStats.averageZoneAreaM2} m²</b></div>
                                            <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                                                {t('marketFloorPlan.wizard.lots_created')} <b>{gridStats.generatedZones}</b> ({t('marketFloorPlan.wizard.max_prefix')}: {gridStats.maxAllowedZones})
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                                            {t('marketFloorPlan.wizard.waiting_config')}
                                        </div>
                                    )}
                                </div>

                                <hr style={{border:'none', borderTop:'1.5px solid var(--mw-border)', margin:'4px 0 16px 0'}} />

                                <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight: '200px', overflowY: 'auto'}}>
                                    {areas.map((a, i) => (
                                        <article key={i} className={styles.areaItem} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: selectedAreaIndex === i ? 'rgba(139,92,246,.1)' : '#fff', border: selectedAreaIndex === i ? '1px solid #8b5cf6' : '1px solid var(--mw-border)'}}>
                                            <div onClick={() => setSelectedAreaIndex(i)} style={{ cursor: 'pointer', flex: 1 }}>
                                                <h4>{a.name} {a.categoryName ? <span style={{fontSize: 12, fontWeight: 'normal', color: 'var(--text-secondary)'}}>({a.categoryName})</span> : ''}</h4>
                                                <p>{a.size ? `${a.size} m² • ` : ''}{a.stalls?.length > 0 ? `${a.stalls.length} ${t('marketFloorPlan.wizard.stalls_inside')}` : t('marketFloorPlan.wizard.no_stalls')}</p>
                                            </div>
                                            <div>
                                                <button onClick={() => {
                                                    setEditingAreaIndex(i);
                                                    setEditingAreaData({ name: a.name, size: a.size || '', categoryName: a.categoryName || '' });
                                                    setSelectedAreaIndex(i);
                                                }} style={{background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:16, marginRight: 8}} title={t('marketFloorPlan.wizard.edit')}>✏️</button>
                                                <button onClick={() => {
                                                    const newAreas = [...areas];
                                                    newAreas.splice(i, 1);
                                                    setAreas(newAreas);
                                                    if (selectedAreaIndex === i) setSelectedAreaIndex(null);
                                                    if (editingAreaIndex === i) setEditingAreaIndex(null);
                                                }} style={{background:'transparent', border:'none', color:'var(--mw-danger)', cursor:'pointer', fontSize:16}} title={t('marketFloorPlan.wizard.delete')}>✕</button>
                                            </div>
                                        </article>
                                    ))}
                                    {areas.length === 0 && (
                                        <div style={{textAlign:'center', color:'var(--text-secondary)', fontSize: 13}}>{t('marketFloorPlan.wizard.no_areas')}</div>
                                    )}
                                </div>
                                {editingAreaIndex !== null && (
                                    <div style={{ padding: 12, border: '1px solid var(--mw-border)', borderRadius: 8, marginTop: 16, backgroundColor: '#f8fafc' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>{'✏️ ' + t('marketFloorPlan.wizard.edit_info')}</h4>
                                        <div className={styles.formGroup}>
                                            <label>{t('marketFloorPlan.wizard.area_name')}</label>
                                            <input className={styles.formInput} value={editingAreaData.name} onChange={e => setEditingAreaData({...editingAreaData, name: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>{t('marketFloorPlan.wizard.area_size')}</label>
                                            <input className={styles.formInput} type="number" min="0" value={editingAreaData.size} onChange={e => setEditingAreaData({...editingAreaData, size: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>{t('marketFloorPlan.wizard.category')}</label>
                                            <select className={styles.formInput} 
                                                value={editingAreaData.categoryName}
                                                onChange={e => setEditingAreaData({...editingAreaData, categoryName: e.target.value})}>
                                                <option value="">{t('marketFloorPlan.wizard.none')}</option>
                                                {categories.map(cat => (
                                                    <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className={styles.primaryBtn} style={{ flex: 1, padding: '6px 12px', fontSize: 13 }} onClick={() => {
                                                if (areas.some((a, idx) => idx !== editingAreaIndex && a.name.toLowerCase() === editingAreaData.name.trim().toLowerCase())) {
                                                    alert(t('marketFloorPlan.wizard.err_dup_name'));
                                                    return;
                                                }
                                                
                                                const targetSize = parseFloat(editingAreaData.size) || 0;
                                                const declaredMarketSize = parseFloat(marketInfo.size) || (getPolygonArea(marketInfo.points) / 900);
                                                
                                                let currentTotalSize = 0;
                                                areas.forEach((a, idx) => {
                                                    if (idx !== editingAreaIndex) {
                                                        currentTotalSize += parseFloat(a.size) || (getPolygonArea(a.points) / 900);
                                                    }
                                                });
                                                
                                                if (currentTotalSize + targetSize > declaredMarketSize) {
                                                    const remaining = declaredMarketSize - currentTotalSize;
                                                    alert(t('marketFloorPlan.wizard.err_capacity_area', { remaining: Math.round(remaining), target: targetSize }));
                                                    return;
                                                }

                                                setAreas(prev => {
                                                    let updated = JSON.parse(JSON.stringify(prev)); // Deep copy
                                                    const area = updated[editingAreaIndex];
                                                    area.name = editingAreaData.name;
                                                    area.categoryName = editingAreaData.categoryName;
                                                    
                                                    if (targetSize > 0 && targetSize !== area.size) {
                                                        const currentAreaPx = getPolygonArea(area.points);
                                                        const targetAreaPx = targetSize * 900; // 900px² = 1m²
                                                        if (currentAreaPx > 0) {
                                                            const scaleFactor = Math.sqrt(targetAreaPx / currentAreaPx);
                                                            let newPoints = scalePolygon(area.points, scaleFactor);
                                                            
                                                            // 1. Clip against market boundary
                                                            const marketPoly = [[...marketInfo.points, marketInfo.points[0]]];
                                                            let areaPoly = [[...newPoints, newPoints[0]]];
                                                            try {
                                                                const intersection = polygonClipping.intersection(marketPoly, areaPoly);
                                                                if (intersection.length > 0) {
                                                                    // Get largest polygon if split
                                                                    let maxArea = -1;
                                                                    let maxPoly = intersection[0];
                                                                    intersection.forEach(p => {
                                                                        const a = getPolygonArea(p[0].slice(0, -1));
                                                                        if (a > maxArea) { maxArea = a; maxPoly = p; }
                                                                    });
                                                                    areaPoly = maxPoly;
                                                                    newPoints = maxPoly[0].slice(0, -1);
                                                                }
                                                            } catch (err) {
                                                                console.error("Polygon clipping failed during resize", err);
                                                            }
                                                            
                                                            // 2. Subtract this new area from all OTHER areas!
                                                            updated.forEach((otherArea, idx) => {
                                                                if (idx !== editingAreaIndex && otherArea.points && otherArea.points.length > 0) {
                                                                    const otherPoly = [[...otherArea.points, otherArea.points[0]]];
                                                                    try {
                                                                        const diff = polygonClipping.difference(otherPoly, areaPoly);
                                                                        if (diff.length > 0) {
                                                                            let maxArea = -1;
                                                                            let maxPoly = diff[0];
                                                                            diff.forEach(p => {
                                                                                const a = getPolygonArea(p[0].slice(0, -1));
                                                                                if (a > maxArea) { maxArea = a; maxPoly = p; }
                                                                            });
                                                                            otherArea.points = maxPoly[0].slice(0, -1);
                                                                            const otherBbox = getBoundingBox(otherArea.points);
                                                                            // Normalize svgPath to origin (0,0)
                                                                            const otherNormalized = otherArea.points.map(p => [p[0] - otherBbox.minX, p[1] - otherBbox.minY]);
                                                                            otherArea.svgPath = pointsToSvgPath(otherNormalized, true);
                                                                            otherArea.minX = otherBbox.minX;
                                                                            otherArea.minY = otherBbox.minY;
                                                                            otherArea.maxX = otherBbox.maxX;
                                                                            otherArea.maxY = otherBbox.maxY;
                                                                            otherArea.size = Math.round((getPolygonArea(otherArea.points) / 900) * 100) / 100;
                                                                        } else {
                                                                            // otherArea was completely swallowed!
                                                                            otherArea.points = []; 
                                                                        }
                                                                    } catch (err) {}
                                                                }
                                                            });
                                                            
                                                            area.points = newPoints;
                                                            const areaBbox = getBoundingBox(area.points);
                                                            // Normalize svgPath to origin (0,0)
                                                            const areaNormalized = area.points.map(p => [p[0] - areaBbox.minX, p[1] - areaBbox.minY]);
                                                            area.svgPath = pointsToSvgPath(areaNormalized, true);
                                                            area.minX = areaBbox.minX;
                                                            area.minY = areaBbox.minY;
                                                            area.maxX = areaBbox.maxX;
                                                            area.maxY = areaBbox.maxY;
                                                            
                                                            // Recalculate physical size after clipping (it might be smaller than target if clipped)
                                                            const clippedM2 = Math.round((getPolygonArea(area.points) / 900) * 100) / 100;
                                                            area.size = clippedM2;
                                                        }
                                                    } else {
                                                        area.size = targetSize ? targetSize : null;
                                                    }
                                                    
                                                    // Filter out any areas that were completely swallowed
                                                    return updated.filter(a => a.points && a.points.length >= 3);
                                                });
                                                setEditingAreaIndex(null);
                                            }}>{t('marketFloorPlan.wizard.save')}</button>
                                            <button className={styles.secondaryBtn} style={{ flex: 1, padding: '6px 12px', fontSize: 13 }} onClick={() => setEditingAreaIndex(null)}>{'← ' + t('marketFloorPlan.wizard.cancel')}</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* HIDDEN STEP 3:
                        {step === 3 && (
                            <>
                                <h2 className={styles.sidebarTitle}>{t('marketFloorPlan.wizard.step_stall')}</h2>
                                <div className={styles.formGroup}>
                                    <label htmlFor="stall-area">{t('marketFloorPlan.wizard.select_area')}</label>
                                    <select id="stall-area" className={styles.formInput}
                                        value={selectedAreaIndex !== null ? selectedAreaIndex : ''}
                                        onChange={e => setSelectedAreaIndex(e.target.value === '' ? null : Number(e.target.value))}>
                                        <option value="" disabled>{t('marketFloorPlan.wizard.select_area')}</option>
                                        {areas.map((a, i) => <option key={i} value={i}>{a.name}</option>)}
                                    </select>
                                </div>

                                {selectedAreaIndex !== null && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="stall-prefix">{t('marketFloorPlan.wizard.stall_prefix_lbl')}</label>
                                            <input id="stall-prefix" className={styles.formInput} value={stallsConfig.prefix}
                                                onChange={e => setStallsConfig({...stallsConfig, prefix: e.target.value})}
                                                placeholder="Vd: S, A, KV1…" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="stall-count">{t('marketFloorPlan.wizard.stall_count')}</label>
                                            <input id="stall-count" type="number" min="1" className={styles.formInput}
                                                value={stallsConfig.count}
                                                onChange={e => setStallsConfig({...stallsConfig, count: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="stall-size">{t('marketFloorPlan.wizard.stall_size')}</label>
                                            <input id="stall-size" type="number" min="0" className={styles.formInput}
                                                value={stallsConfig.size}
                                                readOnly
                                                style={{backgroundColor: 'var(--mw-gray-50)', color: 'var(--mw-gray-500)'}}
                                                placeholder={t('marketFloorPlan.wizard.auto_calc')} />
                                        </div>
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="stall-w">{t('marketFloorPlan.wizard.width_m')}</label>
                                                <input id="stall-w" type="number" min="1" className={styles.formInput}
                                                    value={stallsConfig.width}
                                                    onChange={e => {
                                                        const w = e.target.value;
                                                        const h = stallsConfig.height;
                                                        const s = w && h ? (parseFloat(w) * parseFloat(h)).toString() : '';
                                                        setStallsConfig({...stallsConfig, width: w, size: s});
                                                    }} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="stall-h">Cao (m)</label>
                                                <input id="stall-h" type="number" min="1" className={styles.formInput}
                                                    value={stallsConfig.height}
                                                    onChange={e => {
                                                        const h = e.target.value;
                                                        const w = stallsConfig.width;
                                                        const s = w && h ? (parseFloat(w) * parseFloat(h)).toString() : '';
                                                        setStallsConfig({...stallsConfig, height: h, size: s});
                                                    }} />
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap: 8, marginTop: 4}}>
                                            <button className={styles.primaryBtn} style={{flex: 1}} onClick={generateStalls}>
                                                {'⚡ ' + t('marketFloorPlan.wizard.gen_stalls')}</button>
                                            <button 
                                                className={styles.secondaryBtn} 
                                                style={{flex: 1, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1'}}
                                                onClick={() => setIsDrawingStall(true)}
                                            >
                                                {'🖊️ ' + t('marketFloorPlan.wizard.draw_stalls')}</button>
                                        </div>
                                        {areas[selectedAreaIndex]?.stalls?.length > 0 && (
                                            <div className={`${styles.infoBox} ${styles.success}`}>
                                                ✅ {t('marketFloorPlan.wizard.generated')} {areas[selectedAreaIndex].stalls.length} {t('marketFloorPlan.wizard.stalls')}.
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        */}
                    </div>

                    {/* Sticky footer actions */}
                    <div className={styles.sidebarActions}>
                        {step === 1 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={onCancel}>{'← ' + t('marketFloorPlan.wizard.cancel')}</button>
                                <button className={styles.primaryBtn} style={{flex:2}} onClick={handleNextStep1}
                                    disabled={!marketInfo.name || !marketInfo.isClosed}>{t('marketFloorPlan.wizard.next') + ' →'}</button>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={() => setStep(1)}>{'← ' + t('marketFloorPlan.wizard.back')}</button>
                                <button className={styles.successBtn} style={{flex:2}} onClick={handleSave} disabled={loading || areas.length === 0}>
                                    {loading ? '⏳ ' + t('marketFloorPlan.wizard.saving') : '✅ ' + t('marketFloorPlan.wizard.finish_save')}
                                </button>
                            </>
                        )}
                        {/* HIDDEN STEP 3 ACTIONS
                        {step === 3 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={() => setStep(2)}>{'← ' + t('marketFloorPlan.wizard.back')}</button>
                                <button className={styles.successBtn} style={{flex:2}} onClick={handleSave} disabled={loading}>
                                    {loading ? '⏳ ' + t('marketFloorPlan.wizard.saving') : '✅ ' + t('marketFloorPlan.wizard.finish_save')}
                                </button>
                            </>
                        )}
                        */}
                    </div>
                </aside>

                {/* ─── SVG Canvas ─── */}
                <section className={styles.wizardCanvas}>
                    <div className={styles.canvasToolbar}>
                        <div className={styles.canvasLabel}>
                            🗺️&nbsp;
                            <span>
                                {step === 1 ? t('marketFloorPlan.wizard.draw_boundary') : t('marketFloorPlan.wizard.preview_layout')}
                            </span>
                        </div>
                        {step === 1 && marketInfo.points.length > 0 && (
                            <span className={styles.canvasBadge}>{marketInfo.points.length} {t('marketFloorPlan.wizard.points')}</span>
                        )}
                        {step === 2 && areas.length > 0 && (
                            <span className={styles.canvasBadge}>{areas.length} {t('marketFloorPlan.wizard.areas')}</span>
                        )}
                        {/* HIDDEN:
                        {step === 3 && (
                            <span className={styles.canvasBadge}>{areas.reduce((s, a) => s + a.stalls.length, 0)} {t('marketFloorPlan.wizard.stalls')}</span>
                        )}
                        */}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: '#f1f5f9' }}>
                        {/* Zoom Controls */}
                        <div style={{ position: 'sticky', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 8, background: 'white', padding: 8, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: 'fit-content' }}>
                            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                            <span style={{ display: 'flex', alignItems: 'center', minWidth: 48, justifyContent: 'center', fontSize: 14, fontWeight: 'bold' }}>{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            <button onClick={() => setZoom(1)} style={{ padding: '0 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Reset</button>
                        </div>
                        <svg ref={svgRef} className={styles.svgArea} onClick={handleSvgClick}
                            onMouseMove={handleGlobalMouseMove}
                            onMouseUp={handleGlobalMouseUp}
                            onMouseLeave={handleGlobalMouseUp}
                            style={{ 
                                width: 4000 * zoom, 
                                height: 4000 * zoom,
                                minWidth: 4000 * zoom, 
                                minHeight: 4000 * zoom, 
                                backgroundColor: '#f1f5f9', 
                                backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', 
                                backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                                display: 'block'
                            }}
                            viewBox="0 0 4000 4000"
                            role="img" aria-label={t('marketFloorPlan.wizard.canvas_region')}>

                        {/* Market outline */}
                        {marketInfo.points.length > 0 && (
                            <path d={pointsToSvgPath(marketInfo.points, marketInfo.isClosed)}
                                fill={marketInfo.isClosed ? 'rgba(59,130,246,.07)' : 'none'}
                                stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" 
                                onMouseDown={marketInfo.isClosed ? (e) => handleMouseDown('market', null, e, marketInfo.points) : undefined}
                                style={{ cursor: marketInfo.isClosed && step === 1 ? 'move' : 'default', pointerEvents: 'auto' }}
                            />
                        )}
                        {step === 1 && !marketInfo.isClosed && marketInfo.points.map((p, i) => (
                            <circle key={`m-pt-${i}`} cx={p[0]} cy={p[1]} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                        ))}

                        {/* Saved areas (memoized for performance) */}
                        {useMemo(() => areas.map((a, i) => (
                            <g key={`area-${i}`}>
                                <path d={pointsToSvgPath(a.points, true)}
                                    fill={selectedAreaIndex === i ? 'rgba(139,92,246,.18)' : 'rgba(5,150,105,.12)'}
                                    stroke={selectedAreaIndex === i ? '#8b5cf6' : '#059669'}
                                    strokeWidth="2" strokeLinejoin="round" 
                                    onMouseDown={(e) => handleMouseDown('area', i, e, a.points)}
                                    style={{ cursor: step === 2 ? 'move' : 'default', pointerEvents: 'auto' }}
                                />
                                <text x={(a.minX + a.maxX) / 2} y={(a.minY + a.maxY) / 2}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill={selectedAreaIndex === i ? '#8b5cf6' : '#047857'}
                                    fontSize="11" fontWeight="700"
                                    fontFamily="Inter, system-ui, sans-serif"
                                    style={{pointerEvents:'none'}}>
                                    {a.name}
                                </text>
                                {/* Only render stalls if there are fewer than a huge amount, or render them normally but memoized */}
                                {a.stalls.map((s, j) => (
                                    <g key={`stall-${i}-${j}`}>
                                        <rect x={a.minX + s.mapX} y={a.minY + s.mapY} width={s.width} height={s.height}
                                            fill={s.svgPath ? "transparent" : "#fff"} stroke={s.svgPath ? "transparent" : "#3b82f6"} strokeWidth="1.5" rx="3" 
                                            onMouseDown={(e) => handleMouseDown('stall', { areaIndex: i, stallIndex: j }, e, { mapX: s.mapX, mapY: s.mapY })}
                                            style={{ cursor: step === 3 ? 'move' : 'default', pointerEvents: 'auto' }}
                                        />
                                        
                                        {s.svgPath && (
                                            <svg x={a.minX + s.mapX} y={a.minY + s.mapY} width={s.width} height={s.height} viewBox={`0 0 ${s.width} ${s.height}`} style={{ pointerEvents: 'none' }}>
                                                <path 
                                                    d={s.svgPath} 
                                                    fill="rgba(59, 130, 246, 0.4)" 
                                                    stroke="#2563eb" 
                                                    strokeWidth="1.5" 
                                                />
                                            </svg>
                                        )}

                                        {/* Skip text rendering if stall is too small to improve perf */}
                                        {(s.width > 15 && s.height > 15) && (
                                            <text x={a.minX + s.mapX + s.width / 2} y={a.minY + s.mapY + s.height / 2}
                                                fontSize={Math.min(s.width, s.height) * 0.4} fill="#1e40af" textAnchor="middle"
                                                dominantBaseline="middle" fontWeight="600"
                                                fontFamily="Inter, system-ui, sans-serif"
                                                style={{pointerEvents:'none'}}>
                                                {s.code}
                                            </text>
                                        )}
                                    </g>
                                ))}
                                {selectedAreaIndex === i && step === 2 && a.points.map((pt, vIndex) => (
                                    <circle key={`v-${i}-${vIndex}`} cx={pt[0]} cy={pt[1]} r="7" 
                                        fill="#fff" stroke="#8b5cf6" strokeWidth="2.5"
                                        onMouseDown={(e) => handleMouseDown('area-vertex', { areaIndex: i, vertexIndex: vIndex }, e, { startX: pt[0], startY: pt[1] })}
                                        style={{ cursor: 'crosshair', pointerEvents: 'auto' }}
                                    />
                                ))}
                            </g>
                        )), [areas, selectedAreaIndex, step])}

                        {/* Delete drawingArea completely */}
                    </svg>
                    </div>
                </section>
            </div>

            {/* HIDDEN DRAWING:
            {isDrawingStall && selectedAreaIndex !== null && (
                <PolygonDrawer 
                    stallMode={true}
                    cWidth={areas[selectedAreaIndex].width}
                    cHeight={areas[selectedAreaIndex].height}
                    maxAllowedAreaSize={areas[selectedAreaIndex].size || 1000}
                    existingAreas={areas[selectedAreaIndex].stalls}
                    svgOffsetX={areas[selectedAreaIndex].minX}
                    svgOffsetY={areas[selectedAreaIndex].minY}
                    marketPolygon={(() => {
                        const pts = areas[selectedAreaIndex].points;
                        if (!pts || pts.length === 0) return null;
                        return pts.map(p => [
                            p[0] - areas[selectedAreaIndex].minX,
                            p[1] - areas[selectedAreaIndex].minY
                        ]);
                    })()}
                    onComplete={handleStallDrawComplete}
                    onCancel={() => setIsDrawingStall(false)}
                />
            )}
            */}
        </main>
    );
};

export default MarketWizard;
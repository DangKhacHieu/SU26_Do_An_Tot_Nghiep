import React, { useState, useRef, useMemo, useEffect } from 'react';
import styles from './LayoutEditor.module.css';
import { createMarketBulk } from '../../../../services/marketApi';
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
        generateStalls: true
    });

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
                updated[indexToUpdate] = {
                    ...area,
                    svgPath: pointsToSvgPath(area.points, true),
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
    const generateGridAreas = () => {
        if (marketInfo.points.length < 3) {
            alert("Vui lòng vẽ ranh giới chợ ở Bước 1 trước!");
            return;
        }
        
        const mBbox = getBoundingBox(marketInfo.points);
        const { width, height } = { width: mBbox.maxX - mBbox.minX, height: mBbox.maxY - mBbox.minY };
        const { rows, cols, gap, prefix, generateStalls: genStalls } = gridConfig;
        
        const areaWidth = Math.max(50, (width - (cols + 1) * gap) / cols);
        const areaHeight = Math.max(50, (height - (rows + 1) * gap) / rows);
        
        let targetCount = parseInt(gridConfig.count);
        if (isNaN(targetCount) || targetCount <= 0) targetCount = rows * cols;
        
        const newAreas = [];
        let createdCount = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (createdCount >= targetCount) break;
                
                const x = mBbox.minX + gap + c * (areaWidth + gap);
                const y = mBbox.minY + gap + r * (areaHeight + gap);
                
                const corners = [
                    [x, y], [x + areaWidth, y], [x + areaWidth, y + areaHeight], [x, y + areaHeight]
                ];

                const rectPoly = [[...corners, corners[0]]];
                const marketPoly = [[...marketInfo.points, marketInfo.points[0]]];
                
                let clippedPoints = corners;
                try {
                    const intersection = polygonClipping.intersection(marketPoly, rectPoly);
                    if (intersection.length === 0) continue;
                    clippedPoints = intersection[0][0].slice(0, -1);
                } catch (err) {
                    console.error("Polygon clipping failed for area", r, c, err);
                }

                const stalls = [];
                if (genStalls) {
                    const sCols = 2;
                    const sRows = 2;
                    const sGap = 10;
                    const stW = Math.max(20, (areaWidth - (sCols + 1) * sGap) / sCols);
                    const stH = Math.max(20, (areaHeight - (sRows + 1) * sGap) / sRows);
                    
                    for (let sr = 0; sr < sRows; sr++) {
                        for (let sc = 0; sc < sCols; sc++) {
                            const sx = x + sGap + sc * (stW + sGap);
                            const sy = y + sGap + sr * (stH + sGap);
                            
                            stalls.push({
                                code: `Sạp ${String.fromCharCode(65 + sr)}${sc + 1}`,
                                width: stW,
                                height: stH,
                                mapX: sx - x,
                                mapY: sy - y,
                                size: null
                            });
                        }
                    }
                }
                
                let validStalls = stalls;
                if (clippedPoints !== corners) {
                    validStalls = stalls.filter(s => {
                         const center = [x + s.mapX + s.width/2, y + s.mapY + s.height/2];
                         return pointInPolygon(center, clippedPoints);
                    });
                }
                
                const areaBbox = getBoundingBox(clippedPoints);
                newAreas.push({
                    name: `${prefix} ${String.fromCharCode(65 + r)}${c + 1}`,
                    categoryName: gridConfig.categoryName,
                    points: clippedPoints,
                    svgPath: pointsToSvgPath(clippedPoints, true),
                    minX: areaBbox.minX,
                    minY: areaBbox.minY,
                    maxX: areaBbox.maxX,
                    maxY: areaBbox.maxY,
                    size: null,
                    stalls: validStalls
                });
                createdCount++;
            }
        }
        
        setAreas(newAreas);
    };

    // Step 3 Actions
    const handleStallDrawComplete = (drawData) => {
        setIsDrawingStall(false);
        if (selectedAreaIndex === null) return;
        
        const newAreas = [...areas];
        const area = newAreas[selectedAreaIndex];
        
        let maxNum = 0;
        let mostCommonPrefix = "Sạp ";
        
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
            alert("Tên chợ phải dài ít nhất 5 ký tự.");
            return;
        }
        if (!marketInfo.address) {
            alert("Vui lòng nhập địa chỉ chợ.");
            return;
        }
        if (!marketInfo.size || parseFloat(marketInfo.size) <= 0) {
            alert("Vui lòng nhập tổng diện tích hợp lệ.");
            return;
        }
        if (!marketInfo.isClosed) {
            alert("Vui lòng vẽ ranh giới chợ và nhấn 'Khép kín' trước khi đi tiếp.");
            return;
        }
        
        const drawnAreaPx = getPolygonArea(marketInfo.points);
        const drawnAreaM2 = drawnAreaPx / 900;
        const declaredSize = parseFloat(marketInfo.size);
        
        if (drawnAreaM2 > declaredSize * 1.5) {
            alert(`Lỗi: Diện tích hình vẽ thực tế (${Math.round(drawnAreaM2)}m²) lớn hơn quá nhiều so với diện tích bạn khai báo (${declaredSize}m²). Vui lòng vẽ lại nhỏ hơn hoặc tăng diện tích khai báo!`);
            return;
        }

        setStep(2);
    };

    const handleNextStep2 = () => {
        if (areas.length === 0) {
            alert("Vui lòng tạo ít nhất 1 khu vực.");
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
                        alert(`Lỗi ranh giới: Khu vực "${a.name}" đang lồi ra khỏi ranh giới chợ! Vui lòng kéo các điểm vào bên trong.`);
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
                            alert(`Lỗi chồng lấp: Khu vực "${a.name}" đang đè lên khu vực "${areas[j].name}"! Vui lòng tách chúng ra.`);
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Polygon validation failed", err);
            }
        }
        
        if (totalAreasSize > declaredMarketSize) {
            alert(`Lỗi sức chứa: Tổng diện tích các khu vực (${Math.round(totalAreasSize)}m²) vượt quá tổng diện tích chợ (${declaredMarketSize}m²). Vui lòng điều chỉnh hoặc xóa bớt khu vực!`);
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
            let errorMsg = "Có lỗi xảy ra khi lưu chợ.";
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
            alert(`Lỗi: ${errorMsg}\n\n[Chi tiết kỹ thuật: ${error.message} | HTTP ${error.response?.status}]`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.wizardContainer}>
            {/* SEO-correct top navigation */}
            <header className={styles.wizardNav}>
                <div className={styles.wizardNavBrand}>
                    🏪 Tạo <span>Chợ Mới</span>
                </div>

                {/* Step indicator */}
                <nav aria-label="Các bước tạo chợ" className={styles.stepsIndicator}>
                    {[
                        { num: 1, label: 'Thông tin & Bản đồ' },
                        { num: 2, label: 'Phân khu vực' },
                        { num: 3, label: 'Sinh sạp tự động' },
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

                <button className={styles.secondaryBtn} onClick={onCancel} aria-label="Hủy tạo chợ">
                    ✕ Hủy bỏ
                </button>
            </header>

            {/* Body */}
            <div className={styles.wizardBody}>
                {/* ─── Sidebar ─── */}
                <aside className={styles.wizardSidebar}>
                    <div className={styles.sidebarInner}>

                        {/* STEP 1 */}
                        {step === 1 && (
                            <>
                                <h2 className={styles.sidebarTitle}>📋 Thông tin chung</h2>
                                <div className={styles.formGroup}>
                                    <label htmlFor="market-name">Tên chợ <span style={{color:'var(--mw-danger)'}}>*</span></label>
                                    <input id="market-name" className={styles.formInput} value={marketInfo.name}
                                        onChange={e => setMarketInfo({...marketInfo, name: e.target.value})}
                                        placeholder="Vd: Chợ Bến Thành" autoComplete="off" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="market-address">Địa chỉ</label>
                                    <input id="market-address" className={styles.formInput} value={marketInfo.address}
                                        onChange={e => setMarketInfo({...marketInfo, address: e.target.value})}
                                        placeholder="Vd: Quận 1, TP.HCM" autoComplete="off" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="market-size">Tổng diện tích (m²)</label>
                                    <input id="market-size" className={styles.formInput} type="number" min="0"
                                        value={marketInfo.size}
                                        onChange={e => handleMarketSizeChange(e.target.value)}
                                        placeholder="Vd: 10000" />
                                </div>

                                <hr style={{border:'none', borderTop:'1.5px solid var(--mw-border)', margin:'4px 0'}} />

                                <h2 className={styles.sidebarTitle}>🖊️ Vẽ ranh giới chợ</h2>
                                <div className={styles.infoBox}>
                                    Click liên tiếp lên vùng bản đồ bên phải để đặt các điểm góc, sau đó nhấn <strong>Khép kín</strong>.
                                </div>

                                {marketInfo.points.length > 0 && !marketInfo.isClosed && (
                                    <button className={styles.primaryBtn} style={{width:'100%'}} onClick={closeMarketShape}>
                                        ✔ Khép kín ({marketInfo.points.length} điểm)
                                    </button>
                                )}
                                {marketInfo.isClosed && (
                                    <>
                                        <div className={`${styles.infoBox} ${styles.success}`}>✅ Đã hoàn thành hình dạng chợ!</div>
                                        <button className={styles.secondaryBtn} onClick={resetMarketShape}>↺ Vẽ lại</button>
                                    </>
                                )}
                            </>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <>
                                <h2 className={styles.sidebarTitle}>🗺️ Phân lô khu vực (Lưới)</h2>

                                <div className={styles.infoBox}>Hệ thống sẽ tự động rải đều các khu vực lên mặt bằng chợ.</div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>SỐ DÒNG</label>
                                        <input className={styles.formInput} type="number" min="1" max="10"
                                            value={gridConfig.rows}
                                            onChange={e => setGridConfig({...gridConfig, rows: parseInt(e.target.value) || 1})} />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>SỐ CỘT</label>
                                        <input className={styles.formInput} type="number" min="1" max="10"
                                            value={gridConfig.cols}
                                            onChange={e => setGridConfig({...gridConfig, cols: parseInt(e.target.value) || 1})} />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>SỐ LƯỢNG KHU VỰC CẦN TẠO</label>
                                    <input className={styles.formInput} type="number" min="1" placeholder="Để trống để tạo tối đa theo dòng & cột..."
                                        value={gridConfig.count}
                                        onChange={e => setGridConfig({...gridConfig, count: e.target.value})} />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>ĐỘ RỘNG LỐI ĐI (px)</label>
                                    <input className={styles.formInput} type="number" min="0"
                                        value={gridConfig.gap}
                                        onChange={e => setGridConfig({...gridConfig, gap: parseInt(e.target.value) || 0})} />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>TIỀN TỐ</label>
                                        <input className={styles.formInput} type="text"
                                            value={gridConfig.prefix}
                                            onChange={e => setGridConfig({...gridConfig, prefix: e.target.value})} />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                        <label>NGÀNH HÀNG</label>
                                        <select className={styles.formInput} 
                                            value={gridConfig.categoryName}
                                            onChange={e => setGridConfig({...gridConfig, categoryName: e.target.value})}>
                                            <option value="">Chọn ngành hàng...</option>
                                            {categories.map(cat => (
                                                <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    <input type="checkbox" id="genStallsStep2"
                                        checked={gridConfig.generateStalls}
                                        onChange={e => setGridConfig({...gridConfig, generateStalls: e.target.checked})}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    <label htmlFor="genStallsStep2" style={{ margin: 0, cursor: 'pointer', textTransform: 'none', fontWeight: 'bold' }}>Tự động sinh Sạp (Stalls)</label>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    <button className={styles.primaryBtn} style={{flex: 2, background: '#8b5cf6', borderColor: '#8b5cf6'}} onClick={generateGridAreas}>
                                        🪄 Sinh lưới
                                    </button>
                                    <button className={styles.secondaryBtn} style={{flex: 1, color: 'var(--mw-danger)', borderColor: 'var(--mw-danger)'}} onClick={() => setAreas([])}>
                                        🗑 Xóa hết
                                    </button>
                                </div>

                                <hr style={{border:'none', borderTop:'1.5px solid var(--mw-border)', margin:'4px 0 16px 0'}} />

                                <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight: '200px', overflowY: 'auto'}}>
                                    {areas.map((a, i) => (
                                        <article key={i} className={styles.areaItem} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background: selectedAreaIndex === i ? 'rgba(139,92,246,.1)' : '#fff', border: selectedAreaIndex === i ? '1px solid #8b5cf6' : '1px solid var(--mw-border)'}}>
                                            <div onClick={() => setSelectedAreaIndex(i)} style={{ cursor: 'pointer', flex: 1 }}>
                                                <h4>{a.name} {a.categoryName ? <span style={{fontSize: 12, fontWeight: 'normal', color: 'var(--text-secondary)'}}>({a.categoryName})</span> : ''}</h4>
                                                <p>{a.size ? `${a.size} m² • ` : ''}{a.stalls?.length > 0 ? `${a.stalls.length} sạp bên trong` : 'Chưa có sạp'}</p>
                                            </div>
                                            <div>
                                                <button onClick={() => {
                                                    setEditingAreaIndex(i);
                                                    setEditingAreaData({ name: a.name, size: a.size || '', categoryName: a.categoryName || '' });
                                                    setSelectedAreaIndex(i);
                                                }} style={{background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:16, marginRight: 8}} title="Sửa">✏️</button>
                                                <button onClick={() => {
                                                    const newAreas = [...areas];
                                                    newAreas.splice(i, 1);
                                                    setAreas(newAreas);
                                                    if (selectedAreaIndex === i) setSelectedAreaIndex(null);
                                                    if (editingAreaIndex === i) setEditingAreaIndex(null);
                                                }} style={{background:'transparent', border:'none', color:'var(--mw-danger)', cursor:'pointer', fontSize:16}} title="Xóa">✕</button>
                                            </div>
                                        </article>
                                    ))}
                                    {areas.length === 0 && (
                                        <div style={{textAlign:'center', color:'var(--text-secondary)', fontSize: 13}}>Chưa có khu vực nào.</div>
                                    )}
                                </div>
                                {editingAreaIndex !== null && (
                                    <div style={{ padding: 12, border: '1px solid var(--mw-border)', borderRadius: 8, marginTop: 16, backgroundColor: '#f8fafc' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>✏️ Chỉnh sửa thông tin</h4>
                                        <div className={styles.formGroup}>
                                            <label>Tên khu vực</label>
                                            <input className={styles.formInput} value={editingAreaData.name} onChange={e => setEditingAreaData({...editingAreaData, name: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Diện tích (m²)</label>
                                            <input className={styles.formInput} type="number" min="0" value={editingAreaData.size} onChange={e => setEditingAreaData({...editingAreaData, size: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Ngành hàng</label>
                                            <select className={styles.formInput} 
                                                value={editingAreaData.categoryName}
                                                onChange={e => setEditingAreaData({...editingAreaData, categoryName: e.target.value})}>
                                                <option value="">Không có</option>
                                                {categories.map(cat => (
                                                    <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className={styles.primaryBtn} style={{ flex: 1, padding: '6px 12px', fontSize: 13 }} onClick={() => {
                                                if (areas.some((a, idx) => idx !== editingAreaIndex && a.name.toLowerCase() === editingAreaData.name.trim().toLowerCase())) {
                                                    alert("Tên khu vực này đã tồn tại trong lưới. Vui lòng chọn tên khác!");
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
                                                    alert(`Lỗi sức chứa: Quỹ đất còn trống của chợ chỉ còn ${Math.round(remaining)}m².\nBạn đang nhập ${targetSize}m² cho khu vực này, vượt quá mức cho phép! Vui lòng nhập số nhỏ hơn hoặc bằng ${Math.round(remaining)}m².`);
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
                                                                            otherArea.svgPath = pointsToSvgPath(otherArea.points, true);
                                                                            const bbox = getBoundingBox(otherArea.points);
                                                                            otherArea.minX = bbox.minX;
                                                                            otherArea.minY = bbox.minY;
                                                                            otherArea.maxX = bbox.maxX;
                                                                            otherArea.maxY = bbox.maxY;
                                                                            otherArea.size = Math.round((getPolygonArea(otherArea.points) / 900) * 100) / 100;
                                                                        } else {
                                                                            // otherArea was completely swallowed!
                                                                            otherArea.points = []; 
                                                                        }
                                                                    } catch (err) {}
                                                                }
                                                            });
                                                            
                                                            area.points = newPoints;
                                                            area.svgPath = pointsToSvgPath(area.points, true);
                                                            const bbox = getBoundingBox(area.points);
                                                            area.minX = bbox.minX;
                                                            area.minY = bbox.minY;
                                                            area.maxX = bbox.maxX;
                                                            area.maxY = bbox.maxY;
                                                            
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
                                            }}>Lưu</button>
                                            <button className={styles.secondaryBtn} style={{ flex: 1, padding: '6px 12px', fontSize: 13 }} onClick={() => setEditingAreaIndex(null)}>Hủy</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* STEP 3 */}
                        {step === 3 && (
                            <>
                                <h2 className={styles.sidebarTitle}>🏬 Sinh sạp tự động</h2>
                                <div className={styles.formGroup}>
                                    <label htmlFor="stall-area">Chọn khu vực</label>
                                    <select id="stall-area" className={styles.formInput}
                                        value={selectedAreaIndex !== null ? selectedAreaIndex : ''}
                                        onChange={e => setSelectedAreaIndex(e.target.value === '' ? null : Number(e.target.value))}>
                                        <option value="" disabled>-- Chọn khu vực --</option>
                                        {areas.map((a, i) => <option key={i} value={i}>{a.name}</option>)}
                                    </select>
                                </div>

                                {selectedAreaIndex !== null && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="stall-prefix">Tiền tố mã sạp</label>
                                            <input id="stall-prefix" className={styles.formInput} value={stallsConfig.prefix}
                                                onChange={e => setStallsConfig({...stallsConfig, prefix: e.target.value})}
                                                placeholder="Vd: S, A, KV1…" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="stall-count">Số lượng sạp</label>
                                            <input id="stall-count" type="number" min="1" className={styles.formInput}
                                                value={stallsConfig.count}
                                                onChange={e => setStallsConfig({...stallsConfig, count: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="stall-size">Diện tích mỗi sạp (m²)</label>
                                            <input id="stall-size" type="number" min="0" className={styles.formInput}
                                                value={stallsConfig.size}
                                                readOnly
                                                style={{backgroundColor: 'var(--mw-gray-50)', color: 'var(--mw-gray-500)'}}
                                                placeholder="Tự động tính..." />
                                        </div>
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="stall-w">Rộng (m)</label>
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
                                                ⚡ Sinh sạp ngay
                                            </button>
                                            <button 
                                                className={styles.secondaryBtn} 
                                                style={{flex: 1, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1'}}
                                                onClick={() => setIsDrawingStall(true)}
                                            >
                                                🖊️ Vẽ sạp thủ công
                                            </button>
                                        </div>
                                        {areas[selectedAreaIndex]?.stalls?.length > 0 && (
                                            <div className={`${styles.infoBox} ${styles.success}`}>
                                                ✅ Đã sinh {areas[selectedAreaIndex].stalls.length} sạp.
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sticky footer actions */}
                    <div className={styles.sidebarActions}>
                        {step === 1 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={onCancel}>← Hủy</button>
                                <button className={styles.primaryBtn} style={{flex:2}} onClick={handleNextStep1}
                                    disabled={!marketInfo.name || !marketInfo.isClosed}>Tiếp theo →</button>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={() => setStep(1)}>← Quay lại</button>
                                <button className={styles.primaryBtn} style={{flex:2}} onClick={handleNextStep2}
                                    disabled={areas.length === 0}>Tiếp theo →</button>
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={() => setStep(2)}>← Quay lại</button>
                                <button className={styles.successBtn} style={{flex:2}} onClick={handleSave} disabled={loading}>
                                    {loading ? '⏳ Đang lưu…' : '✅ Hoàn tất & Lưu'}
                                </button>
                            </>
                        )}
                    </div>
                </aside>

                {/* ─── SVG Canvas ─── */}
                <section className={styles.wizardCanvas}>
                    <div className={styles.canvasToolbar}>
                        <div className={styles.canvasLabel}>
                            🗺️&nbsp;
                            <span>
                                {step === 1 ? 'Vẽ ranh giới chợ' : step === 2 ? 'Vẽ các khu vực trong chợ' : 'Xem trước bố cục sạp hàng'}
                            </span>
                        </div>
                        {step === 1 && marketInfo.points.length > 0 && (
                            <span className={styles.canvasBadge}>{marketInfo.points.length} điểm</span>
                        )}
                        {step === 2 && areas.length > 0 && (
                            <span className={styles.canvasBadge}>{areas.length} khu vực</span>
                        )}
                        {step === 3 && (
                            <span className={styles.canvasBadge}>{areas.reduce((s, a) => s + a.stalls.length, 0)} sạp</span>
                        )}
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
                            role="img" aria-label="Vùng vẽ bản đồ chợ tương tác">

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
                                <path d={a.svgPath}
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
        </main>
    );
};

export default MarketWizard;
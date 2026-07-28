import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import polygonClipping from 'polygon-clipping';

const getPolygonArea = (points) => {
  const { t } = useTranslation();

    let area = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2.0);
};

const PolygonDrawer = ({ 
    onComplete, 
    onCancel,
    marketPolygon,
    existingAreas,
    svgOffsetX = 0,
    svgOffsetY = 0,
    cWidth = 4000,
    cHeight = 4000,
    maxAllowedAreaSize,
    stallMode = false
}) => {
    const [points, setPoints] = useState([]);
    const [mousePos, setMousePos] = useState(null);
    const [isClosed, setIsClosed] = useState(false);
    const canvasRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (scrollContainerRef.current) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    if (svgOffsetX > 0 || svgOffsetY > 0) {
                        // Scroll to the area
                        container.scrollLeft = Math.max(0, svgOffsetX - container.clientWidth / 2 + 100);
                        container.scrollTop = Math.max(0, svgOffsetY - container.clientHeight / 2 + 100);
                    } else {
                        // Default scroll to center
                        container.scrollLeft = (cWidth - container.clientWidth) / 2;
                        container.scrollTop = (cHeight - container.clientHeight) / 2;
                    }
                }
            }, 50);
        }
    }, [cWidth, cHeight, svgOffsetX, svgOffsetY]);

    const handleCanvasClick = (e) => {
        if (isClosed) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        // Cần tính bù thêm scroll position của container nếu có, 
        // nhưng getBoundingClientRect đã là vị trí trên viewport, e.clientX cũng vậy.
        // Nên x, y tương đối với góc trên trái của canvasRef là đúng.
        const x = Math.round((e.clientX - rect.left) / 10) * 10;
        const y = Math.round((e.clientY - rect.top) / 10) * 10;

        if (points.length >= 3) {
            const first = points[0];
            const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
            if (dist <= 20) {
                setIsClosed(true);
                return;
            }
        }
        setPoints([...points, { x, y }]);
    };

    const handleMouseMove = (e) => {
        if (isClosed) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / 10) * 10;
        const y = Math.round((e.clientY - rect.top) / 10) * 10;
        setMousePos({ x, y });
    };

    const handleFinish = () => {
        if (points.length < 3) {
            setErrorMsg('Bạn cần vẽ ít nhất 3 điểm!');
            return;
        }

        // Chuyển sang tọa độ thật (database coordinates)
        const dbPoints = points.map(p => ({
            x: p.x - svgOffsetX,
            y: p.y - svgOffsetY
        }));

        // Kiểm tra diện tích
        const areaPx = getPolygonArea(dbPoints);
        const areaM2 = areaPx / 900;
        if (maxAllowedAreaSize > 0 && areaM2 > maxAllowedAreaSize) {
            setErrorMsg('Diện tích vượt quá giới hạn cho phép! (Vẽ: ${Math.round(areaM2)} m², Tối đa: ${Math.round(maxAllowedAreaSize)} m²)');
            setIsClosed(false);
            return;
        }

        // Tạo mảng điểm cho polygon-clipping
        const drawnPoly = [dbPoints.map(p => [p.x, p.y])];

        if (marketPolygon && marketPolygon.length >= 3) {
            // marketPolygon đang ở tọa độ thật (db coordinates)
            const marketPolyInput = [marketPolygon];
            
            // 1. Kiểm tra nằm hoàn toàn trong chợ (Intersection của drawn và market == drawn)
            const intersectionWithMarket = polygonClipping.intersection(drawnPoly, marketPolyInput);
            if (intersectionWithMarket.length === 0) {
                setErrorMsg(stallMode ? 'Sạp phải nằm bên trong ranh giới khu vực!' : 'Khu vực phải nằm bên trong ranh giới chợ!');
                setIsClosed(false);
                return;
            }
            
            // So sánh diện tích giao cắt với diện tích vẽ. Nếu nhỏ hơn => bị rớt ra ngoài 1 phần.
            let intersectionArea = 0;
            intersectionWithMarket.forEach(poly => {
                poly.forEach(ring => {
                    intersectionArea += getPolygonArea(ring.map(p => ({x: p[0], y: p[1]})));
                });
            });
            // Cho phép sai số nhỏ 1px
            if (Math.abs(intersectionArea - areaPx) > 100) {
                setErrorMsg(stallMode ? 'Sạp vẽ bị lọt ra ngoài ranh giới khu vực!' : 'Khu vực vẽ bị lọt ra ngoài ranh giới chợ!');
                setIsClosed(false);
                return;
            }
        }

        if (existingAreas && existingAreas.length > 0) {
            // 2. Kiểm tra đè lấp lên các khu vực hiện tại
            let hasOverlap = false;
            for (let area of existingAreas) {
                if (area.svgPath) {
                    const matches = [...area.svgPath.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                    if (matches.length > 2) {
                        const exMinX = area.minX ?? area.MinX ?? 0;
                        const exMinY = area.minY ?? area.MinY ?? 0;
                        const exPoly = [matches.map(m => [parseFloat(m[1]) + exMinX, parseFloat(m[2]) + exMinY])];
                        const overlap = polygonClipping.intersection(drawnPoly, exPoly);
                        if (overlap.length > 0) {
                            hasOverlap = true;
                            break;
                        }
                    }
                }
            }
            
            if (hasOverlap) {
                setErrorMsg(stallMode ? 'Sạp vẽ bị đè lấp lên sạp khác đã tồn tại!' : 'Khu vực vẽ bị đè lấp lên khu vực khác đã tồn tại!');
                setIsClosed(false);
                return;
            }
        }

        // Hợp lệ, tạo svgPath thật
        const minX = Math.min(...dbPoints.map(p => p.x));
        const minY = Math.min(...dbPoints.map(p => p.y));
        const maxX = Math.max(...dbPoints.map(p => p.x));
        const maxY = Math.max(...dbPoints.map(p => p.y));
        
        let path = '';
        dbPoints.forEach((p, index) => {
            const nx = p.x - minX;
            const ny = p.y - minY;
            if (index === 0) path += `M ${nx},${ny} `;
            else path += `L ${nx},${ny} `;
        });
        path += 'Z';
        
        onComplete({
            svgPath: path,
            minX: minX,
            minY: minY,
            width: maxX - minX,
            height: maxY - minY,
            areaM2: areaM2
        });
    };

    const handleClear = () => {
        setPoints([]);
        setIsClosed(false);
        setErrorMsg('');
    };

    let previewPath = '';
    if (points.length > 0) {
        points.forEach((p, index) => {
            if (index === 0) previewPath += `M ${p.x},${p.y} `;
            else previewPath += `L ${p.x},${p.y} `;
        });
        if (isClosed) {
            previewPath += 'Z';
        } else if (mousePos) {
            previewPath += `L ${mousePos.x},${mousePos.y}`;
        }
    }

    const modalContent = (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', padding: '0', borderRadius: '16px',
                width: '95vw', height: '95vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#0f172a' }}>{stallMode ? 'Vẽ Hình Dáng Sạp Thực Tế' : 'Vẽ Hình Dáng Khu Vực Thực Tế'}</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                            {stallMode 
                                ? 'Di chuyển chuột lên bản đồ và vẽ. Khu vực không được đè lên khu vực khác và không vượt quá diện tích chợ.'
                                : 'Di chuyển chuột lên bản đồ và vẽ. Khu vực không được đè lên khu vực khác và không vượt quá diện tích chợ.'}
                        </p>
                        {errorMsg && <p style={{ margin: '8px 0 0 0', color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>⚠️ {errorMsg}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleClear} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{'Xóa vẽ lại'}</button>
                        <button onClick={handleFinish} disabled={points.length < 3 || !isClosed} style={{ padding: '8px 16px', border: 'none', background: (points.length >= 3 && isClosed) ? '#10b981' : '#94a3b8', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{'Lưu Hình Dáng'}</button>
                        <button onClick={onCancel} style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{'Đóng'}</button>
                    </div>
                </div>

                <div 
                    ref={scrollContainerRef}
                    style={{ flex: 1, overflow: 'auto', background: '#f1f5f9', position: 'relative', cursor: isClosed ? 'default' : 'crosshair' }}
                >
                    <div 
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        onMouseMove={handleMouseMove}
                        style={{
                            width: cWidth > 0 ? cWidth : 2000,
                            height: cHeight > 0 ? cHeight : 2000,
                            position: 'relative',
                            backgroundColor: 'white',
                            backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
                            backgroundSize: '10px 10px'
                        }}
                    >
                        {/* Ranh giới chợ */}
                        {marketPolygon && (
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                <g transform={`translate(${svgOffsetX}, ${svgOffsetY})`}>
                                    <path d={
                                        marketPolygon.map((p, i) => (i===0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ') + ' Z'
                                    } fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
                                </g>
                            </svg>
                        )}
                        
                        {existingAreas && existingAreas.map((area, idx) => {
                            const x = area.mapX !== undefined ? area.mapX : (area.minX !== undefined ? area.minX : 0);
                            const y = area.mapY !== undefined ? area.mapY : (area.minY !== undefined ? area.minY : 0);
                            
                            let path = area.svgPath;
                            if (path) {
                                const matches = [...path.matchAll(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g)];
                                if (matches.length > 0) {
                                    const pMinX = Math.min(...matches.map(m => parseFloat(m[1])));
                                    const pMinY = Math.min(...matches.map(m => parseFloat(m[2])));
                                    // Normalize to relative path
                                    path = matches.map((m, i) => `${i === 0 ? 'M' : 'L'} ${parseFloat(m[1]) - pMinX},${parseFloat(m[2]) - pMinY}`).join(' ') + ' Z';
                                }
                            }
                            
                            return path ? (
                                <svg key={area.id || area.areaId || area.stallId || idx} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                    <g transform={`translate(${svgOffsetX + x}, ${svgOffsetY + y})`}>
                                        <path d={path} fill="rgba(203, 213, 225, 0.5)" stroke="#94a3b8" strokeWidth="1" />
                                    </g>
                                </svg>
                            ) : (
                                <div 
                                    key={area.id || area.areaId || area.stallId || idx} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: svgOffsetX + x, 
                                        top: svgOffsetY + y, 
                                        width: area.width || 100, 
                                        height: area.height || 100,
                                        background: 'rgba(203, 213, 225, 0.5)',
                                        border: '1px solid #94a3b8',
                                        pointerEvents: 'none'
                                    }}
                                />
                            );
                        })}

                        {/* Hình đang vẽ */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {previewPath && (
                                <path 
                                    d={previewPath} 
                                    fill={isClosed ? 'rgba(16, 185, 129, 0.3)' : 'none'}
                                    stroke="#10b981" 
                                    strokeWidth="2" 
                                    strokeLinejoin="round" 
                                />
                            )}
                            
                            {/* Anchor points */}
                            {points.map((p, i) => (
                                <circle 
                                    key={i} 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={i === 0 && !isClosed ? "8" : "5"} 
                                    fill={i === 0 ? "#ef4444" : "#10b981"} 
                                />
                            ))}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
    return createPortal(modalContent, document.body);
};

export default PolygonDrawer;

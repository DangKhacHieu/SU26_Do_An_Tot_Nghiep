import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import styles from './Viewer.module.css';
import { getMarketMap } from '../../../../services/marketApi';

const MarketMapViewer = ({ marketId, onBack }) => {
  const { t } = useTranslation();

    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAreaId, setSelectedAreaId] = useState(null);

    useEffect(() => {
        loadMap();
    }, [marketId]);

    const loadMap = async () => {
        try {
            const data = await getMarketMap(marketId);
            setMarketData(data);
        } catch (error) {
            console.error("Failed to load market map", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>{'Đang tải bản đồ...'}</div>;
    if (!marketData) return <div style={{ padding: 40, textAlign: 'center' }}>{'Không tìm thấy dữ liệu bản đồ.'}</div>;


    let viewBox = "0 0 800 600";
    const { svgPath, areas } = marketData;
    
    // Calculate bounds from areas if market bounds are missing
    let finalMinX = marketData.minX;
    let finalMinY = marketData.minY;
    let finalMaxX = marketData.maxX;
    let finalMaxY = marketData.maxY;

    if (finalMinX == null && areas && areas.length > 0) {
        const validAreas = areas.filter(a => a.minX != null);
        if (validAreas.length > 0) {
            finalMinX = Math.min(...validAreas.map(a => a.minX));
            finalMinY = Math.min(...validAreas.map(a => a.minY));
            finalMaxX = Math.max(...validAreas.map(a => a.maxX));
            finalMaxY = Math.max(...validAreas.map(a => a.maxY));
        }
    }

    // Ensure viewBox also encompasses the market's svgPath if present
    if (svgPath) {
        const matches = [...svgPath.matchAll(/(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/g)];
        if (matches.length > 0) {
            const xs = matches.map(m => parseFloat(m[1]));
            const ys = matches.map(m => parseFloat(m[2]));
            const svgMinX = Math.min(...xs);
            const svgMinY = Math.min(...ys);
            const svgMaxX = Math.max(...xs);
            const svgMaxY = Math.max(...ys);

            finalMinX = finalMinX != null ? Math.min(finalMinX, svgMinX) : svgMinX;
            finalMinY = finalMinY != null ? Math.min(finalMinY, svgMinY) : svgMinY;
            finalMaxX = finalMaxX != null ? Math.max(finalMaxX, svgMaxX) : svgMaxX;
            finalMaxY = finalMaxY != null ? Math.max(finalMaxY, svgMaxY) : svgMaxY;
        }
    }

    if (finalMinX != null && finalMaxX != null) {
        const width = finalMaxX - finalMinX;
        const height = finalMaxY - finalMinY;
        const paddingX = Math.max(20, width * 0.05);
        const paddingY = Math.max(20, height * 0.05);
        viewBox = `${finalMinX - paddingX} ${finalMinY - paddingY} ${width + paddingX * 2} ${height + paddingY * 2}`;
    }

    // Calculate totals for the stats
    const totalAreas = areas?.length || 0;
    const totalStalls = areas?.reduce((acc, area) => acc + (area.stalls?.length || 0), 0) || 0;

    return (
        <main className={styles.viewerContainer}>
            <header className={styles.viewerHeader}>
                <div>
                    <h1>Bản đồ chi tiết: {marketData.marketName}</h1>
                    <p style={{ color: 'var(--mw-text-muted)', margin: '8px 0 0 0' }}>
                        📍 {marketData.address || 'Chưa cập nhật địa chỉ'} {marketData.size ? `• Diện tích: ${marketData.size}m²` : ''}
                    </p>
                </div>
                <button className={styles.secondaryBtn} onClick={onBack} aria-label={'Quay lại danh sách chợ'}>
                    {'← Quay lại'}</button>
            </header>
            
            <section className={styles.viewerContent}>
                <div className={styles.viewerMapWrapper}>
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={viewBox}
                            style={{ 
                                backgroundColor: '#f8fafc',
                                backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}
                            aria-label={'Bản đồ trực quan của chợ ${marketData.marketName}'}
                            role="img"
                        >
                        {/* Render Market Polygon */}
                        {svgPath && (
                            <path
                                d={svgPath}
                                fill="rgba(59,130,246,0.05)"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                opacity="0.8"
                            />
                        )}

                        {/* Render Areas and Stalls */}
                        {areas?.map((area, aIdx) => {
                            const isSelected = selectedAreaId === (area.areaId || aIdx);
                            const pathD = area.svgPath || (area.minX != null && area.maxX != null && area.minY != null && area.maxY != null ? `M 0,0 L ${area.maxX - area.minX},0 L ${area.maxX - area.minX},${area.maxY - area.minY} L 0,${area.maxY - area.minY} Z` : null);
                            
                            return (
                                <g key={area.areaId || aIdx} id={`area-${area.areaId || aIdx}`}>
                                    {pathD && (
                                        <path
                                            d={pathD}
                                            fill={isSelected ? "rgba(46, 204, 113, 0.25)" : "rgba(46, 204, 113, 0.08)"}
                                            stroke={isSelected ? "#27ae60" : "#2ecc71"}
                                            strokeWidth={isSelected ? "3" : "2"}
                                            style={{ transition: 'all 0.3s', cursor: 'pointer' }}
                                            onClick={() => setSelectedAreaId(isSelected ? null : (area.areaId || aIdx))}
                                        />
                                    )}
                                    
                                    {/* Render stalls always, not just when selected */}
                                    <g>
                                        {area.stalls?.map((stall, sIdx) => {
                                            const renderX = (area.minX || 0) + (stall.mapX || 0);
                                            const renderY = (area.minY || 0) + (stall.mapY || 0);

                                            return (
                                            <g key={stall.stallId || sIdx} transform={`translate(${renderX}, ${renderY})`} id={`stall-${stall.stallId || stall.code}`}>
                                                {stall.svgPath ? (
                                                    <path
                                                        d={stall.svgPath}
                                                        fill={isSelected ? "#2563eb" : "#3b82f6"}
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                        style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.target.setAttribute('fill', '#1d4ed8')}
                                                        onMouseLeave={(e) => e.target.setAttribute('fill', isSelected ? '#2563eb' : '#3b82f6')}
                                                    />
                                                ) : (
                                                    <rect
                                                        width={stall.width}
                                                        height={stall.height}
                                                        fill={isSelected ? "#2563eb" : "#3b82f6"}
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                        rx="4"
                                                        style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.target.setAttribute('fill', '#1d4ed8')}
                                                        onMouseLeave={(e) => e.target.setAttribute('fill', isSelected ? '#2563eb' : '#3b82f6')}
                                                    />
                                                )}
                                                <text
                                                    x={stall.svgPath ? stall.width / 2 : stall.width / 2}
                                                    y={stall.svgPath ? stall.height / 2 : stall.height / 2}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fill="#ffffff"
                                                    fontSize={Math.min(stall.width, stall.height) * 0.4}
                                                    fontWeight="bold"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {stall.code}
                                                </text>
                                            </g>
                                            );
                                        })}
                                    </g>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <aside className={styles.viewerSidebar}>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{totalAreas}</div>
                            <div className={styles.statLabel}>{'Khu vực'}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{totalStalls}</div>
                            <div className={styles.statLabel}>{'Sạp hàng'}</div>
                        </div>
                    </div>

                    <div className={styles.legendTitle}>{'Chú giải bản đồ'}</div>
                    
                    <div className={styles.viewerLegendItem}>
                        <div className={styles.legendBox} style={{ background: 'rgba(5,150,105,.15)', border: '2px solid #059669' }}></div>
                        <div className={styles.legendItemText}>
                            <strong>{'Khu vực chợ'}</strong>
                            <small>{'Click để xem sạp bên trong'}</small>
                        </div>
                    </div>

                    <div className={styles.viewerLegendItem}>
                        <div className={styles.legendBox} style={{ background: '#3b82f6', border: '2px solid #2563eb', borderRadius: 4 }}></div>
                        <div className={styles.legendItemText}>
                            <strong>{'Sạp hàng'}</strong>
                            <small>{'Vị trí gian hàng'}</small>
                        </div>
                    </div>

                    {selectedAreaId !== null && (
                        <div className={styles.activeAreaBanner}>
                            <strong>{'✓ Đang xem khu vực'}</strong>
                            <span>{'Các sạp trong khu vực này đang được hiển thị trên bản đồ.'}</span>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
};

export default MarketMapViewer;
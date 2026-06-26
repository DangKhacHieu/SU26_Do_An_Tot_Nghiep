import React, { useState, useEffect } from 'react';
import styles from './Viewer.module.css';
import { getMarketMap } from '../../../../services/marketApi';

const MarketMapViewer = ({ marketId, onBack }) => {
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

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải bản đồ...</div>;
    if (!marketData) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy dữ liệu bản đồ.</div>;

    const padding = 50;
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

    if (finalMinX != null && finalMaxX != null) {
        viewBox = `${finalMinX - padding} ${finalMinY - padding} ${finalMaxX - finalMinX + padding * 2} ${finalMaxY - finalMinY + padding * 2}`;
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
                <button className={styles.secondaryBtn} onClick={onBack} aria-label="Quay lại danh sách chợ">
                    ← Quay lại
                </button>
            </header>
            
            <section className={styles.viewerContent}>
                <div className={styles.viewerMapWrapper}>
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={viewBox}
                        style={{ backgroundColor: '#1e293b' }}
                        aria-label={`Bản đồ trực quan của chợ ${marketData.marketName}`}
                        role="img"
                    >
                        {/* Render Market Polygon */}
                        {svgPath && (
                            <path
                                d={svgPath}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2"
                                opacity="0.1"
                            />
                        )}

                        {/* Render Areas and Stalls */}
                        {areas?.map((area, aIdx) => {
                            const isSelected = selectedAreaId === (area.areaId || aIdx);
                            const pathD = area.svgPath || (area.minX != null ? `M ${area.minX},${area.minY} L ${area.maxX},${area.minY} L ${area.maxX},${area.maxY} L ${area.minX},${area.maxY} Z` : null);
                            
                            return (
                                <g key={area.areaId || aIdx} id={`area-${area.areaId || aIdx}`}>
                                    {pathD && (
                                        <path
                                            d={pathD}
                                            fill={isSelected ? "rgba(46, 204, 113, 0.4)" : "rgba(46, 204, 113, 0.15)"}
                                            stroke="#2ecc71"
                                            strokeWidth={isSelected ? "4" : "2"}
                                            style={{ cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                            onClick={() => setSelectedAreaId(isSelected ? null : (area.areaId || aIdx))}
                                        />
                                    )}
                                    
                                    {/* Render stalls with a subtle fade-in animation */}
                                    {/* Render stalls only when selected to optimize performance */}
                                    {isSelected && (
                                        <g style={{ animation: 'fadeIn 0.3s ease' }}>
                                            {area.stalls?.map((stall, sIdx) => {
                                                // Auto-correct old seeded data which used relative coordinates (e.g. 0,0)
                                                let renderX = stall.mapX;
                                                let renderY = stall.mapY;
                                                if (renderX < area.minX || renderY < area.minY) {
                                                    renderX = area.minX + stall.mapX;
                                                    renderY = area.minY + stall.mapY;
                                                }

                                                return (
                                                <g key={stall.stallId || sIdx} transform={`translate(${renderX}, ${renderY})`} id={`stall-${stall.stallId || stall.code}`}>
                                                    <rect
                                                        width={stall.width}
                                                        height={stall.height}
                                                        fill="#3b82f6"
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                        rx="4"
                                                        style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.target.setAttribute('fill', '#2563eb')}
                                                        onMouseLeave={(e) => e.target.setAttribute('fill', '#3b82f6')}
                                                    />
                                                    <text
                                                        x={stall.width / 2}
                                                        y={stall.height / 2}
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
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <aside className={styles.viewerSidebar}>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{totalAreas}</div>
                            <div className={styles.statLabel}>Khu vực</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{totalStalls}</div>
                            <div className={styles.statLabel}>Sạp hàng</div>
                        </div>
                    </div>

                    <div className={styles.legendTitle}>Chú giải bản đồ</div>
                    
                    <div className={styles.viewerLegendItem}>
                        <div className={styles.legendBox} style={{ background: 'rgba(5,150,105,.15)', border: '2px solid #059669' }}></div>
                        <div className={styles.legendItemText}>
                            <strong>Khu vực chợ</strong>
                            <small>Click để xem sạp bên trong</small>
                        </div>
                    </div>

                    <div className={styles.viewerLegendItem}>
                        <div className={styles.legendBox} style={{ background: '#3b82f6', border: '2px solid #2563eb', borderRadius: 4 }}></div>
                        <div className={styles.legendItemText}>
                            <strong>Sạp hàng</strong>
                            <small>Vị trí gian hàng</small>
                        </div>
                    </div>

                    {selectedAreaId !== null && (
                        <div className={styles.activeAreaBanner}>
                            <strong>✓ Đang xem khu vực</strong>
                            <span>Các sạp trong khu vực này đang được hiển thị trên bản đồ.</span>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
};

export default MarketMapViewer;
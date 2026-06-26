import React, { useState, useRef, useMemo } from 'react';
import styles from './LayoutEditor.module.css';
import { createMarketBulk } from '../../../../services/marketApi';

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

const MarketWizard = ({ onCancel, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Market Info & Shape
    const [marketInfo, setMarketInfo] = useState({
        name: '',
        address: '',
        size: '',
        points: [],
        isClosed: false
    });

    // Step 2: Areas
    const [areas, setAreas] = useState([]);
    const [drawingArea, setDrawingArea] = useState(null); // {name, points, isClosed, size}: false }

    // Step 3: Stalls
    const [selectedAreaIndex, setSelectedAreaIndex] = useState(null);
    const [stallsConfig, setStallsConfig] = useState({ prefix: 'S', count: 10, width: 20, height: 20, size: 4 });

    const svgRef = useRef(null);

    // Common SVG click handler
    const handleSvgClick = (e) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        if (step === 1 && !marketInfo.isClosed) {
            setMarketInfo(prev => ({ ...prev, points: [...prev.points, [x, y]] }));
        } else if (step === 2 && drawingArea && !drawingArea.isClosed) {
            setDrawingArea(prev => ({ ...prev, points: [...prev.points, [x, y]] }));
        }
    };

    // Step 1 Actions
    const closeMarketShape = () => setMarketInfo(prev => ({ ...prev, isClosed: true }));
    const resetMarketShape = () => setMarketInfo(prev => ({ ...prev, points: [], isClosed: false }));

    // Step 2 Actions
    const startNewArea = () => setDrawingArea({ name: `Khu vực ${areas.length + 1}`, points: [], isClosed: false, size: '' });
    const closeAreaShape = () => setDrawingArea(prev => ({ ...prev, isClosed: true }));
    const saveArea = () => {
        if (!drawingArea.isClosed || drawingArea.points.length < 3) return;

        const marketSize = parseFloat(marketInfo.size) || 0;
        const currentAreasSize = areas.reduce((sum, a) => sum + (a.size || 0), 0);
        const newAreaSize = parseFloat(drawingArea.size) || 0;

        if (marketSize > 0 && (currentAreasSize + newAreaSize) > marketSize) {
            alert(`Lỗi: Diện tích khu vực mới (${newAreaSize} m²) làm tổng diện tích các khu vực (${currentAreasSize + newAreaSize} m²) vượt quá diện tích của chợ (${marketSize} m²)!`);
            return;
        }

        const bbox = getBoundingBox(drawingArea.points);
        setAreas([...areas, {
            ...drawingArea,
            svgPath: pointsToSvgPath(drawingArea.points, true),
            minX: bbox.minX,
            minY: bbox.minY,
            maxX: bbox.maxX,
            maxY: bbox.maxY,
            size: newAreaSize > 0 ? newAreaSize : null,
            stalls: []
        }]);
        setDrawingArea(null);
    };
    const cancelDrawingArea = () => setDrawingArea(null);

    // Step 3 Actions
    const generateStalls = () => {
        if (selectedAreaIndex === null) return;
        const area = areas[selectedAreaIndex];
        const w = parseInt(stallsConfig.width);
        const h = parseInt(stallsConfig.height);
        const count = parseInt(stallsConfig.count);
        const spacing = 5;

        const newStalls = [];
        let codeCounter = 1;

        for (let y = area.minY; y <= area.maxY - h; y += h + spacing) {
            for (let x = area.minX; x <= area.maxX - w; x += w + spacing) {
                if (newStalls.length >= count) break;
                
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                
                if (pointInPolygon([centerX, centerY], area.points)) {
                    newStalls.push({
                        code: `${stallsConfig.prefix}${codeCounter++}`,
                        width: w,
                        height: h,
                        size: stallsConfig.size ? parseFloat(stallsConfig.size) : null,
                        mapX: x,
                        mapY: y
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
                        MapY: s.mapY
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
                                        onChange={e => setMarketInfo({...marketInfo, size: e.target.value})}
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
                                <h2 className={styles.sidebarTitle}>🗺️ Phân lô khu vực</h2>

                                {!drawingArea ? (
                                    <>
                                        <button className={styles.primaryBtn} style={{width:'100%'}} onClick={startNewArea}>
                                            + Vẽ khu vực mới
                                        </button>
                                        {areas.length === 0 && (
                                            <div className={styles.infoBox}>Bấm <strong>Vẽ khu vực mới</strong> rồi click lên vùng chợ để phân chia các khu vực.</div>
                                        )}
                                        <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:4}}>
                                            {areas.map((a, i) => (
                                                <article key={i} className={styles.areaItem}>
                                                    <div>
                                                        <h4>{a.name}</h4>
                                                        <p>{a.points.length} điểm • {a.size ? `${a.size} m²` : 'Chưa nhập diện tích'}</p>
                                                    </div>
                                                    <span style={{fontSize:11, color:'var(--mw-success)', fontWeight:600}}>✓ Đã lưu</span>
                                                </article>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.infoBox}>Đang vẽ — click nhiều điểm để tạo hình, sau đó nhấn <strong>Khép kín</strong>.</div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="area-name">Tên khu vực</label>
                                            <input id="area-name" className={styles.formInput} value={drawingArea.name}
                                                onChange={e => setDrawingArea({...drawingArea, name: e.target.value})} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="area-size">Diện tích (m²)</label>
                                            <input id="area-size" className={styles.formInput} type="number" min="0"
                                                value={drawingArea.size}
                                                onChange={e => setDrawingArea({...drawingArea, size: e.target.value})}
                                                placeholder="Vd: 200" />
                                        </div>
                                        {!drawingArea.isClosed && drawingArea.points.length > 2 && (
                                            <button className={styles.primaryBtn} style={{width:'100%'}} onClick={closeAreaShape}>
                                                ✔ Khép kín ({drawingArea.points.length} điểm)
                                            </button>
                                        )}
                                        {drawingArea.isClosed && (
                                            <button className={styles.successBtn} style={{width:'100%'}} onClick={saveArea}>💾 Lưu khu vực này</button>
                                        )}
                                        <button className={styles.secondaryBtn} style={{width:'100%'}} onClick={cancelDrawingArea}>✕ Hủy vẽ</button>
                                    </>
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
                                                onChange={e => setStallsConfig({...stallsConfig, size: e.target.value})}
                                                placeholder="Vd: 4" />
                                        </div>
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="stall-w">Rộng (px)</label>
                                                <input id="stall-w" type="number" min="1" className={styles.formInput}
                                                    value={stallsConfig.width}
                                                    onChange={e => setStallsConfig({...stallsConfig, width: e.target.value})} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="stall-h">Cao (px)</label>
                                                <input id="stall-h" type="number" min="1" className={styles.formInput}
                                                    value={stallsConfig.height}
                                                    onChange={e => setStallsConfig({...stallsConfig, height: e.target.value})} />
                                            </div>
                                        </div>
                                        <button className={styles.primaryBtn} style={{width:'100%', marginTop:4}} onClick={generateStalls}>
                                            ⚡ Sinh sạp ngay
                                        </button>
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
                                <button className={styles.primaryBtn} style={{flex:2}} onClick={() => setStep(2)}
                                    disabled={!marketInfo.name || !marketInfo.isClosed}>Tiếp theo →</button>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <button className={styles.secondaryBtn} style={{flex:1}} onClick={() => setStep(1)}>← Quay lại</button>
                                <button className={styles.primaryBtn} style={{flex:2}} onClick={() => setStep(3)}
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

                    <svg ref={svgRef} className={styles.svgArea} onClick={handleSvgClick}
                        role="img" aria-label="Vùng vẽ bản đồ chợ tương tác">

                        {/* Market outline */}
                        {marketInfo.points.length > 0 && (
                            <path d={pointsToSvgPath(marketInfo.points, marketInfo.isClosed)}
                                fill={marketInfo.isClosed ? 'rgba(59,130,246,.07)' : 'none'}
                                stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
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
                                    strokeWidth="2" strokeLinejoin="round" />
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
                                        <rect x={s.mapX} y={s.mapY} width={s.width} height={s.height}
                                            fill="#fff" stroke="#3b82f6" strokeWidth="1.5" rx="3" />
                                        {/* Skip text rendering if stall is too small to improve perf */}
                                        {(s.width > 15 && s.height > 15) && (
                                            <text x={s.mapX + s.width / 2} y={s.mapY + s.height / 2}
                                                fontSize={Math.min(s.width, s.height) * 0.4} fill="#1e40af" textAnchor="middle"
                                                dominantBaseline="middle" fontWeight="600"
                                                fontFamily="Inter, system-ui, sans-serif"
                                                style={{pointerEvents:'none'}}>
                                                {s.code}
                                            </text>
                                        )}
                                    </g>
                                ))}
                            </g>
                        )), [areas, selectedAreaIndex])}

                        {/* Currently drawing area */}
                        {drawingArea && drawingArea.points.length > 0 && (
                            <path d={pointsToSvgPath(drawingArea.points, drawingArea.isClosed)}
                                fill={drawingArea.isClosed ? 'rgba(220,38,38,.1)' : 'none'}
                                stroke="#dc2626" strokeWidth="2"
                                strokeDasharray={drawingArea.isClosed ? 'none' : '5 4'}
                                strokeLinejoin="round" />
                        )}
                        {step === 2 && drawingArea && !drawingArea.isClosed && drawingArea.points.map((p, i) => (
                            <circle key={`a-pt-${i}`} cx={p[0]} cy={p[1]} r="5" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                        ))}
                    </svg>
                </section>
            </div>
        </main>
    );
};

export default MarketWizard;
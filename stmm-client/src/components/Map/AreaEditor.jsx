import React, { useState } from 'react';
import { Stage, Layer, Line, Image as KonvaImage, Circle, Text } from 'react-konva';
import useImage from 'use-image'; // Tuỳ chọn, nếu muốn load ảnh background từ URL

export default function AreaEditor({ market, onSave, width = 900 }) {
  const [points, setPoints] = useState([]); // toạ độ gốc trên DB
  const [drawing, setDrawing] = useState(true);

  if (!market) return <div>Loading Editor...</div>;

  const marketWidth = market.maxX - market.minX;
  const marketHeight = market.maxY - market.minY;
  
  if (!marketWidth || !marketHeight) {
    return <div>Chưa có dữ liệu toạ độ tổng thể cho chợ này để làm chuẩn. Vui lòng cập nhật toạ độ chợ trước.</div>;
  }

  const scale = width / marketWidth;
  const height = marketHeight * scale;

  const handleStageClick = (e) => {
    if (!drawing) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Convert click position (pixels) to DB coordinates
    const dbX = (pos.x / scale) + market.minX;
    const dbY = (pos.y / scale) + market.minY;
    
    setPoints([...points, [dbX, dbY]]);
  };

  const finishDrawing = () => {
    if (points.length >= 3) {
      setDrawing(false);
    } else {
      alert("Cần ít nhất 3 điểm để tạo thành một khu vực (đa giác).");
    }
  };

  const handleSave = () => {
    if (points.length < 3) return;
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    
    const areaData = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      svgPath: JSON.stringify(points),
    };
    onSave && onSave(areaData);
    
    // Reset để vẽ tiếp
    setPoints([]);
    setDrawing(true);
  };

  const resetDrawing = () => {
    setPoints([]);
    setDrawing(true);
  };

  const renderPoints = points.flatMap(([x, y]) => [(x - market.minX) * scale, (y - market.minY) * scale]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Công cụ tạo Khu Vực</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {drawing ? "Click vào bản đồ để vẽ các đỉnh của khu vực. Double-click để hoàn thành." : "Đã vẽ xong đa giác. Bấm Lưu hoặc Vẽ lại."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={resetDrawing} 
            disabled={points.length === 0}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Vẽ lại
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={drawing || points.length < 3}
            style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Xác nhận Toạ Độ
          </button>
        </div>
      </div>

      <div style={{ border: '2px dashed #999', backgroundColor: '#f9f9f9', display: 'inline-block' }}>
        <Stage 
          width={width} 
          height={height} 
          onClick={handleStageClick} 
          onDblClick={finishDrawing}
          style={{ cursor: drawing ? 'crosshair' : 'default' }}
        >
          <Layer>
            {/* Vẽ đường viền tổng thể của chợ nếu có SvgPath */}
            {market.svgPath && (
              <Line
                points={JSON.parse(market.svgPath).flatMap(([x, y]) => [(x - market.minX) * scale, (y - market.minY) * scale])}
                stroke="#ccc"
                strokeWidth={2}
                closed
              />
            )}
            
            {/* Vẽ các vùng đã có sẵn (tham khảo) */}
            {market.areas && market.areas.map(area => {
              if (!area.svgPath) return null;
              const pts = JSON.parse(area.svgPath).flatMap(([x, y]) => [(x - market.minX) * scale, (y - market.minY) * scale]);
              return (
                <Line
                  key={area.areaId}
                  points={pts}
                  stroke="#ddd"
                  fill="rgba(200,200,200,0.3)"
                  closed
                />
              );
            })}

            {/* Vẽ vùng đang vẽ */}
            {renderPoints.length > 0 && (
              <Line
                points={renderPoints}
                stroke="red"
                strokeWidth={2}
                closed={!drawing}
                fill={drawing ? "transparent" : "rgba(255,0,0,0.2)"}
              />
            )}
            
            {/* Đánh dấu các đỉnh đang vẽ */}
            {points.map((p, i) => (
              <Circle
                key={i}
                x={(p[0] - market.minX) * scale}
                y={(p[1] - market.minY) * scale}
                radius={4}
                fill="red"
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

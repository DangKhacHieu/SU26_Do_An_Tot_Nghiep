import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer, Text, Group } from 'react-konva';

export default function StallEditor({ area, onSave, width = 700 }) {
  const rectRef = useRef();
  const trRef = useRef();
  
  // Trạng thái của sạp đang được chỉnh sửa (có thể mở rộng để nhận stall khởi tạo nếu là Update)
  const [attrs, setAttrs] = useState({ 
    x: 10, // Toạ độ trên canvas, tương đối
    y: 10, 
    width: 40, 
    height: 40, 
    rotation: 0 
  });

  const areaWidth = area.maxX - area.minX;
  const areaHeight = area.maxY - area.minY;

  const scale = width / areaWidth;
  const height = areaHeight * scale;

  useEffect(() => {
    if (trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [attrs]);

  const handleTransformEnd = () => {
    const node = rectRef.current;
    if (!node) return;
    
    // Konva thay đổi scaleX/scaleY khi resize, ta cần quy đổi ngược lại về width/height thực tế
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale về 1 để không bị tích lũy
    node.scaleX(1);
    node.scaleY(1);
    
    setAttrs({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const handleDragEnd = () => {
    const node = rectRef.current;
    if (!node) return;
    setAttrs({
      ...attrs,
      x: node.x(),
      y: node.y(),
    });
  };

  const handleSave = () => {
    // Quy đổi toạ độ từ màn hình Canvas về toạ độ DB (của hệ toạ độ Market)
    // attrs.x/y đang tính từ góc trên bên trái của Area.
    
    const dbX = area.minX + (attrs.x / scale);
    const dbY = area.minY + (attrs.y / scale);
    const dbWidth = attrs.width / scale;
    const dbHeight = attrs.height / scale;
    
    const stallData = {
      mapX: dbX,
      mapY: dbY,
      width: dbWidth,
      height: dbHeight,
      rotation: attrs.rotation
    };
    
    onSave && onSave(stallData);
  };

  if (!area) return <div>Loading Area...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Công cụ tạo/chỉnh sửa Sạp</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Kéo thả, xoay và thay đổi kích thước sạp. Bấm "Lưu Toạ Độ Sạp" khi hoàn tất.
          </p>
        </div>
        <div>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave} 
            style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Lưu Toạ Độ Sạp
          </button>
        </div>
      </div>

      <div style={{ border: '2px solid #ccc', backgroundColor: '#fafafa', display: 'inline-block' }}>
        <Stage width={width} height={height}>
          <Layer>
            {/* Vẽ đường viền của Area này để tham khảo */}
            {area.svgPath && (
              <Group>
                {/* Viền Khu vực */}
                <Text text={area.name} x={10} y={10} fontSize={16} fill="#aaa" />
                {/* 
                  Toạ độ của area.svgPath được lưu trữ theo gốc của Market.
                  Khi vẽ bên trong AreaEditor, ta cần dịch chuyển lại gốc toạ độ về area.minX, area.minY
                */}
              </Group>
            )}

            {/* Các sạp đã có */}
            {area.stalls && area.stalls.map(stall => (
              <Rect
                key={stall.stallId}
                x={(stall.mapX - area.minX) * scale}
                y={(stall.mapY - area.minY) * scale}
                width={(stall.width || 20) * scale}
                height={(stall.height || 20) * scale}
                rotation={stall.rotation || 0}
                fill="#e0e0e0"
                stroke="#999"
                strokeWidth={1}
              />
            ))}

            {/* Sạp đang được thao tác */}
            <Rect
              ref={rectRef}
              x={attrs.x}
              y={attrs.y}
              width={attrs.width}
              height={attrs.height}
              rotation={attrs.rotation}
              fill="#26A69A"
              stroke="#00695C"
              strokeWidth={2}
              draggable
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
            />
            
            <Transformer 
              ref={trRef} 
              rotateEnabled={true} 
              resizeEnabled={true} 
              keepRatio={false}
              boundBoxFunc={(oldBox, newBox) => {
                // Giới hạn kích thước tối thiểu
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

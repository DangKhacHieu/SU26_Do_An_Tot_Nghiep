import { useTranslation } from 'react-i18next';
import React from 'react';
import { Stage, Layer, Group, Rect, Text } from 'react-konva';

const STATUS_COLORS = {
  'Available': '#4CAF50',
  'Rented': '#9E9E9E',
  'Maintenance': '#F44336',
};

export default function AreaDetailView({ area, onSelectStall, width = 700 }) {
  const { t } = useTranslation();

  if (!area || !area.stalls) return <div>Loading Area...</div>;

  const areaWidth = area.maxX - area.minX;
  const areaHeight = area.maxY - area.minY;

  if (!areaWidth || !areaHeight) {
    return <div>{t('areadetailview.there_is_no_coordinate')}</div>;
  }

  const scale = width / areaWidth;
  const height = areaHeight * scale;

  return (
    <div style={{ border: '1px solid #ccc', backgroundColor: '#fff', display: 'inline-block' }}>
      <Stage width={width} height={height}>
        <Layer>
          {area.stalls.map(stall => {
            const isCustomShape = stall.svgPath && stall.svgPath.length > 0;
            
            return (
              <Group
                key={stall.stallId}
                x={(stall.mapX - area.minX) * scale}
                y={(stall.mapY - area.minY) * scale}
                rotation={stall.rotation || 0}
                onClick={() => onSelectStall && onSelectStall(stall)}
                onMouseEnter={e => {
                  const container = e.target.getStage().container();
                  container.style.cursor = 'pointer';
                }}
                onMouseLeave={e => {
                  const container = e.target.getStage().container();
                  container.style.cursor = 'default';
                }}
              >
                {/* Vẽ sạp dưới dạng Hình chữ nhật mặc định nếu không có hình custom */}
                {!isCustomShape && (
                  <Rect
                    width={(stall.width || 20) * scale}
                    height={(stall.height || 20) * scale}
                    fill={STATUS_COLORS[stall.status] || '#ccc'}
                    stroke="#333"
                    strokeWidth={1}
                  />
                )}
                
                {/* TODO: Nếu có isCustomShape thì dùng Konva Line/Path để vẽ sạp ở đây */}

                {/* Tên Sạp / Mã Sạp */}
                <Text 
                  text={stall.code} 
                  fontSize={Math.max(10, 14 * scale / 2)} 
                  fill="#fff" 
                  fontStyle="bold"
                  padding={4} 
                  listening={false}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

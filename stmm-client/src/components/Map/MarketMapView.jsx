import { useTranslation } from 'react-i18next';
import React from 'react';
import { Stage, Layer, Line, Text } from 'react-konva';

const CATEGORY_COLORS = {
  1: '#FBC02D', // Ẩm thực
  2: '#8E24AA', // Thời trang
  3: '#26A69A', // Đồ gia dụng
  4: '#F06292', // Trang sức
  5: '#4CAF50', // Rau củ
  6: '#F44336', // Thực phẩm tươi sống
};

export default function MarketMapView({ market, onSelectArea, width = 900 }) {
  const { t } = useTranslation();

  if (!market || !market.areas) return <div>Loading Map...</div>;

  const marketWidth = market.maxX - market.minX;
  const marketHeight = market.maxY - market.minY;
  
  if (!marketWidth || !marketHeight) {
    return <div>{t('marketmapview.there_is_no_coordinate')}</div>;
  }

  const scale = width / marketWidth; 
  const height = marketHeight * scale;

  return (
    <div style={{ border: '1px solid #ccc', backgroundColor: '#f0f0f0', display: 'inline-block' }}>
      <Stage width={width} height={height}>
        <Layer>
          {market.areas.map(area => {
            let points = [];
            try {
              if (area.svgPath) {
                const parsed = JSON.parse(area.svgPath);
                points = parsed.flatMap(([x, y]) => [(x - market.minX) * scale, (y - market.minY) * scale]);
              }
            } catch (e) {
              console.error("Invalid svgPath for area", area.areaId, e);
            }

            if (points.length === 0 && area.minX != null && area.maxX != null) {
              points = [
                (area.minX - market.minX) * scale, (area.minY - market.minY) * scale,
                (area.maxX - market.minX) * scale, (area.minY - market.minY) * scale,
                (area.maxX - market.minX) * scale, (area.maxY - market.minY) * scale,
                (area.minX - market.minX) * scale, (area.maxY - market.minY) * scale,
              ];
            }

            return (
              <React.Fragment key={area.areaId}>
                <Line
                  points={points}
                  closed
                  fill={CATEGORY_COLORS[area.categoryId] || '#cccccc'}
                  opacity={0.6}
                  stroke="#333"
                  strokeWidth={1}
                  onClick={() => onSelectArea && onSelectArea(area)}
                  onMouseEnter={e => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'pointer';
                    e.target.opacity(0.85);
                  }}
                  onMouseLeave={e => {
                    const container = e.target.getStage().container();
                    container.style.cursor = 'default';
                    e.target.opacity(0.6);
                  }}
                />
                {area.minX != null && area.minY != null && (
                  <Text
                    text={area.name}
                    x={(area.minX - market.minX) * scale + 10}
                    y={(area.minY - market.minY) * scale + 10}
                    fontSize={14}
                    fill="#000"
                    fontStyle="bold"
                    listening={false}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

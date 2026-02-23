import React from 'react';
import type { ShapeData } from '../../types';

interface RotationZonesProps {
  shape: ShapeData;
  isSelected: boolean;
}

const RotationZones: React.FC<RotationZonesProps> = ({ shape, isSelected }) => {
  if (!isSelected || !('rotation' in shape)) return null;

  let corners: { x: number; y: number }[] = [];
  if (shape.type === 'rectangle') {
    corners = [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x, y: shape.y + shape.height },
      { x: shape.x + shape.width, y: shape.y + shape.height },
    ];
  } else if (shape.type === 'ellipse') {
    corners = [
      { x: shape.cx - shape.rx, y: shape.cy - shape.ry },
      { x: shape.cx + shape.rx, y: shape.cy - shape.ry },
      { x: shape.cx - shape.rx, y: shape.cy + shape.ry },
      { x: shape.cx + shape.rx, y: shape.cy + shape.ry },
    ];
  } else if (shape.type === 'line') {
    corners = [
      { x: shape.x1, y: shape.y1 },
      { x: shape.x2, y: shape.y2 },
    ];
  }

  return (
    <>
      {corners.map((corner, i) => (
        <circle
          key={`rot-zone-${i}`}
          cx={corner.x}
          cy={corner.y}
          r={20}
          fill="none"
          stroke="rgba(0, 160, 255, 0.2)"
          strokeWidth={20}
          style={{ pointerEvents: 'none' }}
          data-export-ignore="true"
        />
      ))}
    </>
  );
};

export default RotationZones;

import React from 'react';
import type { ShapeData } from '../../types';

interface RotationZonesProps {
  shape: ShapeData;
  isSelected: boolean;
}

/**
 * Renders the visual rotation guides at the corners/endpoints of the selected shape.
 *
 * Note: These guide rings are purely visual. They are set to `pointerEvents: 'none'`.
 * The actual mouse hit testing is calculated dynamically in `useInteractionManager.ts`
 * using the mouse coordinates relative to the shape corners.
 * - Distance between 10px and 30px from the corner triggers the rotation gesture.
 * - Distance less than 10px (the inner hole of the guide ring) triggers the resizing gesture.
 */
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
          r={20} // Radius of 20px
          fill="none"
          stroke="rgba(0, 160, 255, 0.2)" // Semitransparent blue ring
          strokeWidth={20} // Width of 20px (covering from 10px to 30px distance)
          style={{ pointerEvents: 'none' }}
          data-export-ignore="true"
        />
      ))}
    </>
  );
};

export default RotationZones;

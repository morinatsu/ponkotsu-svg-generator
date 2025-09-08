import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, onClick }) => {
  // For now, we only handle rectangles.
  // In the future, we can add a switch statement here based on shape.type
  if (shape.type === 'rectangle') {
    return (
      <rect
        key={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill="none"
        stroke={isSelected ? 'blue' : 'black'}
        strokeWidth={2}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
    );
  }

  return null; // Or render a placeholder for unknown shapes
};

export default Shape;

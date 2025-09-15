import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, onClick }) => {
  const commonProps = {
    stroke: isSelected ? 'blue' : 'black',
    strokeWidth: 2,
    onClick: onClick,
    style: { cursor: 'pointer' },
    fill: 'none', // All shapes are unfilled for now
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <rect
          key={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          {...commonProps}
        />
      );
    case 'ellipse':
      return (
        <ellipse
          key={shape.id}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          {...commonProps}
        />
      );
    case 'line':
      return (
        <line
          key={shape.id}
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          {...commonProps}
          fill={undefined} // line doesn't have a fill property
        />
      );
    default: {
      // Exhaustiveness check for discriminating union
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = shape;
      return null;
    }
  }
};

export default Shape;

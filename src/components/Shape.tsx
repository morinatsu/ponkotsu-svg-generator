import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, onClick, onDoubleClick }) => {
  const commonProps = {
    strokeWidth: 2,
    style: { cursor: 'pointer' },
  };

  // The <g> element will handle the click for selection
  const groupProps = {
    onClick: onClick,
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <g {...groupProps}>
          <rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            {...commonProps}
          />
        </g>
      );
    case 'ellipse':
      return (
        <g {...groupProps}>
          <ellipse
            key={shape.id}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            {...commonProps}
          />
        </g>
      );
    case 'line':
      return (
        <g {...groupProps}>
          <line
            key={shape.id}
            x1={shape.x1}
            y1={shape.y1}
            x2={shape.x2}
            y2={shape.y2}
            stroke={isSelected ? 'blue' : 'black'}
            {...commonProps}
          />
        </g>
      );
    case 'text': {
      const lines = shape.content.split('\n');
      const lineHeight = shape.fontSize * 1.2;
      return (
        <g {...groupProps} onDoubleClick={onDoubleClick}>
          <text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fill={isSelected ? 'blue' : shape.fill}
            stroke="none"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {lines.map((line, index) => (
              <tspan key={index} x={shape.x} dy={index === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    }
    default: {
      // Exhaustiveness check for discriminating union
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = shape;
      return null;
    }
  }
};

export default Shape;

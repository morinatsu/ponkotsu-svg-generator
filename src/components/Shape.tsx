import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isDragging: boolean; // Flag to indicate if another shape is being dragged
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, isDragging, onClick, onDoubleClick }) => {
  const commonProps = {
    strokeWidth: 2,
    // When another shape is being dragged, disable pointer events on this one.
    style: { cursor: 'grab', pointerEvents: isDragging ? 'none' : 'all' as const },
  };

  // Event handlers and data-attributes are attached directly to the hitbox element
  // or the visible element if no hitbox exists (e.g., for lines and text).
  const hitBoxProps = {
    onClick: onClick,
    'data-shape-id': shape.id,
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <g>
          {/* Visible shape, not clickable */}
          <rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={commonProps.strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
          {/* Hitbox for easier selection and interaction */}
          <rect
            {...hitBoxProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
            style={{ cursor: 'grab' }}
          />
        </g>
      );
    case 'ellipse':
      return (
        <g>
          {/* Visible shape, not clickable */}
          <ellipse
            key={shape.id}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={commonProps.strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
          {/* Hitbox for easier selection and interaction */}
          <ellipse
            {...hitBoxProps}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
            style={{ cursor: 'grab' }}
          />
        </g>
      );
    case 'line':
      return (
        <g {...hitBoxProps}>
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
        <g {...hitBoxProps} onDoubleClick={onDoubleClick}>
          <text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fill={isSelected ? 'blue' : shape.fill}
            stroke="none"
            style={{ cursor: 'grab', userSelect: 'none' }}
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

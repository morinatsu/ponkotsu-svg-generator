import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isDragging: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, isDragging, onClick, onDoubleClick }) => {
  // Common props for all shapes
  const commonProps: { strokeWidth: number; style: React.CSSProperties } = {
    strokeWidth: 2,
    style: { cursor: 'grab', pointerEvents: isDragging ? 'none' : 'all' },
  };

  // Group props: Attach event handlers and data-shape-id to the parent <g> element.
  // This ensures that drag transformations and event handling target the same element.
  const groupProps = {
    onClick: onClick,
    onDoubleClick: onDoubleClick,
    'data-shape-id': shape.id,
    style: { cursor: 'grab' },
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <g {...groupProps}>
          {/* The visible shape element. Pointer events are disabled to allow the hitbox to capture them. */}
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
          {/* An invisible, larger hitbox for easier clicking and interaction. */}
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
          />
        </g>
      );
    case 'ellipse':
      return (
        <g {...groupProps}>
          {/* The visible shape element. */}
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
          {/* An invisible, larger hitbox. */}
          <ellipse
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
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
        <g {...groupProps}>
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
      // Exhaustiveness check for the discriminating union.
      // This ensures all shape types are handled.
      // This is an exhaustiveness check for the discriminating union.
      // It ensures that all shape types are handled in the switch statement.
      // If a new shape type is added, TypeScript will throw an error here
      // unless a corresponding case is added.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = shape;
      return null;
    }
  }
};

export default Shape;
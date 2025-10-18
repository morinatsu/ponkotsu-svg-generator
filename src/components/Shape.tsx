import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isDragging: boolean; // True if ANOTHER shape is being dragged
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, isDragging, onClick, onDoubleClick }) => {
  // Event handlers and ID are attached to the parent group.
  const groupProps = {
    onClick: onClick,
    onDoubleClick: onDoubleClick,
    'data-shape-id': shape.id,
    style: { cursor: 'grab' },
  };

  // Style for the hitbox element. It should be disabled if another element is being dragged.
  const hitboxStyle: React.CSSProperties = {
    pointerEvents: isDragging ? 'none' : 'all',
    fill: 'transparent',
    stroke: 'transparent',
  };

  // The visible shape should never capture pointer events.
  const visibleShapeStyle: React.CSSProperties = { pointerEvents: 'none' };

  switch (shape.type) {
    case 'rectangle':
      return (
        <g {...groupProps}>
          <rect
            key={`${shape.id}-visible`}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={2}
            style={visibleShapeStyle}
          />
          <rect
            key={`${shape.id}-hitbox`}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            strokeWidth={10}
            style={hitboxStyle}
          />
        </g>
      );
    case 'ellipse':
      return (
        <g {...groupProps}>
          <ellipse
            key={`${shape.id}-visible`}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={2}
            style={visibleShapeStyle}
          />
          <ellipse
            key={`${shape.id}-hitbox`}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            strokeWidth={10}
            style={hitboxStyle}
          />
        </g>
      );
    case 'line':
      return (
        <g {...groupProps}>
          <line // The visible line
            key={`${shape.id}-visible`}
            x1={shape.x1}
            y1={shape.y1}
            x2={shape.x2}
            y2={shape.y2}
            stroke={isSelected ? 'blue' : 'black'}
            strokeWidth={2}
            style={visibleShapeStyle}
          />
          <line // The hitbox
            key={`${shape.id}-hitbox`}
            x1={shape.x1}
            y1={shape.y1}
            x2={shape.x2}
            y2={shape.y2}
            strokeWidth={10}
            style={hitboxStyle}
          />
        </g>
      );
    case 'text': {
      const lines = shape.content.split('\n');
      const lineHeight = shape.fontSize * 1.2;
      // Text is its own hitbox.
      const textStyle: React.CSSProperties = {
        cursor: 'grab',
        userSelect: 'none',
        pointerEvents: isDragging ? 'none' : 'all',
      };
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
            style={textStyle}
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
      const _exhaustiveCheck: never = shape;
      return null;
    }
  }
};

export default Shape;
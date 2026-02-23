import React from 'react';
import type { TextData } from '../../types';

interface TextProps {
  shape: TextData;
  isSelected: boolean;
  groupProps: React.SVGProps<SVGGElement>;
  isDragging: boolean;
  isDrawingMode: boolean;
}

const Text: React.FC<TextProps> = ({
  shape,
  isSelected,
  groupProps,
  isDragging,
  isDrawingMode,
}) => {
  const lines = shape.content.split('\n');
  const lineHeight = shape.fontSize * 1.2;
  const textStyle: React.CSSProperties = {
    cursor: 'grab',
    userSelect: 'none',
    pointerEvents: isDragging || isDrawingMode ? 'none' : 'all',
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
};

export default Text;

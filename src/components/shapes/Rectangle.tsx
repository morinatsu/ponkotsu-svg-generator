import React from 'react';
import type { RectangleData } from '../../types';
import RotationZones from './RotationZones';

interface RectangleProps {
  shape: RectangleData;
  isSelected: boolean;
  visibleShapeStyle: React.CSSProperties;
  hitboxProps: React.SVGProps<SVGRectElement>;
  groupProps: React.SVGProps<SVGGElement>;
}

const Rectangle: React.FC<RectangleProps> = ({
  shape,
  isSelected,
  visibleShapeStyle,
  hitboxProps,
  groupProps,
}) => (
  <g {...groupProps}>
    <RotationZones shape={shape} isSelected={isSelected} />
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
      {...hitboxProps}
    />
  </g>
);

export default Rectangle;

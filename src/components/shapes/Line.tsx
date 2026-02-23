import React from 'react';
import type { LineData } from '../../types';
import RotationZones from './RotationZones';

interface LineProps {
  shape: LineData;
  isSelected: boolean;
  visibleShapeStyle: React.CSSProperties;
  hitboxProps: React.SVGProps<SVGLineElement>;
  groupProps: React.SVGProps<SVGGElement>;
}

const Line: React.FC<LineProps> = ({
  shape,
  isSelected,
  visibleShapeStyle,
  hitboxProps,
  groupProps,
}) => (
  <g {...groupProps}>
    <RotationZones shape={shape} isSelected={isSelected} />
    <line
      key={`${shape.id}-visible`}
      x1={shape.x1}
      y1={shape.y1}
      x2={shape.x2}
      y2={shape.y2}
      stroke={isSelected ? 'blue' : 'black'}
      strokeWidth={2}
      style={visibleShapeStyle}
    />
    <line
      key={`${shape.id}-hitbox`}
      x1={shape.x1}
      y1={shape.y1}
      x2={shape.x2}
      y2={shape.y2}
      {...hitboxProps}
    />
  </g>
);

export default Line;

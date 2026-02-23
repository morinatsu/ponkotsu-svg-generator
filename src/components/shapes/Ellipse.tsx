import React from 'react';
import type { EllipseData } from '../../types';
import RotationZones from './RotationZones';

interface EllipseProps {
  shape: EllipseData;
  isSelected: boolean;
  visibleShapeStyle: React.CSSProperties;
  hitboxProps: React.SVGProps<SVGEllipseElement>;
  groupProps: React.SVGProps<SVGGElement>;
}

const Ellipse: React.FC<EllipseProps> = ({
  shape,
  isSelected,
  visibleShapeStyle,
  hitboxProps,
  groupProps,
}) => (
  <g {...groupProps}>
    <RotationZones shape={shape} isSelected={isSelected} />
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
      {...hitboxProps}
    />
  </g>
);

export default Ellipse;

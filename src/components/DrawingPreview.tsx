import React, { useContext } from 'react';
import { AppContext } from '../state/AppContext';

const DrawingPreview: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('DrawingPreview must be used within an AppContextProvider');
  }
  const { state } = context;
  const { drawingState, currentTool } = state;

  if (!drawingState) return null;

  const { x, y, width, height } = drawingState;
  const commonProps = {
    fill: 'none',
    stroke: 'black',
    strokeWidth: 1,
    strokeDasharray: '5,5',
  };

  switch (currentTool) {
    case 'rectangle':
      return <rect x={x} y={y} width={width} height={height} {...commonProps} />;
    case 'ellipse':
      return (
        <ellipse
          cx={x + width / 2}
          cy={y + height / 2}
          rx={width / 2}
          ry={height / 2}
          {...commonProps}
        />
      );
    case 'line':
      return <line x1={x} y1={y} x2={x + width} y2={y + height} {...commonProps} />;
    default:
      return null;
  }
};

export default DrawingPreview;

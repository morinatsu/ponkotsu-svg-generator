import React, { useContext } from 'react';
import type { ShapeData, DrawingShape } from '../state/reducer'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { AppContext } from '../state/AppContext';
import Shape from './Shape';

interface SvgCanvasProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onCanvasClick: () => void;
}

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
    case 'rectangle': {
      // Handle negative width/height for previewing rectangles drawn in any direction.
      const rectX = width < 0 ? x + width : x;
      const rectY = height < 0 ? y + height : y;
      const rectWidth = Math.abs(width);
      const rectHeight = Math.abs(height);
      return (
        <rect x={rectX} y={rectY} width={rectWidth} height={rectHeight} {...commonProps} />
      );
    }
    case 'ellipse': {
      // Handle negative radius for previewing ellipses drawn in any direction.
      const rx = Math.abs(width / 2);
      const ry = Math.abs(height / 2);
      // The center point calculation (cx, cy) remains correct even with negative width/height.
      const cx = x + width / 2;
      const cy = y + height / 2;
      return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...commonProps} />;
    }
    case 'line':
      // Line drawing is direct and doesn't need normalization for preview.
      return <line x1={x} y1={y} x2={x + width} y2={y + height} {...commonProps} />;
    default:
      return null;
  }
};

const SvgCanvas = React.forwardRef<SVGSVGElement, SvgCanvasProps>(
  (
    {
      onMouseDown,
      onCanvasClick,
    },
    ref,
  ) => {
    const context = useContext(AppContext);
    if (!context) {
      throw new Error('SvgCanvas must be used within an AppContextProvider');
    }
    const { state } = context;
    const { shapes, selectedShapeId } = state;

    const canvasStyle: React.CSSProperties = {
      border: '1px solid black',
      // The cursor is now managed by CSS based on the body's data attribute
    };

    return (
      <svg
        ref={ref}
        width={800}
        height={600}
        style={canvasStyle}
        onClick={onCanvasClick}
        onMouseDown={onMouseDown}
      >
        {shapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeId === shape.id}
            // When another shape is being dragged, prevent interaction.
            isDragging={!!selectedShapeId && selectedShapeId !== shape.id}
          />
        ))}
        <DrawingPreview />
      </svg>
    );
  },
);

export default SvgCanvas;

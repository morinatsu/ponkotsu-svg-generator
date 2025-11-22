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

const SvgCanvas = React.forwardRef<SVGSVGElement, SvgCanvasProps>(
  ({ onMouseDown, onCanvasClick }, ref) => {
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
            isDragging={
              state.mode === 'dragging' && !!selectedShapeId && selectedShapeId !== shape.id
            }
            // When drawing a new shape, prevent interaction with existing shapes.
            isDrawingMode={state.mode === 'drawing'}
          />
        ))}
        <DrawingPreview />
      </svg>
    );
  },
);

export default SvgCanvas;

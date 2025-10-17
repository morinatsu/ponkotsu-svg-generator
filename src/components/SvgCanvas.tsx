import React from 'react';
import type { ShapeData, DrawingShape, AppMode } from '../state/reducer';
import Shape from './Shape';

interface SvgCanvasProps {
  shapes: ShapeData[];
  drawingState: DrawingShape | null;
  selectedShapeId: string | null;
  currentTool: ShapeData['type'];
  onMouseDown: (e: React.MouseEvent) => void;
  onCanvasClick: () => void;
  onShapeClick: (id: string, e: React.MouseEvent) => void;
  onShapeDoubleClick: (shape: ShapeData) => void;
}

const DrawingPreview: React.FC<{
  drawingState: DrawingShape;
  currentTool: ShapeData['type'];
}> = ({ drawingState, currentTool }) => {
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
  (
    {
      shapes,
      drawingState,
      selectedShapeId,
      currentTool,
      onMouseDown,
      onCanvasClick,
      onShapeClick,
      onShapeDoubleClick,
    },
    ref
  ) => {
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
            onClick={(e) => onShapeClick(shape.id, e)}
            onDoubleClick={() => onShapeDoubleClick(shape)}
            // The onMouseDown is now handled by the main canvas handler
          />
        ))}
        {drawingState && (
          <DrawingPreview drawingState={drawingState} currentTool={currentTool} />
        )}
      </svg>
    );
  }
);

export default SvgCanvas;

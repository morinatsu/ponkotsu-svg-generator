import React from 'react';
import type { ShapeData } from '../App';
import Shape from './Shape';

interface SvgCanvasProps {
  shapes: ShapeData[];
  drawingState: ShapeData | null;
  selectedShapeId: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onCanvasClick: () => void;
  onShapeClick: (id: string, e: React.MouseEvent) => void;
}

const SvgCanvas = React.forwardRef<SVGSVGElement, SvgCanvasProps>(
  (
    {
      shapes,
      drawingState,
      selectedShapeId,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onCanvasClick,
      onShapeClick,
    },
    ref
  ) => {
    return (
      <svg
        ref={ref}
        width={800}
        height={600}
        style={{ border: '1px solid black' }}
        onClick={onCanvasClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {shapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeId === shape.id}
            onClick={(e) => onShapeClick(shape.id, e)}
          />
        ))}
        {drawingState && (
          <rect
            x={drawingState.x}
            y={drawingState.y}
            width={drawingState.width}
            height={drawingState.height}
            fill="none"
            stroke="black"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
        )}
      </svg>
    );
  }
);

export default SvgCanvas;

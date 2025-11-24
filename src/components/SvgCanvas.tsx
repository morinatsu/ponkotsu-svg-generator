import React, { useContext } from 'react';
import type { ShapeData, DrawingShape } from '../types'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { AppContext } from '../state/AppContext';
import Shape from './Shape';
import { useInteractionManager } from '../hooks/useInteractionManager';

import DrawingPreview from './DrawingPreview';

interface SvgCanvasProps {
  onShapeMouseDown: (shapeId: string, e: React.MouseEvent) => void;
}

const SvgCanvas: React.FC<SvgCanvasProps> = ({ onShapeMouseDown }) => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('SvgCanvas must be used within an AppContextProvider');
  }
  const { state, dispatch, svgRef, wasDragged } = context;
  const { shapes, selectedShapeId } = state;

  const { handleMouseDown } = useInteractionManager(dispatch, state, svgRef, wasDragged);

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_SHAPE', payload: null });
  };

  const canvasStyle: React.CSSProperties = {
    border: '1px solid black',
    // The cursor is now managed by CSS based on the body's data attribute
  };

  return (
    <svg
      ref={svgRef}
      width={800}
      height={600}
      style={canvasStyle}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
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
          onMouseDown={onShapeMouseDown}
        />
      ))}
      <DrawingPreview />
    </svg>
  );
};

export default SvgCanvas;

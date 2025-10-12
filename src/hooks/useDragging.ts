import { useEffect, useCallback } from 'react';
import type { Action, AppState, ShapeData } from '../state/reducer';

export const useDragging = (
  state: AppState,
  dispatch: React.Dispatch<Action>,
  svgRef: React.RefObject<SVGSVGElement>,
) => {
  const { mode, draggingState, shapes } = state;

  const getMousePosition = (e: MouseEvent | React.MouseEvent): { x: number, y: number } => {
    if (svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        return {
          x: (e.clientX - CTM.e) / CTM.a,
          y: (e.clientY - CTM.f) / CTM.d
        };
      }
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = (e: React.MouseEvent, shapeId: string) => {
    // Only allow dragging when in idle mode
    if (mode !== 'idle' || !svgRef.current) return;

    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    const pos = getMousePosition(e);

    let offsetX = 0;
    let offsetY = 0;

    switch (shape.type) {
        case 'rectangle':
        case 'text':
            offsetX = pos.x - shape.x;
            offsetY = pos.y - shape.y;
            break;
        case 'ellipse':
            offsetX = pos.x - shape.cx;
            offsetY = pos.y - shape.cy;
            break;
        case 'line':
            offsetX = pos.x - shape.x1;
            offsetY = pos.y - shape.y1;
            break;
    }

    dispatch({
      type: 'START_DRAGGING',
      payload: {
        shapeId,
        startX: pos.x,
        startY: pos.y,
        offsetX,
        offsetY,
      },
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (mode !== 'dragging' || !draggingState || !svgRef.current) return;

    let pos = getMousePosition(e);

    // Constrain movement within the canvas
    const svgNode = svgRef.current;
    const width = svgNode.width.baseVal.value;
    const height = svgNode.height.baseVal.value;
    const shape = shapes.find(s => s.id === draggingState.shapeId);
    if (!shape) return;

    // Calculate the bounding box of the shape being dragged
    let shapeWidth = 0;
    let shapeHeight = 0;
    switch(shape.type) {
      case 'rectangle':
        shapeWidth = shape.width;
        shapeHeight = shape.height;
        break;
      case 'ellipse':
        shapeWidth = shape.rx * 2;
        shapeHeight = shape.ry * 2;
        break;
      case 'line':
        shapeWidth = Math.abs(shape.x2 - shape.x1);
        shapeHeight = Math.abs(shape.y2 - shape.y1);
        break;
      case 'text':
        // This is an approximation. For more accuracy, we would need to measure the text.
        shapeWidth = shape.content.length * shape.fontSize * 0.6;
        shapeHeight = shape.fontSize;
        break;
    }

    const newX = pos.x - draggingState.offsetX;
    const newY = pos.y - draggingState.offsetY;

    // Constrain the new position
    const constrainedX = Math.max(0, Math.min(newX, width - shapeWidth));
    const constrainedY = Math.max(0, Math.min(newY, height - shapeHeight));

    // We need to dispatch the original mouse position, but adjusted
    // so that the constrained position is achieved.
    const adjustedMouseX = constrainedX + draggingState.offsetX;
    const adjustedMouseY = constrainedY + draggingState.offsetY;

    dispatch({ type: 'DRAG_SHAPE', payload: { x: adjustedMouseX, y: adjustedMouseY } });
  }, [mode, draggingState, dispatch, svgRef, shapes]);


  const handleMouseUp = useCallback(() => {
    if (mode === 'dragging') {
      dispatch({ type: 'STOP_DRAGGING' });
    }
  }, [mode, dispatch]);

  useEffect(() => {
    // Attach mouse move and up listeners to the window
    // to handle dragging outside the canvas
    if (mode === 'dragging') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',handleMouseUp);
    };
  }, [mode, handleMouseMove, handleMouseUp]);

  return {
    handleMouseDown,
  };
};
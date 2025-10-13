import { useRef } from 'react';
import type { Action, Tool, AppMode } from '../state/reducer';

export const useDrawing = (
  dispatch: React.Dispatch<Action>,
  svgRef: React.RefObject<SVGSVGElement>,
  currentTool: Tool,
  mode: AppMode,
) => {
  const isDrawing = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });

  const getMousePosition = (e: React.MouseEvent): { x: number, y: number } => {
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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow drawing to start when in idle mode
    if (mode !== 'idle') {
      return;
    }

    // Prevent drawing or text creation when clicking on an existing shape
    if ((e.target as SVGElement).closest('g')) {
      return;
    }

    const pos = getMousePosition(e);

    if (currentTool === 'text') {
      // For the text tool, dispatch an action to start editing text
      dispatch({
        type: 'START_TEXT_EDIT',
        payload: { id: null, x: pos.x, y: pos.y, content: '' },
      });
    } else {
      // For drawing tools, start the drawing process
      isDrawing.current = true;
      startPoint.current = pos;
      dispatch({ type: 'START_DRAWING', payload: pos });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;

    const pos = getMousePosition(e);
    dispatch({
      type: 'DRAWING',
      payload: { x: pos.x, y: pos.y, startX: startPoint.current.x, startY: startPoint.current.y },
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    dispatch({ type: 'END_DRAWING' });
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};

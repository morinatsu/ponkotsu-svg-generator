import { useRef } from 'react';
import type { Action } from '../state/reducer';

export const useDrawing = (
  dispatch: React.Dispatch<Action>,
  svgRef: React.RefObject<SVGSVGElement>
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
    if ((e.target as SVGElement).closest('rect, ellipse, line')) {
      return;
    }
    isDrawing.current = true;
    const pos = getMousePosition(e);
    startPoint.current = pos;
    dispatch({ type: 'START_DRAWING', payload: pos });
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

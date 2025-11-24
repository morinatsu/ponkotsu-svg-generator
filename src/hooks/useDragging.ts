import { useEffect, useCallback } from 'react';
import type { Action, AppState } from '../types';

export const useDragging = (
  dispatch: React.Dispatch<Action>,
  mode: AppState['mode'],
  svgRef: React.RefObject<SVGSVGElement | null>,
) => {
  // Function to handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (svgRef.current) {
        const CTM = svgRef.current.getScreenCTM();
        if (CTM) {
          const mouseX = (e.clientX - CTM.e) / CTM.a;
          const mouseY = (e.clientY - CTM.f) / CTM.d;
          dispatch({ type: 'DRAG_SHAPE', payload: { x: mouseX, y: mouseY } });
        }
      }
    },
    [dispatch, svgRef],
  );

  // Function to handle drag end
  const handleMouseUp = useCallback(() => {
    dispatch({ type: 'STOP_DRAGGING' });
  }, [dispatch]);

  // Register global event listeners only when in 'dragging' mode
  useEffect(() => {
    if (mode === 'dragging') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, handleMouseMove, handleMouseUp]);

  // Function called when mouse down on a shape
  const handleMouseDownOnShape = (shapeId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent native browser drag behavior
    if (svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const mouseX = (e.clientX - CTM.e) / CTM.a;
        const mouseY = (e.clientY - CTM.f) / CTM.d;
        dispatch({
          type: 'START_DRAGGING',
          payload: { shapeId, mouseX, mouseY },
        });
      }
    }
  };

  return { handleMouseDownOnShape };
};

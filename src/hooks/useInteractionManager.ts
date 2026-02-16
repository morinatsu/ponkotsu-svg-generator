import { useCallback, useEffect } from 'react';
import type { Action, AppState } from '../types';
import { getRotationHandleAt, getResizeHandleAt, getShapeCenter } from '../utils/geometry';

/**
 * Manages drawing and rotation interactions. Dragging is handled separately.
 */
export const useInteractionManager = (
  dispatch: React.Dispatch<Action>,
  state: AppState,
  svgRef: React.RefObject<SVGSVGElement | null>,
  wasDraggedRef: React.MutableRefObject<boolean>,
) => {
  const { mode, currentTool, drawingState, selectedShapeId } = state;

  const getMousePosition = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
      if (svgRef.current) {
        const CTM = svgRef.current.getScreenCTM();
        if (CTM) {
          return {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d,
          };
        }
      }
      return { x: 0, y: 0 };
    },
    [svgRef],
  );

  const handleIdleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'idle' || !selectedShapeId) {
        document.body.style.cursor = 'default';
        return;
      }
      const selectedShape = state.shapes.find((s) => s.id === selectedShapeId);
      if (!selectedShape) {
        document.body.style.cursor = 'default';
        return;
      }
      const pos = getMousePosition(e);

      // Check for resize handle (inner circle) - Priority 1
      const resizeHandle = getResizeHandleAt(pos, selectedShape);
      if (resizeHandle) {
        // Map handle to standard cursors
        // Ideally we would rotate the cursor, but for now we stick to standard ones
        // or simple mapping.
        if (resizeHandle === 'nw' || resizeHandle === 'se')
          document.body.style.cursor = 'nwse-resize';
        else if (resizeHandle === 'ne' || resizeHandle === 'sw')
          document.body.style.cursor = 'nesw-resize';
        else document.body.style.cursor = 'pointer'; // Fallback for start/end
        return;
      }

      // Check for rotation handle (outer ring) - Priority 2
      if (getRotationHandleAt(pos, selectedShape)) {
        document.body.style.cursor = 'alias';
      } else {
        // Find the shape group under the cursor to determine if we should show 'move'
        const shapeElement = (e.target as HTMLElement).closest('[data-shape-id]');
        if (shapeElement) {
          document.body.style.cursor = 'move';
        } else {
          document.body.style.cursor = 'default';
        }
      }
    },
    [mode, selectedShapeId, state.shapes, getMousePosition],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'idle') return;

      wasDraggedRef.current = false;

      const pos = getMousePosition(e);
      const selectedShape = state.shapes.find((s) => s.id === selectedShapeId);

      if (selectedShape) {
        // --- Start Resizing (Priority 1) ---
        const resizeHandle = getResizeHandleAt(pos, selectedShape);
        if (resizeHandle) {
          e.preventDefault();
          dispatch({
            type: 'START_RESIZING',
            payload: {
              shapeId: selectedShape.id,
              handle: resizeHandle,
              startX: pos.x,
              startY: pos.y,
              initialShape: selectedShape,
            },
          });
          return;
        }

        // --- Start Rotating (Priority 2) ---
        if (getRotationHandleAt(pos, selectedShape)) {
          e.preventDefault();
          const center = getShapeCenter(selectedShape);
          const startMouseAngle = Math.atan2(pos.y - center.y, pos.x - center.x);
          const initialShapeRotation = 'rotation' in selectedShape ? selectedShape.rotation : 0;
          dispatch({
            type: 'START_ROTATING',
            payload: {
              shapeId: selectedShape.id,
              centerX: center.x,
              centerY: center.y,
              startMouseAngle,
              initialShapeRotation,
            },
          });
          return;
        }
      }

      const shapeId = (e.target as HTMLElement)
        .closest('[data-shape-id]')
        ?.getAttribute('data-shape-id');
      // If clicking on a shape (but not a rotation handle), let the shape's own onMouseDown handle it for dragging.
      if (shapeId) {
        return;
      }

      e.preventDefault();
      // --- Start a New Drawing or Text ---
      if (currentTool === 'text') {
        dispatch({
          type: 'START_TEXT_EDIT',
          payload: { id: null, x: pos.x, y: pos.y, content: '' },
        });
      } else {
        dispatch({ type: 'START_DRAWING', payload: pos });
      }
    },
    [dispatch, getMousePosition, mode, currentTool, wasDraggedRef, state.shapes, selectedShapeId],
  );

  const handleMouseUp = useCallback(() => {
    if (mode === 'drawing') {
      dispatch({ type: 'END_DRAWING' });
    } else if (mode === 'rotating') {
      dispatch({ type: 'STOP_ROTATING' });
    } else if (mode === 'resizing') {
      dispatch({ type: 'STOP_RESIZING' });
    }

    // After a drag/rotate/draw, a click event will often fire. We need to prevent
    // that click from being handled by the shape's onClick handler.
    // The wasDraggedRef flag achieves this, but we need to reset it *after* the click
    // event has had a chance to be processed. A setTimeout queues the reset
    // to run after the current event loop finishes.
    if (wasDraggedRef.current) {
      setTimeout(() => {
        wasDraggedRef.current = false;
      }, 0);
    }
  }, [mode, dispatch, wasDraggedRef]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (e.buttons !== 1) {
        handleMouseUp();
        return;
      }
      if (mode === 'idle') return;

      const pos = getMousePosition(e);

      wasDraggedRef.current = true;

      if (mode === 'drawing' && drawingState) {
        dispatch({ type: 'DRAWING', payload: pos });
      } else if (mode === 'rotating' && state.rotatingState) {
        const { centerX, centerY, startMouseAngle, initialShapeRotation } = state.rotatingState;
        const currentMouseAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
        const deltaAngleRad = currentMouseAngle - startMouseAngle;
        const deltaAngleDeg = deltaAngleRad * (180 / Math.PI);
        let newRotation = initialShapeRotation + deltaAngleDeg;

        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        dispatch({ type: 'ROTATE_SHAPE', payload: { angle: newRotation } });
      } else if (mode === 'resizing' && state.resizingState) {
        dispatch({ type: 'RESIZE_SHAPE', payload: { x: pos.x, y: pos.y, shiftKey: e.shiftKey } });
      }
    },
    [
      getMousePosition,
      mode,
      wasDraggedRef,
      drawingState,
      handleMouseUp,
      dispatch,
      state.rotatingState,
      state.resizingState,
    ],
  );

  useEffect(() => {
    if (mode === 'idle') {
      // Use the SVG ref as the event target to avoid listening on the whole window
      const svgElement = svgRef.current;
      svgElement?.addEventListener('mousemove', handleIdleMouseMove);
      return () => {
        svgElement?.removeEventListener('mousemove', handleIdleMouseMove);
      };
    }

    // These listeners are for active drawing/rotating, so they need to be global
    if (mode === 'drawing' || mode === 'rotating' || mode === 'resizing') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, handleMouseMove, handleMouseUp, handleIdleMouseMove, svgRef]);

  return { handleMouseDown };
};

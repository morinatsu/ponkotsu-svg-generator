import { useCallback, useEffect } from 'react';
import type { Action, AppState } from '../types';
import { getRotationHandleAt, getResizeHandleAt, getShapeCenter } from '../utils/geometry';
import { updateCursorForShape } from '../utils/cursor';

/**
 * Hook to manage interactive mouse gestures such as drawing, rotating, and resizing.
 * Drag-and-drop shape moving (dragging) is managed separately by useDragging.ts.
 */
export const useInteractionManager = (
  dispatch: React.Dispatch<Action>,
  state: AppState,
  svgRef: React.RefObject<SVGSVGElement | null>,
  wasDraggedRef: React.MutableRefObject<boolean>,
) => {
  const { mode, currentTool, drawingState, selectedShapeId } = state;

  /**
   * Helper to convert screen coordinates to local SVG coordinates.
   */
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

  /**
   * Updates cursor shape dynamically based on mouse position relative to the selected shape
   * when the application is idle.
   */
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

      // Delegate cursor selection (move, resize, rotate, pointer) to utility
      updateCursorForShape(pos, selectedShape, e.target as HTMLElement);
    },
    [mode, selectedShapeId, state.shapes, getMousePosition],
  );

  /**
   * Main mouse down handler. Determines whether to start resizing, rotating,
   * dragging a shape, or drawing a new shape/text.
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'idle') return;

      wasDraggedRef.current = false;

      const pos = getMousePosition(e);
      const selectedShape = state.shapes.find((s) => s.id === selectedShapeId);

      if (selectedShape) {
        // --- Priority 1: Start Resizing ---
        // Checks if clicked close enough to a corner/endpoint handle (distance <= 10px).
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

        // --- Priority 2: Start Rotating ---
        // Checks if clicked inside the proximity rotation zone (10px < distance < 30px).
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

      // Check if clicking directly on a shape. If so, let the shape group's
      // onMouseDown handle it for drag-and-drop (delegated to useDragging).
      const shapeId = (e.target as HTMLElement)
        .closest('[data-shape-id]')
        ?.getAttribute('data-shape-id');
      if (shapeId) {
        return;
      }

      e.preventDefault();
      // --- Priority 3: Start a New Drawing or Text ---
      // If clicking blank space, trigger drawing or text input dialog.
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

  /**
   * Finishes active drawing, rotating, or resizing operations.
   */
  const handleMouseUp = useCallback(() => {
    if (mode === 'drawing') {
      dispatch({ type: 'END_DRAWING' });
    } else if (mode === 'rotating') {
      dispatch({ type: 'STOP_ROTATING' });
    } else if (mode === 'resizing') {
      dispatch({ type: 'STOP_RESIZING' });
    }

    // Reset wasDraggedRef flag asynchronously after current click events finish.
    // This prevents click handlers from interpreting drag gestures as selection clicks.
    if (wasDraggedRef.current) {
      setTimeout(() => {
        wasDraggedRef.current = false;
      }, 0);
    }
  }, [mode, dispatch, wasDraggedRef]);

  /**
   * Tracks dragging updates during active operations (drawing, rotating, resizing).
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // If primary mouse button is released outside, stop the active operation
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

        // Snapping functionality: Snap to 15 degrees increments when Shift is held
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        dispatch({ type: 'ROTATE_SHAPE', payload: { angle: newRotation } });
      } else if (mode === 'resizing' && state.resizingState) {
        // Resize updates, pass shift key state for preserving aspect ratio
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

  /**
   * Registers mouse event listeners based on current mode.
   * - Idle mode: Listen to mousemove locally on the SVG canvas to update cursor icon.
   * - Active operation mode: Listen globally on window to capture cursor movements outside the canvas.
   */
  useEffect(() => {
    if (mode === 'idle') {
      const svgElement = svgRef.current;
      svgElement?.addEventListener('mousemove', handleIdleMouseMove);
      return () => {
        svgElement?.removeEventListener('mousemove', handleIdleMouseMove);
      };
    }

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

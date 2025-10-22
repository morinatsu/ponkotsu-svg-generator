import { useCallback, useEffect, useRef } from 'react';
import type { Action, AppState } from '../state/reducer';

/**
 * A custom hook to manage all user interactions with the SVG canvas,
 * including drawing, dragging, and selecting shapes.
 * It centralizes mouse event handling to avoid conflicts between different interaction modes.
 */
export const useInteractionManager = (
  dispatch: React.Dispatch<Action>,
  state: AppState,
  svgRef: React.RefObject<SVGSVGElement | null>,
  wasDragged: React.MutableRefObject<boolean>
) => {
  const { mode, currentTool, drawingState, draggingState } = state;
  const dragTranslationRef = useRef({ dx: 0, dy: 0 });

  /**
   * Calculates the mouse position within the SVG canvas, accounting for zoom and pan.
   */
  const getMousePosition = useCallback((e: React.MouseEvent | MouseEvent): { x: number, y: number } => {
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
  }, [svgRef]);

  /**
   * Handles the mouse down event on the SVG canvas.
   * This is the entry point for all interactions.
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignore clicks if not in idle mode (e.g., during an ongoing drag)
    if (mode !== 'idle') return;

    // Reset the drag flag at the beginning of any potential interaction.
    wasDragged.current = false;
    // Reset the drag translation ref to prevent ghosting from previous drags.
    dragTranslationRef.current = { dx: 0, dy: 0 };

    const targetElement = e.target as SVGElement;
    // Check if the clicked element or its parent group has a shape ID.
    // This handles clicks on hitboxes (rect, ellipse) and text/line elements directly.
    const shapeId = targetElement.getAttribute('data-shape-id') || targetElement.closest('g[data-shape-id]')?.getAttribute('data-shape-id');
    const pos = getMousePosition(e);

    if (shapeId) {
      // --- Start Dragging an Existing Shape ---
      e.stopPropagation(); // Prevent the canvas click handler from firing
      dispatch({
          type: 'START_DRAGGING',
          payload: { shapeId, mouseX: pos.x, mouseY: pos.y },
      });
    } else {
      // --- Start a New Drawing or Text ---
      if (currentTool === 'text') {
        // Dispatch an action to create a new text element
        dispatch({
          type: 'START_TEXT_EDIT',
          payload: { id: null, x: pos.x, y: pos.y, content: '' },
        });
      } else {
        // Dispatch an action to start drawing a new shape
        dispatch({ type: 'START_DRAWING', payload: pos });
      }
    }
  }, [dispatch, getMousePosition, mode, currentTool, wasDragged]);

  /**
   * Handles the mouse up event, which is attached to the window during
   * drawing or dragging operations to signify the end of the interaction.
   */
  const handleMouseUp = useCallback(() => {
    if (mode === 'drawing') {
      dispatch({ type: 'END_DRAWING' });
    } else if (mode === 'dragging' && draggingState) {
      const elementToDrag = svgRef.current?.querySelector<SVGGraphicsElement>(`[data-shape-id="${draggingState.shapeId}"]`);
      if (elementToDrag) {
        elementToDrag.style.transform = '';
      }

      dispatch({
        type: 'STOP_DRAGGING',
        payload: dragTranslationRef.current,
      });
    }
  }, [mode, draggingState, svgRef, dispatch]);

  /**
   * Handles the mouse move event, which is attached to the window during
   * drawing or dragging operations.
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // If we're not in an active mode, there's nothing to do.
    if (mode === 'idle') return;

    // A more reliable check for a missed mouseup event.
    // If the primary mouse button is no longer pressed, end the interaction.
    if (e.buttons !== 1) {
      handleMouseUp();
      return;
    }

    const pos = getMousePosition(e);
    wasDragged.current = true; // Any mouse move during an interaction constitutes a drag.

    if (mode === 'drawing') {
      // Ensure we have the starting point from the state to calculate the shape's dimensions.
      if (drawingState?.x !== undefined && drawingState?.y !== undefined) {
        dispatch({
          type: 'DRAWING',
          payload: { x: pos.x, y: pos.y, startX: drawingState.x, startY: drawingState.y },
        });
      }
    } else if (mode === 'dragging' && draggingState) {
      const dx = pos.x - draggingState.startX;
      const dy = pos.y - draggingState.startY;
      dragTranslationRef.current = { dx, dy };

      const elementToDrag = svgRef.current?.querySelector<SVGGraphicsElement>(`[data-shape-id="${draggingState.shapeId}"]`);
      if (elementToDrag) {
        elementToDrag.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    }
  }, [getMousePosition, mode, wasDragged, drawingState, draggingState, svgRef, handleMouseUp, dispatch]);

  /**
   * This effect is the core of the interaction management.
   * It attaches and detaches global mouse move and mouse up listeners to the window.
   * This ensures that interactions (like dragging a shape) continue smoothly even if the
   * cursor leaves the bounds of the SVG canvas.
   */
  useEffect(() => {
    // We only need these listeners when an interaction is in progress.
    if (mode === 'drawing' || mode === 'dragging') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // The cleanup function is crucial to prevent memory leaks and unintended behavior.
    // It removes the listeners when the component unmounts or when the mode changes back to 'idle'.
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, handleMouseMove, handleMouseUp]);

  // Only the mouseDown handler needs to be returned, as it's the entry point
  // for all interactions and is attached directly to the SVG canvas.
  // The move and up handlers are managed internally by the useEffect.
  return { handleMouseDown };
};
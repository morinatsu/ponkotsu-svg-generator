import type { AppState, Action } from '../reducer';

export const draggingReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_DRAGGING': {
      const shape = state.shapes.find(s => s.id === action.payload.shapeId);
      if (!shape) return state;

      return {
        ...state,
        mode: 'dragging',
        drawingState: null, // Cancel any drawing in progress
        selectedShapeId: action.payload.shapeId, // Select the shape being dragged
        draggingState: {
          shapeId: action.payload.shapeId,
          startX: action.payload.mouseX,
          startY: action.payload.mouseY,
          // The offsetX/Y logic is no longer needed as we calculate the final position
          // in STOP_DRAGGING based on the total delta (dx, dy).
          offsetX: 0,
          offsetY: 0,
        },
        // shapesBeforeDrag is no longer needed because we apply a delta to the original position.
        shapesBeforeDrag: null,
      };
    }

    case 'STOP_DRAGGING': {
      if (!state.draggingState) return state;

      const { dx, dy } = action.payload;
      const { shapeId } = state.draggingState;

      // If there was no actual drag, just reset the state
      if (dx === 0 && dy === 0) {
        return {
          ...state,
          mode: 'idle',
          draggingState: null,
        };
      }

      const newShapes = state.shapes.map(shape => {
        if (shape.id !== shapeId) {
          return shape;
        }

        // Apply the final translation to the shape's coordinates
        switch (shape.type) {
          case 'rectangle':
          case 'text':
            return { ...shape, x: shape.x + dx, y: shape.y + dy };
          case 'ellipse':
            return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
          case 'line':
            return {
              ...shape,
              x1: shape.x1 + dx,
              y1: shape.y1 + dy,
              x2: shape.x2 + dx,
              y2: shape.y2 + dy,
            };
          default:
            return shape;
        }
      });

      return {
        ...state,
        mode: 'idle',
        selectedShapeId: null, // Deselect after dragging
        draggingState: null,
        shapes: newShapes,
      };
    }

    default:
      return state;
  }
};

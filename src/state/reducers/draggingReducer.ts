import type { AppState, Action } from '../../types';

export const draggingReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_DRAGGING': {
      const shape = state.shapes.find((s) => s.id === action.payload.shapeId);
      if (!shape) return state;

      let offsetX = 0;
      let offsetY = 0;

      // Calculate offset based on shape type
      if (shape.type === 'rectangle' || shape.type === 'text') {
        offsetX = action.payload.mouseX - shape.x;
        offsetY = action.payload.mouseY - shape.y;
      } else if (shape.type === 'ellipse') {
        offsetX = action.payload.mouseX - shape.cx;
        offsetY = action.payload.mouseY - shape.cy;
      } else if (shape.type === 'line') {
        // For lines, we track the offset from the start point (x1, y1)
        // But since lines have two points, we'll just track the mouse position relative to x1/y1
        // Actually, for lines, we need to move both points.
        // Let's calculate offset from x1, y1.
        offsetX = action.payload.mouseX - shape.x1;
        offsetY = action.payload.mouseY - shape.y1;
      }

      return {
        ...state,
        mode: 'dragging',
        drawingState: null,
        selectedShapeId: action.payload.shapeId,
        draggingState: {
          shapeId: action.payload.shapeId,
          startX: action.payload.mouseX,
          startY: action.payload.mouseY,
          offsetX,
          offsetY,
        },
        shapesBeforeDrag: state.shapes,
      };
    }

    case 'DRAG_SHAPE': {
      if (!state.draggingState) return state;

      const { shapeId, offsetX, offsetY } = state.draggingState;
      const { x: mouseX, y: mouseY } = action.payload;

      const newShapes = state.shapes.map((shape) => {
        if (shape.id !== shapeId) return shape;

        switch (shape.type) {
          case 'rectangle':
          case 'text':
            return { ...shape, x: mouseX - offsetX, y: mouseY - offsetY };
          case 'ellipse':
            return { ...shape, cx: mouseX - offsetX, cy: mouseY - offsetY };
          case 'line': {
            // Calculate the delta from the original position
            // We need to maintain the relative distance between x1,y1 and x2,y2
            const dx = mouseX - offsetX - shape.x1;
            const dy = mouseY - offsetY - shape.y1;
            return {
              ...shape,
              x1: shape.x1 + dx,
              y1: shape.y1 + dy,
              x2: shape.x2 + dx,
              y2: shape.y2 + dy,
            };
          }
          default:
            return shape;
        }
      });

      return {
        ...state,
        shapes: newShapes,
      };
    }

    case 'STOP_DRAGGING': {
      return {
        ...state,
        mode: 'idle',
        draggingState: null,
        shapesBeforeDrag: null,
        selectedShapeId: null, // Deselect after dragging to match previous behavior
      };
    }

    default:
      return state;
  }
};

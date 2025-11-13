import type { AppState, Action, ShapeData } from '../reducer';

export const drawingReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_DRAWING':
      return {
        ...state,
        mode: 'drawing',
        selectedShapeId: null, // Deselect any selected shape
        drawingState: {
          type: state.currentTool,
          x: action.payload.x,
          y: action.payload.y,
          width: 0,
          height: 0,
        },
      };

    case 'DRAWING': {
      if (!state.drawingState) {
        return state;
      }
      const { x, y, startX, startY } = action.payload;

      // For all shapes, we store the start point and the raw offset (delta).
      // This allows for drawing in any direction. The final coordinates will be normalized
      // in the END_DRAWING action when the shape is created.
      return {
        ...state,
        drawingState: {
          ...state.drawingState,
          x: startX,
          y: startY,
          width: x - startX,
          height: y - startY,
        },
      };
    }

    case 'END_DRAWING': {
      if (!state.drawingState) {
        return { ...state, drawingState: null, mode: 'idle' };
      }
      const { x, y, width, height } = state.drawingState;

      // Do not create a shape if the dimensions are too small
      if (width === 0 && height === 0) {
        return { ...state, drawingState: null, mode: 'idle' };
      }

      let newShape: ShapeData;
      const id = crypto.randomUUID();

      // Normalize the shape before adding it to the state.
      // This ensures that all shapes are stored with a top-left origin
      // and positive width/height, simplifying rendering and transformations.
      switch (state.currentTool) {
        case 'rectangle': {
          const finalX = width < 0 ? x + width : x;
          const finalY = height < 0 ? y + height : y;
          const finalWidth = Math.abs(width);
          const finalHeight = Math.abs(height);
          newShape = {
            id,
            type: 'rectangle',
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
          };
          break;
        }
        case 'ellipse': {
          const finalCx = x + width / 2;
          const finalCy = y + height / 2;
          const finalRx = Math.abs(width / 2);
          const finalRy = Math.abs(height / 2);
          newShape = {
            id,
            type: 'ellipse',
            cx: finalCx,
            cy: finalCy,
            rx: finalRx,
            ry: finalRy,
          };
          break;
        }
        case 'line':
          // Lines don't need normalization in the same way.
          newShape = {
            id,
            type: 'line',
            x1: x,
            y1: y,
            x2: x + width, // End coordinates are stored in width/height during drawing
            y2: y + height,
          };
          break;
        default:
          // Should not happen
          return { ...state, drawingState: null, mode: 'idle' };
      }

      return {
        ...state,
        shapes: [...state.shapes, newShape],
        drawingState: null,
        mode: 'idle',
      };
    }

    default:
      return state;
  }
};

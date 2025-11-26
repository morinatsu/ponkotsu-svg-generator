import type { AppState, Action, ShapeData } from '../../types';

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
          startX: action.payload.x,
          startY: action.payload.y,
        },
      };

    case 'DRAWING': {
      if (!state.drawingState) {
        return state;
      }
      const { x, y } = action.payload;
      const { startX, startY } = state.drawingState;

      // For lines, the start and end points are direct.
      if (state.currentTool === 'line') {
        return {
          ...state,
          drawingState: {
            ...state.drawingState,
            x: startX,
            y: startY,
            width: x - startX, // Use width/height to store end coordinates
            height: y - startY,
          },
        };
      }

      // For rectangles and ellipses, calculate top-left and dimensions.
      const newX = Math.min(x, startX);
      const newY = Math.min(y, startY);
      const newWidth = Math.abs(x - startX);
      const newHeight = Math.abs(y - startY);
      return {
        ...state,
        drawingState: {
          ...state.drawingState,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
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

      switch (state.currentTool) {
        case 'rectangle':
          newShape = { id, type: 'rectangle', x, y, width, height, rotation: 0 };
          break;
        case 'ellipse':
          newShape = {
            id,
            type: 'ellipse',
            cx: x + width / 2,
            cy: y + height / 2,
            rx: width / 2,
            ry: height / 2,
            rotation: 0,
          };
          break;
        case 'line':
          newShape = {
            id,
            type: 'line',
            x1: x,
            y1: y,
            x2: x + width, // End coordinates are stored in width/height during drawing
            y2: y + height,
            rotation: 0,
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

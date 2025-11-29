// src/state/reducers/rotatingReducer.ts
import type { AppState, Action } from '../../types';

export const rotatingReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_ROTATING': {
      const { shapeId, centerX, centerY, startMouseAngle, initialShapeRotation } = action.payload;
      return {
        ...state,
        mode: 'rotating',
        shapesBeforeRotation: state.shapes, // Save state before rotation
        rotatingState: {
          shapeId,
          centerX,
          centerY,
          startMouseAngle,
          initialShapeRotation,
        },
      };
    }
    case 'ROTATE_SHAPE': {
      if (!state.rotatingState) return state;

      const { shapeId } = state.rotatingState;
      const { angle } = action.payload;

      return {
        ...state,
        shapes: state.shapes.map((shape) => {
          if (shape.id === shapeId && 'rotation' in shape) {
            return {
              ...shape,
              rotation: angle,
            };
          }
          return shape;
        }),
      };
    }
    case 'STOP_ROTATING': {
      return {
        ...state,
        mode: 'idle',
        rotatingState: null,
        shapesBeforeRotation: null,
      };
    }
    default:
      return state;
  }
};

import { drawingReducer } from './reducers/drawingReducer';
import { draggingReducer } from './reducers/draggingReducer';
import { shapeReducer } from './reducers/shapeReducer';
import { rotatingReducer } from './reducers/rotatingReducer';
import type { AppState, Action } from '../types';

export const initialState: AppState = {
  shapes: [],
  selectedShapeId: null,
  drawingState: null,
  currentTool: 'rectangle',
  editingText: null,
  mode: 'idle',
  draggingState: null,
  shapesBeforeDrag: null,
  rotatingState: null,
};

// Root reducer that combines all sub-reducers.
export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    // Drawing actions
    case 'START_DRAWING':
    case 'DRAWING':
    case 'END_DRAWING':
      return drawingReducer(state, action);

    // Dragging actions
    case 'START_DRAGGING':
    case 'DRAG_SHAPE':
    case 'STOP_DRAGGING':
      return draggingReducer(state, action);

    // Rotating actions
    case 'START_ROTATING':
    case 'ROTATE_SHAPE':
    case 'STOP_ROTATING':
      return rotatingReducer(state, action);

    // Shape and tool actions
    case 'SELECT_TOOL':
    case 'ADD_SHAPE':
    case 'SELECT_SHAPE':
    case 'DELETE_SELECTED_SHAPE':
    case 'CLEAR_CANVAS':
    case 'START_TEXT_EDIT':
    case 'FINISH_TEXT_EDIT':
    case 'CANCEL_TEXT_EDIT':
      return shapeReducer(state, action);

    default:
      return state;
  }
};

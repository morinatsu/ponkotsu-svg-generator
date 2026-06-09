import { drawingReducer } from './reducers/drawingReducer';
import { draggingReducer } from './reducers/draggingReducer';
import { shapeReducer } from './reducers/shapeReducer';
import { rotatingReducer } from './reducers/rotatingReducer';
import { resizingReducer } from './reducers/resizingReducer';
import type { AppState, Action } from '../types';

/**
 * Initial state tree for the application.
 */
export const initialState: AppState = {
  canvasWidth: 800,
  canvasHeight: 600,
  isCanvasInitialized: false,
  shapes: [],
  selectedShapeId: null,
  drawingState: null,
  currentTool: 'rectangle',
  editingText: null,
  mode: 'idle',
  draggingState: null,
  shapesBeforeDrag: null,
  shapesBeforeRotation: null,
  rotatingState: null,
  resizingState: null,
  contextMenu: null,
};

/**
 * Root Reducer that aggregates and delegates actions to specialized sub-reducers.
 *
 * - SET_CANVAS_SIZE: Updates canvas size properties.
 * - drawingReducer: Handles START_DRAWING, DRAWING, END_DRAWING.
 * - draggingReducer: Handles START_DRAGGING, DRAG_SHAPE, STOP_DRAGGING.
 * - rotatingReducer: Handles START_ROTATING, ROTATE_SHAPE, STOP_ROTATING.
 * - resizingReducer: Handles START_RESIZING, RESIZE_SHAPE, STOP_RESIZING.
 * - shapeReducer: Handles tool/shape updates, selections, and context menu commands.
 */
export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_CANVAS_SIZE':
      return {
        ...state,
        canvasWidth: action.payload.width,
        canvasHeight: action.payload.height,
        isCanvasInitialized: true,
      };

    // Drawing actions (delegated to drawingReducer)
    case 'START_DRAWING':
    case 'DRAWING':
    case 'END_DRAWING':
      return drawingReducer(state, action);

    // Dragging actions (delegated to draggingReducer)
    case 'START_DRAGGING':
    case 'DRAG_SHAPE':
    case 'STOP_DRAGGING':
      return draggingReducer(state, action);

    // Rotating actions (delegated to rotatingReducer)
    case 'START_ROTATING':
    case 'ROTATE_SHAPE':
    case 'STOP_ROTATING':
      return rotatingReducer(state, action);

    // Resizing actions (delegated to resizingReducer)
    case 'START_RESIZING':
    case 'RESIZE_SHAPE':
    case 'STOP_RESIZING':
      return resizingReducer(state, action);

    // Shape, tool, context menu, and Z-Index actions (delegated to shapeReducer)
    case 'SELECT_TOOL':
    case 'ADD_SHAPE':
    case 'SELECT_SHAPE':
    case 'DELETE_SELECTED_SHAPE':
    case 'CLEAR_CANVAS':
    case 'START_TEXT_EDIT':
    case 'FINISH_TEXT_EDIT':
    case 'CANCEL_TEXT_EDIT':
    case 'SHOW_CONTEXT_MENU':
    case 'HIDE_CONTEXT_MENU':
    case 'MOVE_TO_FRONT':
    case 'MOVE_TO_BACK':
    case 'UPDATE_SELECTED_SHAPE_STROKE':
      return shapeReducer(state, action);

    default:
      return state;
  }
};

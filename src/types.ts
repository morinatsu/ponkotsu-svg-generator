import type { ResizeHandle } from './utils/geometry';

export interface RectangleData {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  stroke?: string;
}

export interface EllipseData {
  id: string;
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  stroke?: string;
}

export interface LineData {
  id: string;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rotation: number;
  stroke?: string;
}

export interface TextData {
  id: string;
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontSize: number;
  fill: string;
  fontFamily: string;
  stroke?: string;
}

export type ShapeData = RectangleData | EllipseData | LineData | TextData;

// A temporary type for drawing state.
// It holds the attributes for the shape being drawn, which might be incomplete.
export type DrawingShape = {
  type: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  id?: string;
};

export type Tool = ShapeData['type'];
export type AppMode = 'idle' | 'drawing' | 'dragging' | 'rotating' | 'resizing';

export interface AppState {
  canvasWidth: number;
  canvasHeight: number;
  isCanvasInitialized: boolean;
  shapes: ShapeData[];
  selectedShapeId: string | null;
  drawingState: DrawingShape | null; // Use a generic rectangle for drawing preview
  currentTool: Tool;
  editingText: { id: string | null; content: string; x: number; y: number } | null;
  mode: AppMode;
  draggingState: {
    shapeId: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null;
  shapesBeforeDrag: ShapeData[] | null;
  shapesBeforeRotation: ShapeData[] | null;
  shapesBeforeResize: ShapeData[] | null;
  rotatingState: {
    shapeId: string;
    centerX: number;
    centerY: number;
    startMouseAngle: number;
    initialShapeRotation: number;
  } | null;
  resizingState: {
    shapeId: string;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initialShape: ShapeData;
  } | null;
  contextMenu: {
    x: number;
    y: number;
    shapeId: string;
  } | null;
}

// Actions that can be dispatched
export type Action =
  // Canvas actions
  | { type: 'SET_CANVAS_SIZE'; payload: { width: number; height: number } }
  // Drawing actions
  | { type: 'START_DRAWING'; payload: { x: number; y: number } }
  | { type: 'DRAWING'; payload: { x: number; y: number } }
  | { type: 'END_DRAWING' }
  // Dragging actions
  | { type: 'START_DRAGGING'; payload: { shapeId: string; mouseX: number; mouseY: number } }
  | { type: 'DRAG_SHAPE'; payload: { x: number; y: number } }
  | { type: 'STOP_DRAGGING' }
  // Rotating actions
  | {
      type: 'START_ROTATING';
      payload: {
        shapeId: string;
        centerX: number;
        centerY: number;
        startMouseAngle: number;
        initialShapeRotation: number;
      };
    }
  | { type: 'ROTATE_SHAPE'; payload: { angle: number } }
  | { type: 'STOP_ROTATING' }
  // Resizing actions
  | {
      type: 'START_RESIZING';
      payload: {
        shapeId: string;
        handle: ResizeHandle;
        startX: number;
        startY: number;
        initialShape: ShapeData;
      };
    }
  | { type: 'RESIZE_SHAPE'; payload: { x: number; y: number; shiftKey: boolean } }
  | { type: 'STOP_RESIZING' }
  // Shape actions
  | { type: 'ADD_SHAPE'; payload: ShapeData }
  | { type: 'SELECT_SHAPE'; payload: string | null }
  | { type: 'DELETE_SELECTED_SHAPE' }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'SELECT_TOOL'; payload: Tool }
  // Text-related actions
  | {
      type: 'START_TEXT_EDIT';
      payload: { id: string | null; x: number; y: number; content: string };
    }
  | { type: 'FINISH_TEXT_EDIT'; payload: { content: string } }
  | { type: 'CANCEL_TEXT_EDIT' }
  // Context menu and Z-order actions
  | { type: 'SHOW_CONTEXT_MENU'; payload: { x: number; y: number; shapeId: string } }
  | { type: 'HIDE_CONTEXT_MENU' }
  | { type: 'MOVE_TO_FRONT'; payload: string }
  | { type: 'MOVE_TO_BACK'; payload: string }
  | { type: 'UPDATE_SELECTED_SHAPE_STROKE'; payload: string };

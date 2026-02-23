import { describe, it, expect } from 'vitest';
import { draggingReducer } from './draggingReducer';
import type { AppState, Action, RectangleData, EllipseData, LineData } from '../../types';

describe('draggingReducer', () => {
  const rect: RectangleData = {
    id: 'rect1',
    type: 'rectangle',
    x: 10,
    y: 10,
    width: 20,
    height: 20,
    rotation: 0,
  };

  const ellipse: EllipseData = {
    id: 'ell1',
    type: 'ellipse',
    cx: 50,
    cy: 50,
    rx: 20,
    ry: 10,
    rotation: 0,
  };

  const line: LineData = {
    id: 'line1',
    type: 'line',
    x1: 100,
    y1: 100,
    x2: 200,
    y2: 200,
    rotation: 0,
  };

  const initialState: AppState = {
    shapes: [rect, ellipse, line],
    mode: 'idle',
    currentTool: 'rectangle',
    selectedShapeId: null,
    drawingState: null,
    draggingState: null,
    resizingState: null,
    rotatingState: null,
    editingText: null,
    shapesBeforeDrag: null,
    shapesBeforeRotation: null,
    isCanvasInitialized: true,
    canvasWidth: 800,
    canvasHeight: 600,
  };

  describe('START_DRAGGING', () => {
    it('sets up dragging state and calculates offset for rectangle', () => {
      const action: Action = {
        type: 'START_DRAGGING',
        payload: { shapeId: 'rect1', mouseX: 15, mouseY: 15 },
      };
      const newState = draggingReducer(initialState, action);

      expect(newState.mode).toBe('dragging');
      expect(newState.selectedShapeId).toBe('rect1');
      expect(newState.draggingState).toEqual({
        shapeId: 'rect1',
        startX: 15,
        startY: 15,
        offsetX: 5, // 15 - 10
        offsetY: 5, // 15 - 10
      });
      expect(newState.shapesBeforeDrag).toEqual(initialState.shapes);
    });

    it('sets up dragging state and calculates offset for ellipse', () => {
      const action: Action = {
        type: 'START_DRAGGING',
        payload: { shapeId: 'ell1', mouseX: 55, mouseY: 55 },
      };
      const newState = draggingReducer(initialState, action);

      expect(newState.mode).toBe('dragging');
      expect(newState.draggingState?.offsetX).toBe(5); // 55 - 50
      expect(newState.draggingState?.offsetY).toBe(5); // 55 - 50
    });

    it('sets up dragging state and calculates offset for line', () => {
      const action: Action = {
        type: 'START_DRAGGING',
        payload: { shapeId: 'line1', mouseX: 110, mouseY: 120 },
      };
      const newState = draggingReducer(initialState, action);

      expect(newState.mode).toBe('dragging');
      expect(newState.draggingState?.offsetX).toBe(10); // 110 - 100(x1)
      expect(newState.draggingState?.offsetY).toBe(20); // 120 - 100(y1)
    });

    it('returns current state if shape is not found', () => {
      const action: Action = {
        type: 'START_DRAGGING',
        payload: { shapeId: 'non-existent', mouseX: 0, mouseY: 0 },
      };
      const newState = draggingReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });

  describe('DRAG_SHAPE', () => {
    it('returns state unchanged if draggingState is null', () => {
      const action: Action = { type: 'DRAG_SHAPE', payload: { x: 50, y: 50 } };
      const newState = draggingReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('drags an ellipse', () => {
      const stateWithDragging: AppState = {
        ...initialState,
        mode: 'dragging',
        draggingState: {
          shapeId: 'ell1',
          startX: 55,
          startY: 55,
          offsetX: 5,
          offsetY: 5,
        },
      };

      const action: Action = { type: 'DRAG_SHAPE', payload: { x: 105, y: 105 } };
      const newState = draggingReducer(stateWithDragging, action);

      const movedEllipse = newState.shapes.find((s) => s.id === 'ell1') as EllipseData;
      expect(movedEllipse.cx).toBe(100); // 105 - 5
      expect(movedEllipse.cy).toBe(100); // 105 - 5
    });

    it('drags a line', () => {
      const stateWithDragging: AppState = {
        ...initialState,
        mode: 'dragging',
        draggingState: {
          shapeId: 'line1',
          startX: 110,
          startY: 120,
          offsetX: 10,
          offsetY: 20,
        },
      };

      const action: Action = { type: 'DRAG_SHAPE', payload: { x: 210, y: 320 } };
      const newState = draggingReducer(stateWithDragging, action);

      const movedLine = newState.shapes.find((s) => s.id === 'line1') as LineData;
      // dx = mouseX - offsetX - x1 = 210 - 10 - 100 = 100
      // dy = mouseY - offsetY - y1 = 320 - 20 - 100 = 200
      // Expected new points:
      // x1 = 100 + 100 = 200
      // y1 = 100 + 200 = 300
      // x2 = 200 + 100 = 300
      // y2 = 200 + 200 = 400
      expect(movedLine.x1).toBe(200);
      expect(movedLine.y1).toBe(300);
      expect(movedLine.x2).toBe(300);
      expect(movedLine.y2).toBe(400);
    });

    it('ignores unknown shape types', () => {
      // Though TypeScript prevents this usually, testing fallback coverage.
      // @ts-expect-error Testing runtime fallback explicitly
      const weirdShape: ShapeData = { id: 'weird1', type: 'unknown_type' };
      const weirdState: AppState = {
        ...initialState,
        shapes: [weirdShape],
        mode: 'dragging',
        draggingState: {
          shapeId: 'weird1',
          startX: 0,
          startY: 0,
          offsetX: 0,
          offsetY: 0,
        },
      };

      const action: Action = { type: 'DRAG_SHAPE', payload: { x: 100, y: 100 } };
      const newState = draggingReducer(weirdState, action);
      expect(newState.shapes[0]).toEqual(weirdShape);
    });
  });

  describe('STOP_DRAGGING', () => {
    it('resets dragging state and mode', () => {
      const stateWithDragging: AppState = {
        ...initialState,
        mode: 'dragging',
        selectedShapeId: 'rect1',
        shapesBeforeDrag: initialState.shapes,
        draggingState: {
          shapeId: 'rect1',
          startX: 15,
          startY: 15,
          offsetX: 5,
          offsetY: 5,
        },
      };

      const action: Action = { type: 'STOP_DRAGGING' };
      const newState = draggingReducer(stateWithDragging, action);

      expect(newState.mode).toBe('idle');
      expect(newState.draggingState).toBeNull();
      expect(newState.shapesBeforeDrag).toBeNull();
      expect(newState.selectedShapeId).toBeNull();
    });
  });

  describe('default case', () => {
    it('returns current state for unhandled actions', () => {
      const action = { type: 'UNKNOWN_ACTION' } as unknown as Action;
      const newState = draggingReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });
});

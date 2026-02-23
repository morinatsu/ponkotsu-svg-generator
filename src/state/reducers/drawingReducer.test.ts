import { describe, it, expect } from 'vitest';
import { drawingReducer } from './drawingReducer';
import type { AppState, Action, RectangleData, EllipseData, LineData } from '../../types';

describe('drawingReducer', () => {
  const initialState: AppState = {
    canvasWidth: 800,
    canvasHeight: 600,
    isCanvasInitialized: true,
    shapes: [],
    selectedShapeId: 'some-shape-id', // Selection should be cleared on DRAW
    drawingState: null,
    currentTool: 'rectangle', // Starting with rectangle
    editingText: null,
    mode: 'idle',
    draggingState: null,
    shapesBeforeDrag: null,
    shapesBeforeRotation: null,
    rotatingState: null,
    resizingState: null,
  };

  describe('START_DRAWING', () => {
    it('should initialize drawing state for rectangle and clear selection', () => {
      const action: Action = { type: 'START_DRAWING', payload: { x: 10, y: 20 } };
      const newState = drawingReducer(initialState, action);

      expect(newState.mode).toBe('drawing');
      expect(newState.selectedShapeId).toBeNull();
      expect(newState.drawingState).toEqual({
        type: 'rectangle',
        x: 10,
        y: 20,
        width: 0,
        height: 0,
        startX: 10,
        startY: 20,
      });
    });

    it('should initialize drawing state for line', () => {
      const state = { ...initialState, currentTool: 'line' as const };
      const action: Action = { type: 'START_DRAWING', payload: { x: 50, y: 50 } };
      const newState = drawingReducer(state, action);

      expect(newState.drawingState).toEqual({
        type: 'line',
        x: 50,
        y: 50,
        width: 0,
        height: 0,
        startX: 50,
        startY: 50,
      });
    });
  });

  describe('DRAWING', () => {
    it('should return untouched state if drawingState is null', () => {
      const action: Action = { type: 'DRAWING', payload: { x: 100, y: 100 } };
      const newState = drawingReducer(initialState, action);
      expect(newState).toBe(initialState);
    });

    it('should update drawing boundaries for a line (coordinates raw)', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        currentTool: 'line',
        drawingState: {
          type: 'line',
          x: 50,
          y: 50,
          width: 0,
          height: 0,
          startX: 50,
          startY: 50,
        },
      };
      const action: Action = { type: 'DRAWING', payload: { x: 10, y: 150 } };
      const newState = drawingReducer(state, action);

      // For lines, x/y remain startX/startY, width/height hold deltas.
      expect(newState.drawingState).toEqual({
        type: 'line',
        x: 50,
        y: 50,
        width: -40, // 10 - 50
        height: 100, // 150 - 50
        startX: 50,
        startY: 50,
      });
    });

    it('should update drawing boundaries for shapes (rectangles/ellipses) with min/max normalization', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        currentTool: 'rectangle', // Also applies for ellipses
        drawingState: {
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 0,
          height: 0,
          startX: 100,
          startY: 100,
        },
      };

      // Draw backwards (up and left)
      const action: Action = { type: 'DRAWING', payload: { x: 50, y: 20 } };
      const newState = drawingReducer(state, action);

      expect(newState.drawingState).toEqual({
        type: 'rectangle',
        x: 50, // min(50, 100)
        y: 20, // min(20, 100)
        width: 50, // abs(50 - 100)
        height: 80, // abs(20 - 100)
        startX: 100,
        startY: 100,
      });
    });
  });

  describe('END_DRAWING', () => {
    it('should return untouched shapes and idle mode if drawingState is null (Line 61)', () => {
      const action: Action = { type: 'END_DRAWING' };
      const newState = drawingReducer(initialState, action);
      expect(newState.shapes.length).toBe(0);
      expect(newState.mode).toBe('idle');
    });

    it('should not add a shape if width and height are 0 (Line 66-67)', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        drawingState: {
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 0,
          height: 0,
          startX: 100,
          startY: 100,
        },
      };
      const action: Action = { type: 'END_DRAWING' };
      const newState = drawingReducer(state, action);
      expect(newState.shapes).toHaveLength(0);
      expect(newState.mode).toBe('idle');
      expect(newState.drawingState).toBeNull();
    });

    it('should finalize a rectangle shape', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        currentTool: 'rectangle',
        drawingState: {
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 200,
          startX: 50,
          startY: 50,
        },
      };
      const action: Action = { type: 'END_DRAWING' };
      const newState = drawingReducer(state, action);

      expect(newState.shapes).toHaveLength(1);
      const rect = newState.shapes[0] as RectangleData;
      expect(rect.type).toBe('rectangle');
      expect(rect.x).toBe(50);
      expect(rect.y).toBe(50);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(200);
      expect(rect.rotation).toBe(0);
      expect(rect.id).toBeTypeOf('string');

      expect(newState.drawingState).toBeNull();
      expect(newState.mode).toBe('idle');
    });

    it('should finalize an ellipse shape', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        currentTool: 'ellipse',
        drawingState: {
          type: 'ellipse',
          x: 100,
          y: 100,
          width: 100,
          height: 50,
          startX: 100,
          startY: 100,
        },
      };
      const action: Action = { type: 'END_DRAWING' };
      const newState = drawingReducer(state, action);

      expect(newState.shapes).toHaveLength(1);
      const ellipse = newState.shapes[0] as EllipseData;
      expect(ellipse.type).toBe('ellipse');
      expect(ellipse.cx).toBe(150); // 100 + 100/2
      expect(ellipse.cy).toBe(125); // 100 + 50/2
      expect(ellipse.rx).toBe(50);
      expect(ellipse.ry).toBe(25);
      expect(ellipse.rotation).toBe(0);
    });

    it('should finalize a line shape', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        currentTool: 'line',
        drawingState: {
          type: 'line',
          x: 50,
          y: 50, // This is startX/startY for line logic
          width: -20, // endX delta
          height: -30, // endY delta
          startX: 50,
          startY: 50,
        },
      };
      const action: Action = { type: 'END_DRAWING' };
      const newState = drawingReducer(state, action);

      expect(newState.shapes).toHaveLength(1);
      const line = newState.shapes[0] as LineData;
      expect(line.type).toBe('line');
      expect(line.x1).toBe(50);
      expect(line.y1).toBe(50);
      expect(line.x2).toBe(30); // 50 + (-20)
      expect(line.y2).toBe(20); // 50 + (-30)
      expect(line.rotation).toBe(0);
    });

    it('should abort adding shape for unknown tools (Line 101)', () => {
      const state: AppState = {
        ...initialState,
        mode: 'drawing',
        // @ts-expect-error Testing runtime fallback explicitly
        currentTool: 'unknown_tool', // Unsupported tool
        drawingState: {
          // @ts-expect-error Testing runtime invalid tool explicitly
          type: 'unknown_tool',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          startX: 0,
          startY: 0,
        },
      };
      const action: Action = { type: 'END_DRAWING' };
      const newState = drawingReducer(state, action);

      expect(newState.shapes).toHaveLength(0);
      expect(newState.mode).toBe('idle');
      expect(newState.drawingState).toBeNull();
    });
  });

  describe('Default Case', () => {
    it('should return initial state for unhandled actions (Line 113)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const action: Action = { type: 'UNKNOWN_ACTION' } as any;
      const newState = drawingReducer(initialState, action);
      expect(newState).toBe(initialState);
    });
  });
});

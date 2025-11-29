import { describe, it, expect, vi } from 'vitest';
import { reducer, initialState } from './reducer';
import type { ShapeData, AppState } from '../types';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-uuid',
});

describe('reducer', () => {
  it('should return the initial state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(reducer(initialState, { type: 'UNKNOWN' } as any)).toEqual(initialState);
  });

  it('SET_CANVAS_SIZE: should update canvas dimensions and initialization flag', () => {
    const action = {
      type: 'SET_CANVAS_SIZE' as const,
      payload: { width: 1024, height: 768 },
    };
    const newState = reducer(initialState, action);
    expect(newState.canvasWidth).toBe(1024);
    expect(newState.canvasHeight).toBe(768);
    expect(newState.isCanvasInitialized).toBe(true);
  });

  it('SELECT_TOOL: should change the current tool', () => {
    const action = { type: 'SELECT_TOOL' as const, payload: 'ellipse' as const };
    const newState = reducer(initialState, action);
    expect(newState.currentTool).toBe('ellipse');
  });

  describe('Drawing Actions', () => {
    const startPoint = { x: 10, y: 20 };
    const endPoint = { x: 60, y: 80 };

    it.each([
      { tool: 'rectangle' as const },
      { tool: 'ellipse' as const },
      { tool: 'line' as const },
    ])('START_DRAWING: should start drawing with the current tool ($tool)', ({ tool }) => {
      const stateWithTool: AppState = { ...initialState, currentTool: tool };
      const action = { type: 'START_DRAWING' as const, payload: startPoint };
      const newState = reducer(stateWithTool, action);
      expect(newState.drawingState).toEqual({
        type: tool,
        x: startPoint.x,
        y: startPoint.y,
        width: 0,
        height: 0,
        startX: startPoint.x,
        startY: startPoint.y,
      });
      expect(newState.selectedShapeId).toBeNull();
    });

    it('DRAWING: should update the dimensions of the drawing shape (for rectangle/ellipse)', () => {
      const startState: AppState = {
        ...initialState,
        currentTool: 'rectangle',
        drawingState: {
          type: 'rectangle',
          x: startPoint.x,
          y: startPoint.y,
          width: 0,
          height: 0,
          startX: startPoint.x,
          startY: startPoint.y,
        },
      };
      const action = {
        type: 'DRAWING' as const,
        payload: { x: endPoint.x, y: endPoint.y, startX: startPoint.x, startY: startPoint.y },
      };
      const newState = reducer(startState, action);
      expect(newState.drawingState).toEqual({
        type: 'rectangle',
        x: 10,
        y: 20,
        width: 50,
        height: 60,
        startX: 10,
        startY: 20,
      });
    });

    it('DRAWING: should update the end-points of the drawing shape (for line)', () => {
      const startState: AppState = {
        ...initialState,
        currentTool: 'line',
        drawingState: {
          type: 'line',
          x: startPoint.x,
          y: startPoint.y,
          width: 0,
          height: 0,
          startX: startPoint.x,
          startY: startPoint.y,
        },
      };
      const action = {
        type: 'DRAWING' as const,
        payload: { x: endPoint.x, y: endPoint.y, startX: startPoint.x, startY: startPoint.y },
      };
      const newState = reducer(startState, action);
      expect(newState.drawingState).toEqual({
        type: 'line',
        x: startPoint.x,
        y: startPoint.y,
        width: endPoint.x - startPoint.x,
        height: endPoint.y - startPoint.y,
        startX: startPoint.x,
        startY: startPoint.y,
      });
    });

    it('END_DRAWING: should add a new rectangle to shapes', () => {
      const drawingState: AppState = {
        ...initialState,
        currentTool: 'rectangle',
        drawingState: {
          type: 'rectangle',
          x: 10,
          y: 20,
          width: 50,
          height: 60,
          startX: 10,
          startY: 20,
        },
      };
      const action = { type: 'END_DRAWING' as const };
      const newState = reducer(drawingState, action);

      expect(newState.shapes).toHaveLength(1);
      expect(newState.shapes[0]).toEqual({
        id: 'mock-uuid',
        type: 'rectangle',
        x: 10,
        y: 20,
        width: 50,
        height: 60,
        rotation: 0,
      });
      expect(newState.drawingState).toBeNull();
    });

    it('END_DRAWING: should add a new ellipse to shapes', () => {
      const drawingState: AppState = {
        ...initialState,
        currentTool: 'ellipse',
        drawingState: {
          type: 'ellipse',
          x: 10,
          y: 20,
          width: 50,
          height: 60,
          startX: 10,
          startY: 20,
        },
      };
      const action = { type: 'END_DRAWING' as const };
      const newState = reducer(drawingState, action);

      expect(newState.shapes).toHaveLength(1);
      expect(newState.shapes[0]).toEqual({
        id: 'mock-uuid',
        type: 'ellipse',
        cx: 35, // 10 + 50/2
        cy: 50, // 20 + 60/2
        rx: 25, // 50/2
        ry: 30, // 60/2
        rotation: 0,
      });
      expect(newState.drawingState).toBeNull();
    });

    it('END_DRAWING: should add a new line to shapes', () => {
      const drawingState: AppState = {
        ...initialState,
        currentTool: 'line',
        drawingState: { type: 'line', x: 10, y: 20, width: 50, height: 60, startX: 10, startY: 20 }, // width/height store the deltas
      };
      const action = { type: 'END_DRAWING' as const };
      const newState = reducer(drawingState, action);

      expect(newState.shapes).toHaveLength(1);
      expect(newState.shapes[0]).toEqual({
        id: 'mock-uuid',
        type: 'line',
        x1: 10,
        y1: 20,
        x2: 60, // 10 + 50
        y2: 80, // 20 + 60
        rotation: 0,
      });
      expect(newState.drawingState).toBeNull();
    });

    it('END_DRAWING: should not add a shape if dimensions are zero', () => {
      const drawingState: AppState = {
        ...initialState,
        drawingState: {
          type: 'rectangle',
          x: 10,
          y: 20,
          width: 0,
          height: 0,
          startX: 10,
          startY: 20,
        },
      };
      const action = { type: 'END_DRAWING' as const };
      const newState = reducer(drawingState, action);
      expect(newState.shapes).toHaveLength(0);
    });
  });

  it('ADD_SHAPE: should add a new shape to the shapes array', () => {
    const newShape: ShapeData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      rotation: 0,
    };
    const action = { type: 'ADD_SHAPE' as const, payload: newShape };
    const newState = reducer(initialState, action);

    expect(newState.shapes).toHaveLength(1);
    expect(newState.shapes[0]).toEqual(newShape);
  });

  it('DELETE_SELECTED_SHAPE: should delete the selected shape', () => {
    const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50, rotation: 0 };
    const shape2: ShapeData = { id: '2', type: 'rectangle', x: 20, y: 20, width: 60, height: 60, rotation: 0 };
    const currentState: AppState = {
      ...initialState,
      shapes: [shape1, shape2],
      selectedShapeId: '1',
    };
    const action = { type: 'DELETE_SELECTED_SHAPE' as const };
    const newState = reducer(currentState, action);

    expect(newState.shapes).toHaveLength(1);
    expect(newState.shapes[0].id).toBe('2');
    expect(newState.selectedShapeId).toBeNull();
  });

  it('DELETE_SELECTED_SHAPE: should do nothing if no shape is selected', () => {
    const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50, rotation: 0 };
    const currentState: AppState = {
      ...initialState,
      shapes: [shape1],
      selectedShapeId: null,
    };
    const action = { type: 'DELETE_SELECTED_SHAPE' as const };
    const newState = reducer(currentState, action);

    expect(newState.shapes).toHaveLength(1);
    expect(newState).toEqual(currentState);
  });

  it('CLEAR_CANVAS: should remove all shapes and reset selection', () => {
    const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50, rotation: 0 };
    const currentState: AppState = {
      ...initialState,
      shapes: [shape1],
      selectedShapeId: '1',
    };
    const action = { type: 'CLEAR_CANVAS' as const };
    const newState = reducer(currentState, action);

    expect(newState.shapes).toHaveLength(0);
    expect(newState.selectedShapeId).toBeNull();
  });

  it('SELECT_SHAPE: should set the selectedShapeId', () => {
    const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50, rotation: 0 };
    const currentState: AppState = {
      ...initialState,
      shapes: [shape1],
      selectedShapeId: null,
    };
    const action = { type: 'SELECT_SHAPE' as const, payload: '1' };
    const newState = reducer(currentState, action);

    expect(newState.selectedShapeId).toBe('1');
  });

  it('SELECT_SHAPE: should deselect by passing null', () => {
    const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50, rotation: 0 };
    const currentState: AppState = {
      ...initialState,
      shapes: [shape1],
      selectedShapeId: '1',
    };
    const action = { type: 'SELECT_SHAPE' as const, payload: null };
    const newState = reducer(currentState, action);

    expect(newState.selectedShapeId).toBeNull();
  });
});

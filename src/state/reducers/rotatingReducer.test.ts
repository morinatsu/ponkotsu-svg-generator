import { describe, it, expect } from 'vitest';
import { rotatingReducer } from './rotatingReducer';
import type { AppState, Action, RectangleData, TextData } from '../../types';

describe('rotatingReducer', () => {
  const rect: RectangleData = {
    id: 'rect1',
    type: 'rectangle',
    x: 10,
    y: 10,
    width: 20,
    height: 20,
    rotation: 0,
  };

  const text: TextData = {
    id: 'text1',
    type: 'text',
    x: 50,
    y: 50,
    content: 'Hello',
    fontSize: 16,
    fontFamily: 'Arial',
  };

  const initialState: AppState = {
    shapes: [rect, text],
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

  it('should start rotating and save shapes before rotation', () => {
    const action: Action = {
      type: 'START_ROTATING',
      payload: {
        shapeId: 'rect1',
        centerX: 20,
        centerY: 20,
        startMouseAngle: 45,
        initialShapeRotation: 0,
      },
    };

    const newState = rotatingReducer(initialState, action);

    expect(newState.mode).toBe('rotating');
    expect(newState.shapesBeforeRotation).toEqual(initialState.shapes);
    expect(newState.rotatingState).toEqual({
      shapeId: 'rect1',
      centerX: 20,
      centerY: 20,
      startMouseAngle: 45,
      initialShapeRotation: 0,
    });
  });

  it('should not rotate if rotatingState is missing', () => {
    const action: Action = { type: 'ROTATE_SHAPE', payload: { angle: 90 } };
    const newState = rotatingReducer(initialState, action);
    expect(newState).toBe(initialState);
  });

  it('should update shape rotation correctly', () => {
    const state: AppState = {
      ...initialState,
      mode: 'rotating',
      rotatingState: {
        shapeId: 'rect1',
        centerX: 20,
        centerY: 20,
        startMouseAngle: 0,
        initialShapeRotation: 0,
      },
    };

    const action: Action = { type: 'ROTATE_SHAPE', payload: { angle: 90 } };
    const newState = rotatingReducer(state, action);

    const rotatedRect = newState.shapes.find((s) => s.id === 'rect1') as RectangleData;
    expect(rotatedRect.rotation).toBe(90);

    // Other shapes remain untouched
    expect(newState.shapes[1]).toEqual(text);
  });

  it('should not change shapes that do not support rotation', () => {
    const state: AppState = {
      ...initialState,
      mode: 'rotating',
      rotatingState: {
        shapeId: 'text1', // Shape that has no 'rotation' property
        centerX: 20,
        centerY: 20,
        startMouseAngle: 0,
        initialShapeRotation: 0,
      },
    };

    const action: Action = { type: 'ROTATE_SHAPE', payload: { angle: 90 } };
    const newState = rotatingReducer(state, action);

    // Text shape has no rotation property, so it should be untouched
    // (Line 36 branch: if shape.id === shapeId BUT !('rotation' in shape))
    expect(newState.shapes[1]).toEqual(text);
  });

  it('should stop rotating and clear states', () => {
    const state: AppState = {
      ...initialState,
      mode: 'rotating',
      rotatingState: {
        shapeId: 'rect1',
        centerX: 20,
        centerY: 20,
        startMouseAngle: 0,
        initialShapeRotation: 0,
      },
      shapesBeforeRotation: initialState.shapes,
    };

    const action: Action = { type: 'STOP_ROTATING' };
    const newState = rotatingReducer(state, action);

    expect(newState.mode).toBe('idle');
    expect(newState.rotatingState).toBeNull();
    expect(newState.shapesBeforeRotation).toBeNull();
  });

  it('should return initial state for unknown actions (Line 49)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: Action = { type: 'UNKNOWN_ACTION' } as any;
    const newState = rotatingReducer(initialState, action);

    expect(newState).toBe(initialState);
  });
});

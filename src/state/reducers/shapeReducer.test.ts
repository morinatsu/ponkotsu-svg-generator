// src/state/reducers/shapeReducer.test.ts
import { describe, it, expect } from 'vitest';
import { shapeReducer } from './shapeReducer';
import type { AppState, Action, RectangleData } from '../../types';

const initialState: AppState = {
  canvasWidth: 800,
  canvasHeight: 600,
  isCanvasInitialized: true,
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
};

describe('shapeReducer', () => {
  it('should select a tool', () => {
    const action: Action = { type: 'SELECT_TOOL', payload: 'ellipse' };
    const newState = shapeReducer(initialState, action);
    expect(newState.currentTool).toBe('ellipse');
    expect(newState.selectedShapeId).toBeNull(); // Should deselect shape
  });

  it('should add a shape', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const action: Action = { type: 'ADD_SHAPE', payload: rect };
    const newState = shapeReducer(initialState, action);
    expect(newState.shapes).toHaveLength(1);
    expect(newState.shapes[0]).toEqual(rect);
    // Current implementation does NOT auto-select on ADD_SHAPE
    expect(newState.selectedShapeId).toBeNull();
  });

  it('should select a shape', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const stateWithShape = { ...initialState, shapes: [rect] };
    const action: Action = { type: 'SELECT_SHAPE', payload: '1' };
    const newState = shapeReducer(stateWithShape, action);
    expect(newState.selectedShapeId).toBe('1');
  });

  it('should deselect a shape', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const stateWithShape = { ...initialState, shapes: [rect], selectedShapeId: '1' };
    const action: Action = { type: 'SELECT_SHAPE', payload: null };
    const newState = shapeReducer(stateWithShape, action);
    expect(newState.selectedShapeId).toBeNull();
  });

  it('should delete selected shape', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const stateWithShape = { ...initialState, shapes: [rect], selectedShapeId: '1' };
    const action: Action = { type: 'DELETE_SELECTED_SHAPE' };
    const newState = shapeReducer(stateWithShape, action);
    expect(newState.shapes).toHaveLength(0);
    expect(newState.selectedShapeId).toBeNull();
  });

  it('should clear canvas', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const stateWithShape = { ...initialState, shapes: [rect], selectedShapeId: '1' };
    const action: Action = { type: 'CLEAR_CANVAS' };
    const newState = shapeReducer(stateWithShape, action);
    expect(newState.shapes).toHaveLength(0);
    expect(newState.selectedShapeId).toBeNull();
    expect(newState.drawingState).toBeNull();
  });

  it('should start text edit', () => {
      const action: Action = {
          type: 'START_TEXT_EDIT',
          payload: { id: null, x: 100, y: 100, content: '' }
      };
      const newState = shapeReducer(initialState, action);
      expect(newState.editingText).toEqual({ id: null, x: 100, y: 100, content: '' });
  });

  it('should finish text edit (add new)', () => {
      const state: AppState = {
          ...initialState,
          editingText: { id: null, x: 100, y: 100, content: '' }
      };
      const action: Action = {
          type: 'FINISH_TEXT_EDIT',
          payload: { content: 'Hello' }
      };
      const newState = shapeReducer(state, action);
      expect(newState.shapes).toHaveLength(1);
      expect(newState.shapes[0].type).toBe('text');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((newState.shapes[0] as any).content).toBe('Hello');
      expect(newState.editingText).toBeNull();
  });

  it('should finish text edit (update existing)', () => {
       const textShape = {
          id: 't1',
          type: 'text' as const,
          x: 100,
          y: 100,
          content: 'Old',
          fontSize: 16,
          fill: 'black',
          fontFamily: 'sans-serif'
       };
       const state: AppState = {
          ...initialState,
          shapes: [textShape],
          editingText: { id: 't1', x: 100, y: 100, content: 'Old' }
       };
       const action: Action = {
           type: 'FINISH_TEXT_EDIT',
           payload: { content: 'New' }
       };
       const newState = shapeReducer(state, action);
       expect(newState.shapes).toHaveLength(1);
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       expect((newState.shapes[0] as any).content).toBe('New');
       expect(newState.editingText).toBeNull();
  });

  it('should cancel text edit', () => {
      const state: AppState = {
          ...initialState,
          editingText: { id: null, x: 100, y: 100, content: '' }
      };
      const action: Action = { type: 'CANCEL_TEXT_EDIT' };
      const newState = shapeReducer(state, action);
      expect(newState.editingText).toBeNull();
  });
});

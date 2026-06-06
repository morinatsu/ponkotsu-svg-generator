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
      payload: { id: null, x: 100, y: 100, content: '' },
    };
    const newState = shapeReducer(initialState, action);
    expect(newState.editingText).toEqual({ id: null, x: 100, y: 100, content: '' });
  });

  it('should finish text edit (add new)', () => {
    const state: AppState = {
      ...initialState,
      editingText: { id: null, x: 100, y: 100, content: '' },
    };
    const action: Action = {
      type: 'FINISH_TEXT_EDIT',
      payload: { content: 'Hello' },
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
      fontFamily: 'sans-serif',
    };
    const state: AppState = {
      ...initialState,
      shapes: [textShape],
      editingText: { id: 't1', x: 100, y: 100, content: 'Old' },
    };
    const action: Action = {
      type: 'FINISH_TEXT_EDIT',
      payload: { content: 'New' },
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
      editingText: { id: null, x: 100, y: 100, content: '' },
    };
    const action: Action = { type: 'CANCEL_TEXT_EDIT' };
    const newState = shapeReducer(state, action);
    expect(newState.editingText).toBeNull();
  });

  it('should ignore FINISH_TEXT_EDIT if content is empty (Line 61-62)', () => {
    const state: AppState = {
      ...initialState,
      editingText: { id: null, x: 100, y: 100, content: '' },
    };
    const action: Action = {
      type: 'FINISH_TEXT_EDIT',
      payload: { content: '   ' }, // Empty or whitespace only
    };
    const newState = shapeReducer(state, action);

    // Should clear editingText without adding a shape
    expect(newState.shapes).toHaveLength(0);
    expect(newState.editingText).toBeNull();
  });

  it('should return untouched state if FINISH_TEXT_EDIT is called while editingText is null', () => {
    const action: Action = {
      type: 'FINISH_TEXT_EDIT',
      payload: { content: 'Hello' },
    };
    const newState = shapeReducer(initialState, action);
    expect(newState).toBe(initialState);
  });

  it('should return untouched state if DELETE_SELECTED_SHAPE is called while selectedShapeId is null', () => {
    const action: Action = { type: 'DELETE_SELECTED_SHAPE' };
    const newState = shapeReducer(initialState, action);
    expect(newState).toBe(initialState);
  });

  it('should return default state for unknown actions (Line 99)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: Action = { type: 'UNKNOWN_ACTION' } as any;
    const newState = shapeReducer(initialState, action);
    expect(newState).toBe(initialState);
  });

  describe('context menu and z-order actions', () => {
    it('should show context menu', () => {
      const action: Action = {
        type: 'SHOW_CONTEXT_MENU',
        payload: { x: 100, y: 150, shapeId: 's1' },
      };
      const newState = shapeReducer(initialState, action);
      expect(newState.contextMenu).toEqual({ x: 100, y: 150, shapeId: 's1' });
    });

    it('should hide context menu', () => {
      const stateWithMenu: AppState = {
        ...initialState,
        contextMenu: { x: 100, y: 150, shapeId: 's1' },
      };
      const action: Action = { type: 'HIDE_CONTEXT_MENU' };
      const newState = shapeReducer(stateWithMenu, action);
      expect(newState.contextMenu).toBeNull();
    });

    const shape1: RectangleData = {
      id: 's1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      rotation: 0,
    };
    const shape2: RectangleData = {
      id: 's2',
      type: 'rectangle',
      x: 20,
      y: 20,
      width: 50,
      height: 50,
      rotation: 0,
    };
    const shape3: RectangleData = {
      id: 's3',
      type: 'rectangle',
      x: 30,
      y: 30,
      width: 50,
      height: 50,
      rotation: 0,
    };

    it('should move shape to front', () => {
      const stateWithShapes: AppState = {
        ...initialState,
        shapes: [shape1, shape2, shape3],
        contextMenu: { x: 100, y: 150, shapeId: 's1' },
      };
      const action: Action = { type: 'MOVE_TO_FRONT', payload: 's1' };
      const newState = shapeReducer(stateWithShapes, action);

      // Order should be s2, s3, s1 (s1 moved to end)
      expect(newState.shapes.map((s) => s.id)).toEqual(['s2', 's3', 's1']);
      expect(newState.contextMenu).toBeNull(); // Should close context menu
    });

    it('should move shape to back', () => {
      const stateWithShapes: AppState = {
        ...initialState,
        shapes: [shape1, shape2, shape3],
        contextMenu: { x: 100, y: 150, shapeId: 's3' },
      };
      const action: Action = { type: 'MOVE_TO_BACK', payload: 's3' };
      const newState = shapeReducer(stateWithShapes, action);

      // Order should be s3, s1, s2 (s3 moved to start)
      expect(newState.shapes.map((s) => s.id)).toEqual(['s3', 's1', 's2']);
      expect(newState.contextMenu).toBeNull(); // Should close context menu
    });

    it('should return untouched state if target shape for z-order action is not found', () => {
      const stateWithShapes: AppState = {
        ...initialState,
        shapes: [shape1, shape2],
      };
      const action: Action = { type: 'MOVE_TO_FRONT', payload: 'invalid-id' };
      const newState = shapeReducer(stateWithShapes, action);
      expect(newState).toBe(stateWithShapes);
    });

    it('should update selected shape stroke color', () => {
      const stateWithShapes: AppState = {
        ...initialState,
        shapes: [shape1, shape2],
        selectedShapeId: 's1',
      };
      const action: Action = { type: 'UPDATE_SELECTED_SHAPE_STROKE', payload: '#ff0000' };
      const newState = shapeReducer(stateWithShapes, action);

      expect(newState.shapes[0].stroke).toBe('#ff0000');
      expect(newState.shapes[1].stroke).toBeUndefined();
    });

    it('should return untouched state if UPDATE_SELECTED_SHAPE_STROKE is called but no shape is selected', () => {
      const stateWithShapes: AppState = {
        ...initialState,
        shapes: [shape1, shape2],
        selectedShapeId: null,
      };
      const action: Action = { type: 'UPDATE_SELECTED_SHAPE_STROKE', payload: '#ff0000' };
      const newState = shapeReducer(stateWithShapes, action);
      expect(newState).toBe(stateWithShapes);
    });
  });
});

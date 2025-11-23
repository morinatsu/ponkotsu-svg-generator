import { describe, it, expect, beforeEach } from 'vitest';
import { undoable, type HistoryState, type HistoryAction } from './historyReducer';
import { reducer as originalReducer, initialState as originalInitialState } from './reducer';
import type { ShapeData } from '../types';

describe('historyReducer (undoable)', () => {
  let historyReducer: (state: HistoryState | undefined, action: HistoryAction) => HistoryState;
  let initialState: HistoryState;
  const dummyShape: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };

  beforeEach(() => {
    historyReducer = undoable(originalReducer);
    initialState = {
      past: [],
      present: originalInitialState,
      future: [],
    };
  });

  it('should return the initial state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = historyReducer(undefined, { type: 'INIT' } as any);
    expect(state).toEqual(initialState);
  });

  it('should handle a recordable action (END_DRAWING)', () => {
    // Simulate a drawing state
    const stateWithDrawing: HistoryState = {
      ...initialState,
      present: {
        ...initialState.present,
        drawingState: {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          startX: 0,
          startY: 0,
        },
      },
    };

    const finalState = historyReducer(stateWithDrawing, { type: 'END_DRAWING' });

    // The past should contain the 'shapes' array from before the action.
    expect(finalState.past).toHaveLength(1);
    expect(finalState.past[0]).toEqual(stateWithDrawing.present.shapes); // Initially empty
    expect(finalState.past[0]).toEqual([]);

    // The present should have the new shape.
    expect(finalState.present.shapes).toHaveLength(1);
    expect(finalState.present.shapes[0].type).toBe('rectangle');

    // Future should be empty.
    expect(finalState.future).toHaveLength(0);
  });

  it('UNDO: should restore past shapes and clear selection', () => {
    const stateWithShape: HistoryState = {
      ...initialState,
      present: {
        ...initialState.present,
        shapes: [dummyShape],
        selectedShapeId: '1',
      },
      past: [[]], // The state before adding the shape was an empty array of shapes
    };

    const state = historyReducer(stateWithShape, { type: 'UNDO' });

    expect(state.past).toHaveLength(0);
    // Present state should have shapes restored to the previous state (empty)
    expect(state.present.shapes).toEqual([]);
    // Selection should be cleared
    expect(state.present.selectedShapeId).toBeNull();
    // Future should now contain the state that was undone
    expect(state.future).toHaveLength(1);
    expect(state.future[0]).toEqual([dummyShape]);
  });

  it('REDO: should restore future shapes and clear selection', () => {
    const stateAfterUndo: HistoryState = {
      ...initialState,
      past: [],
      present: {
        ...initialState.present,
        shapes: [],
        selectedShapeId: null,
      },
      future: [[dummyShape]], // The state to be redone
    };

    const state = historyReducer(stateAfterUndo, { type: 'REDO' });

    // Past should contain the state from before the redo
    expect(state.past).toHaveLength(1);
    expect(state.past[0]).toEqual([]);
    // Present should be restored from future
    expect(state.present.shapes).toEqual([dummyShape]);
    // Selection should be cleared
    expect(state.present.selectedShapeId).toBeNull();
    // Future should be empty again
    expect(state.future).toHaveLength(0);
  });

  it('should handle DELETE_SELECTED_SHAPE correctly in history', () => {
    // 1. Start with a state that has one shape
    let state: HistoryState = {
      ...initialState,
      present: { ...initialState.present, shapes: [dummyShape] },
    };

    // 2. Select the shape (non-recordable)
    state = historyReducer(state, { type: 'SELECT_SHAPE', payload: '1' });
    expect(state.present.selectedShapeId).toBe('1');
    expect(state.past).toHaveLength(0); // No history change

    // 3. Delete the shape (recordable)
    const stateBeforeDelete = state.present;
    state = historyReducer(state, { type: 'DELETE_SELECTED_SHAPE' });
    expect(state.present.shapes).toHaveLength(0);
    expect(state.past).toHaveLength(1);
    // History should contain the shapes array from before the deletion
    expect(state.past[0]).toEqual(stateBeforeDelete.shapes);

    // 4. Undo the deletion
    state = historyReducer(state, { type: 'UNDO' });
    expect(state.present.shapes).toHaveLength(1);
    expect(state.present.shapes[0].id).toBe('1');
    expect(state.present.selectedShapeId).toBeNull(); // Should be deselected
  });

  it('should not record non-recordable action: SELECT_SHAPE', () => {
    let state: HistoryState = {
      ...initialState,
      present: { ...initialState.present, shapes: [dummyShape] },
    };
    const selectAction = { type: 'SELECT_SHAPE' as const, payload: '1' };
    state = historyReducer(state, selectAction);

    expect(state.past).toHaveLength(0); // Past is unchanged
    expect(state.present.selectedShapeId).toBe('1'); // Present is updated
    expect(state.future).toHaveLength(0);
  });

  it('should not record non-recordable action: SELECT_TOOL', () => {
    let state: HistoryState = { ...initialState };
    const selectToolAction = { type: 'SELECT_TOOL' as const, payload: 'ellipse' as const };
    state = historyReducer(state, selectToolAction);

    expect(state.past).toHaveLength(0); // Past is unchanged
    expect(state.present.currentTool).toBe('ellipse'); // Present is updated
    expect(state.future).toHaveLength(0);
  });
  it('UNDO: should only undo the last drag operation, not the shape creation', () => {
    // 1. Add a shape. This creates the first history entry.
    const stateWithDrawing: HistoryState = {
      ...initialState,
      present: {
        ...initialState.present,
        // Draw a rectangle from (10,10) to (60,60)
        drawingState: {
          type: 'rectangle',
          x: 10,
          y: 10,
          width: 50,
          height: 50,
          startX: 10,
          startY: 10,
        },
      },
    };
    let state = historyReducer(stateWithDrawing, { type: 'END_DRAWING' });

    expect(state.past).toHaveLength(1); // History: [initial_empty_state]
    expect(state.present.shapes).toHaveLength(1);
    const shapeId = state.present.shapes[0].id;

    const addedShape = state.present.shapes[0];
    if (addedShape.type !== 'rectangle') throw new Error('Test setup failed');
    expect(addedShape.x).toBe(10);

    // 2. Drag the shape
    // 2a. Start dragging. We simulate clicking at (15,15) on the shape.
    const startDragAction = {
      type: 'START_DRAGGING' as const,
      payload: { shapeId, mouseX: 15, mouseY: 15 },
    };
    state = historyReducer(state, startDragAction);
    const shapesBeforeDrag = state.present.shapes; // The state before drag is what's current.

    // 2b. Stop dragging. The drag operation moved the mouse from (15,15) to (105,105), so dx=90, dy=90.
    // This action should create the second history entry.
    const stopDragAction = { type: 'STOP_DRAGGING' as const, payload: { dx: 90, dy: 90 } };
    state = historyReducer(state, stopDragAction);

    expect(state.past).toHaveLength(2); // History: [initial_empty, pre-drag_state]
    // The state before the drag started should be in the past.
    expect(state.past[1]).toEqual(shapesBeforeDrag);

    // Check if the shape has moved. Original was at x=10, so new is 10+90=100.
    const movedShape = state.present.shapes[0] as Extract<ShapeData, { type: 'rectangle' }>;
    expect(movedShape.x).toBe(100);

    // 3. Perform UNDO
    const finalState = historyReducer(state, { type: 'UNDO' });

    // 4. Assert the outcome
    // The shape should still exist but be back at its original position.
    expect(finalState.present.shapes).toHaveLength(1);
    const undidShape = finalState.present.shapes[0];
    if (undidShape.type !== 'rectangle') throw new Error('Test setup failed');
    expect(undidShape.x).toBe(10); // Back to original x
    expect(undidShape.y).toBe(10); // Back to original y

    // The history should now contain only the initial state (before shape creation)
    expect(finalState.past).toHaveLength(1);
    expect(finalState.past[0]).toEqual([]);

    // The future should contain the state from before the undo (the dragged position)
    expect(finalState.future).toHaveLength(1);
    const futureShape = finalState.future[0][0] as Extract<ShapeData, { type: 'rectangle' }>;
    expect(futureShape.x).toBe(100);
  });
});

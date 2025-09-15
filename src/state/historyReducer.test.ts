import { describe, it, expect, beforeEach } from 'vitest';
import { undoable, type HistoryState, type HistoryAction } from './historyReducer';
import { reducer as originalReducer, initialState as originalInitialState, type ShapeData } from './reducer';

describe('historyReducer (undoable)', () => {
    let historyReducer: (state: HistoryState | undefined, action: HistoryAction | { type: 'INIT' }) => HistoryState;
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
        const state = historyReducer(undefined, { type: 'INIT' });
        expect(state).toEqual(initialState);
    });

    it('should handle a recordable action (END_DRAWING)', () => {
        // Simulate a drawing state
        const stateWithDrawing: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
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
        const selectToolAction = { type: 'SELECT_TOOL' as const, payload: 'ellipse' };
        state = historyReducer(state, selectToolAction);

        expect(state.past).toHaveLength(0); // Past is unchanged
        expect(state.present.currentTool).toBe('ellipse'); // Present is updated
        expect(state.future).toHaveLength(0);
    });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { undoable, type HistoryState } from './historyReducer';
import { reducer as originalReducer, initialState as originalInitialState, type AppState } from './reducer';

describe('historyReducer (undoable)', () => {
    let historyReducer: (state: HistoryState, action: any) => HistoryState;
    let initialState: HistoryState;

    beforeEach(() => {
        historyReducer = undoable(originalReducer);
        initialState = {
            past: [],
            present: originalInitialState,
            future: [],
        };
    });

    it('should return the initial state', () => {
        const state = historyReducer(undefined, { type: 'INIT' } as any);
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

        // The state saved to the past should have drawingState cleared
        const expectedPastState = { ...stateWithDrawing.present, drawingState: null };

        expect(finalState.past).toHaveLength(1);
        expect(finalState.past[0]).toEqual(expectedPastState);
        expect(finalState.present.shapes).toHaveLength(1); // Shape is added
        expect(finalState.future).toHaveLength(0);
    });

    it('UNDO: should restore past state and clear selection', () => {
        const stateWithDrawing: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        let state = historyReducer(stateWithDrawing, { type: 'END_DRAWING' });
        state = historyReducer(state, { type: 'UNDO' });

        const expectedPresent = { ...stateWithDrawing.present, drawingState: null, selectedShapeId: null };

        expect(state.past).toHaveLength(0);
        expect(state.present).toEqual(expectedPresent);
        expect(state.future).toHaveLength(1);
        expect(state.future[0].shapes).toHaveLength(1);
    });

    it('REDO: should restore future state and clear selection', () => {
        const stateWithDrawing: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        let state = historyReducer(stateWithDrawing, { type: 'END_DRAWING' });
        const stateAfterDraw = state.present;
        state = historyReducer(state, { type: 'UNDO' });
        state = historyReducer(state, { type: 'REDO' });

        const expectedPresent = { ...stateAfterDraw, selectedShapeId: null };

        expect(state.past).toHaveLength(1);
        expect(state.present).toEqual(expectedPresent);
        expect(state.future).toHaveLength(0);
    });

    it('should handle DELETE_SELECTED_SHAPE correctly in history', () => {
        // 1. Add a shape
        const stateWithShape: AppState = {
            ...originalInitialState,
            shapes: [{ id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 }]
        };
        let state: HistoryState = {
            past: [],
            present: stateWithShape,
            future: [],
        };

        // 2. Select the shape (non-recordable)
        state = historyReducer(state, { type: 'SELECT_SHAPE', payload: '1' });
        expect(state.present.selectedShapeId).toBe('1');
        expect(state.past).toHaveLength(0); // No history change

        // 3. Delete the shape (recordable)
        state = historyReducer(state, { type: 'DELETE_SELECTED_SHAPE' });
        expect(state.present.shapes).toHaveLength(0);
        expect(state.past).toHaveLength(1);

        // The state saved to history should NOT have a selection
        const expectedPastState = { ...stateWithShape, selectedShapeId: null, drawingState: null };
        expect(state.past[0]).toEqual(expectedPastState);

        // 4. Undo the deletion
        state = historyReducer(state, { type: 'UNDO' });
        expect(state.present.shapes).toHaveLength(1);
        expect(state.present.selectedShapeId).toBeNull(); // Should be deselected
    });

    it('should not record non-recordable actions like SELECT_SHAPE', () => {
        const stateWithShape: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                shapes: [{ id: '1', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }]
            }
        };
        const selectAction = { type: 'SELECT_SHAPE' as const, payload: '1' };
        const finalState = historyReducer(stateWithShape, selectAction);

        expect(finalState.past).toHaveLength(0); // Past is unchanged
        expect(finalState.present.selectedShapeId).toBe('1'); // Present is updated
        expect(finalState.future).toHaveLength(0);
    });
});
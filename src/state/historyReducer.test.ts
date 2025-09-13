import { describe, it, expect, beforeEach } from 'vitest';
import { undoable } from './historyReducer';
import { reducer as originalReducer, initialState as originalInitialState, type Action } from './reducer';

describe('historyReducer (undoable)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let historyReducer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let initialState: any;

    beforeEach(() => {
        historyReducer = undoable(originalReducer);
        initialState = {
            past: [],
            present: originalInitialState,
            future: [],
        };
    });

    // Helper to create a consistent action for testing history
    const endDrawingAction = (id: string): Action => ({
        type: 'END_DRAWING',
    });

    it('should return the initial state', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = historyReducer(undefined, { type: 'INIT' } as any);
        expect(state).toEqual(initialState);
    });

    it('should handle a recordable action (END_DRAWING)', () => {
        // To simulate a drawing, we need a drawingState first
        const stateWithDrawing = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };

        const finalState = historyReducer(stateWithDrawing, endDrawingAction('1'));
        expect(finalState.past).toHaveLength(1);
        expect(finalState.past[0]).toEqual(stateWithDrawing.present);
        expect(finalState.present.shapes).toHaveLength(1);
        expect(finalState.future).toHaveLength(0);
    });

    it('UNDO: should move the present state to the future and the last past state to present', () => {
        const stateWithDrawing = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        let state = historyReducer(stateWithDrawing, endDrawingAction('1'));
        state = historyReducer(state, { type: 'UNDO' });

        expect(state.past).toHaveLength(0);
        expect(state.present).toEqual(stateWithDrawing.present);
        expect(state.future).toHaveLength(1);
        expect(state.future[0].shapes).toHaveLength(1);
    });

    it('REDO: should move the first future state to present and the present state to the past', () => {
        const stateWithDrawing = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        let state = historyReducer(stateWithDrawing, endDrawingAction('1'));
        state = historyReducer(state, { type: 'UNDO' });
        state = historyReducer(state, { type: 'REDO' });

        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual(stateWithDrawing.present);
        expect(state.present.shapes).toHaveLength(1);
        expect(state.future).toHaveLength(0);
    });

    it('should clear future history when a new action is dispatched after an undo', () => {
        const stateWithDrawing1 = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        let state = historyReducer(stateWithDrawing1, endDrawingAction('1'));
        state = historyReducer(state, { type: 'UNDO' }); // Back to stateWithDrawing1.present

        const stateWithDrawing2 = {
            ...state,
            present: {
                ...state.present,
                drawingState: { type: 'rectangle', x: 20, y: 20, width: 5, height: 5 },
            },
        };
        state = historyReducer(stateWithDrawing2, endDrawingAction('2')); // New action

        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual(stateWithDrawing2.present);
        expect(state.present.shapes).toHaveLength(1);
        expect(state.future).toHaveLength(0); // Future is cleared
    });

    it('UNDO: should do nothing if past is empty', () => {
        const state = historyReducer(initialState, { type: 'UNDO' });
        expect(state).toEqual(initialState);
    });

    it('REDO: should do nothing if future is empty', () => {
        const stateWithDrawing = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        let state = historyReducer(stateWithDrawing, endDrawingAction('1'));
        state = historyReducer(state, { type: 'REDO' });

        expect(state.past).toHaveLength(1);
        expect(state.present.shapes).toHaveLength(1);
        expect(state.future).toHaveLength(0);
    });

    it('should not record non-recordable actions like SELECT_SHAPE', () => {
        const stateWithShape = {
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

    it('should not record non-recordable actions like SELECT_TOOL', () => {
        const selectToolAction = { type: 'SELECT_TOOL' as const, payload: 'ellipse' as const };
        const finalState = historyReducer(initialState, selectToolAction);

        expect(finalState.past).toHaveLength(0); // Past is unchanged
        expect(finalState.present.currentTool).toBe('ellipse'); // Present is updated
        expect(finalState.future).toHaveLength(0);
    });
});

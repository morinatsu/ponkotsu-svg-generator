import { describe, it, expect, beforeEach } from 'vitest';
import { undoable } from './historyReducer';
import { reducer as originalReducer, initialState as originalInitialState, type ShapeData, type Action } from './reducer';

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

    const addShapeAction = (id: string): Action => ({
        type: 'ADD_SHAPE',
        payload: { id, type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
    });

    it('should return the initial state', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = historyReducer(undefined, { type: 'INIT' } as any);
        expect(state).toEqual(initialState);
    });

    it('should handle a normal action', () => {
        const state = historyReducer(initialState, addShapeAction('1'));
        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual(originalInitialState);
        expect(state.present.shapes).toHaveLength(1);
        expect(state.present.shapes[0].id).toBe('1');
        expect(state.future).toHaveLength(0);
    });

    it('UNDO: should move the present state to the future and the last past state to present', () => {
        let state = historyReducer(initialState, addShapeAction('1'));
        state = historyReducer(state, { type: 'UNDO' });

        expect(state.past).toHaveLength(0);
        expect(state.present).toEqual({ ...originalInitialState, selectedShapeId: null, drawingState: null });
        expect(state.future).toHaveLength(1);
        expect(state.future[0].shapes[0].id).toBe('1');
    });

    it('REDO: should move the first future state to present and the present state to the past', () => {
        let state = historyReducer(initialState, addShapeAction('1'));
        state = historyReducer(state, { type: 'UNDO' });
        state = historyReducer(state, { type: 'REDO' });

        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual({ ...originalInitialState, selectedShapeId: null, drawingState: null });
        expect(state.present.shapes).toHaveLength(1);
        expect(state.present.shapes[0].id).toBe('1');
        expect(state.future).toHaveLength(0);
    });

    it('should clear future history when a new action is dispatched after an undo', () => {
        let state = historyReducer(initialState, addShapeAction('1'));
        state = historyReducer(state, { type: 'UNDO' }); // Back to initial state
        state = historyReducer(state, addShapeAction('2')); // New action

        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual({ ...originalInitialState, selectedShapeId: null, drawingState: null });
        expect(state.present.shapes).toHaveLength(1);
        expect(state.present.shapes[0].id).toBe('2');
        expect(state.future).toHaveLength(0); // Future is cleared
    });

    it('UNDO: should do nothing if past is empty', () => {
        const state = historyReducer(initialState, { type: 'UNDO' });
        expect(state).toEqual(initialState);
    });

    it('REDO: should do nothing if future is empty', () => {
        let state = historyReducer(initialState, addShapeAction('1'));
        state = historyReducer(state, { type: 'REDO' });

        expect(state.past).toHaveLength(1);
        expect(state.present.shapes).toHaveLength(1);
        expect(state.future).toHaveLength(0);
    });

    it('should not record non-recordable actions', () => {
        const stateWithShape = historyReducer(initialState, addShapeAction('1'));
        const selectAction = { type: 'SELECT_SHAPE' as const, payload: '1' };
        const finalState = historyReducer(stateWithShape, selectAction);

        expect(finalState.past).toHaveLength(1); // Past is unchanged
        expect(finalState.present.selectedShapeId).toBe('1'); // Present is updated
        expect(finalState.future).toHaveLength(0); // Future is unchanged
    });
});

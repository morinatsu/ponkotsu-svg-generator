import { describe, it, expect, beforeEach } from 'vitest';
import { undoable, type HistoryState } from './historyReducer';
import { reducer as originalReducer, initialState as originalInitialState, type ShapeData } from './reducer';

describe('historyReducer (undoable)', () => {
    let historyReducer: (state: HistoryState | undefined, action: any) => HistoryState;
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

        // The previous `shapes` array (which was empty) should be in the past.
        expect(finalState.past).toHaveLength(1);
        expect(finalState.past[0]).toEqual([]); // Past should contain the previous shapes array
        expect(finalState.present.shapes).toHaveLength(1); // New shape is added to present
        expect(finalState.future).toHaveLength(0);
    });

    it('UNDO: should restore the previous shapes array and clear selection', () => {
        const stateWithDrawing: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        // 1. Draw a shape
        let state = historyReducer(stateWithDrawing, { type: 'END_DRAWING' });
        const shapesAfterDraw = state.present.shapes; // This is the state we expect in `future`

        // 2. Select the new shape (non-recordable)
        const newShapeId = state.present.shapes[0].id;
        state = historyReducer(state, { type: 'SELECT_SHAPE', payload: newShapeId });
        expect(state.present.selectedShapeId).toBe(newShapeId);

        // 3. Undo the drawing
        state = historyReducer(state, { type: 'UNDO' });

        expect(state.past).toHaveLength(0);
        expect(state.present.shapes).toEqual([]); // Back to initial empty shapes
        expect(state.present.selectedShapeId).toBeNull(); // Selection is cleared
        expect(state.future).toHaveLength(1);
        expect(state.future[0]).toEqual(shapesAfterDraw); // The shapes array after drawing is in future
    });

    it('REDO: should restore the next shapes array and clear selection', () => {
        const stateWithDrawing: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                drawingState: { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
            },
        };
        // 1. Draw a shape
        let state = historyReducer(stateWithDrawing, { type: 'END_DRAWING' });
        const shapesAfterDraw = state.present.shapes;
        const initialShapes = state.past[0]; // The empty array

        // 2. Undo
        state = historyReducer(state, { type: 'UNDO' });

        // 3. Redo
        state = historyReducer(state, { type: 'REDO' });

        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual(initialShapes); // Past contains the initial empty shapes array
        expect(state.present.shapes).toEqual(shapesAfterDraw); // Present has the shape again
        expect(state.present.selectedShapeId).toBeNull(); // Selection is cleared
        expect(state.future).toHaveLength(0);
    });

    it('should handle DELETE_SELECTED_SHAPE correctly in history', () => {
        const initialShape: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };
        // 1. Start with a state that has one shape
        let state: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                shapes: [initialShape],
            },
        };

        // 2. Select the shape (non-recordable)
        state = historyReducer(state, { type: 'SELECT_SHAPE', payload: '1' });
        expect(state.present.selectedShapeId).toBe('1');
        expect(state.past).toHaveLength(0); // No history change

        // 3. Delete the shape (recordable)
        state = historyReducer(state, { type: 'DELETE_SELECTED_SHAPE' });
        expect(state.present.shapes).toHaveLength(0);
        expect(state.past).toHaveLength(1);
        expect(state.past[0]).toEqual([initialShape]); // Past contains the state before deletion

        // 4. Undo the deletion
        state = historyReducer(state, { type: 'UNDO' });
        expect(state.present.shapes).toHaveLength(1);
        expect(state.present.shapes[0]).toEqual(initialShape);
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

    it('should not record history if shapes have not changed', () => {
        // This can happen if an action is recordable but doesn't result in a change
        // e.g., DELETE_SELECTED_SHAPE when nothing is selected.
        const stateWithShape: HistoryState = {
            ...initialState,
            present: {
                ...initialState.present,
                shapes: [{ id: '1', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }],
                selectedShapeId: null, // Nothing selected
            }
        };

        const finalState = historyReducer(stateWithShape, { type: 'DELETE_SELECTED_SHAPE' });

        expect(finalState.past).toHaveLength(0);
        expect(finalState.present.shapes).toHaveLength(1);
    });
});
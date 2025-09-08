import { type Action, type AppState, reducer as originalReducer, initialState as originalInitialState } from './reducer';
import isEqual from 'lodash/isEqual';

// The new state structure that includes history
export interface HistoryState {
    past: AppState[];
    present: AppState;
    future: AppState[];
}

// Actions for undo/redo
type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

// Actions that should not be part of the history
const nonRecordableActions = new Set<string>(['SELECT_SHAPE', 'START_DRAWING', 'DRAWING']);


// Higher-order reducer to add undo/redo functionality
export const undoable = (reducer: typeof originalReducer) => {
    // The initial state of the undoable reducer
    const initialState: HistoryState = {
        past: [],
        present: originalInitialState,
        future: [],
    };

    return (state: HistoryState = initialState, action: HistoryAction): HistoryState => {
        const { past, present, future } = state;

        switch (action.type) {
            case 'UNDO': {
                if (past.length === 0) {
                    return state;
                }
                const previous = { ...past[past.length - 1] };
                const newPast = past.slice(0, past.length - 1);

                // On undo, always clear the selection and drawing state.
                previous.selectedShapeId = null;
                previous.drawingState = null;

                return {
                    past: newPast,
                    present: previous,
                    future: [present, ...future],
                };
            }
            case 'REDO': {
                if (future.length === 0) {
                    return state;
                }
                const next = { ...future[0] };
                const newFuture = future.slice(1);

                // On redo, always clear the selection and drawing state.
                next.selectedShapeId = null;
                next.drawingState = null;

                return {
                    past: [...past, present],
                    present: next,
                    future: newFuture,
                };
            }
            default: {
                // Delegate handling the action to the original reducer
                const newPresent = reducer(present, action);

                // If the action is non-recordable or the state hasn't changed,
                // just update the present state without affecting history.
                if (isEqual(present, newPresent) || nonRecordableActions.has(action.type)) {
                    return { ...state, present: newPresent };
                }

                // For recordable actions that change the state
                return {
                    past: [...past, present],
                    present: newPresent,
                    future: [], // Clear future on new action
                };
            }
        }
    };
};

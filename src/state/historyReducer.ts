/**
 * @file Higher-Order Reducer providing Undo/Redo functionality
 *
 * ## Design Philosophy
 *
 * This Undo/Redo mechanism aims to track only **persistent changes** to the application state
 * that the user would likely want to "undo" or "redo".
 * Specifically, it tracks changes to the list of shapes on the canvas (`shapes` array).
 * Temporary UI state changes, such as tool selection or the state during drawing, are not recorded in the history.
 *
 * ## Structure of HistoryState
 *
 * - `past`: An array holding past states of `shapes` (`ShapeData[][]`). When the user performs UNDO, the last state here is restored to `present`.
 * - `present`: The current complete application state (`AppState`), including UI state.
 * - `future`: An array holding future states of `shapes` (`ShapeData[][]`). When the user performs REDO, the first state here is restored to `present`.
 *
 * ## Mechanism
 *
 * 1. `undoable` is a Higher-Order Reducer that wraps the original `reducer`.
 * 2. It receives all actions and decides whether to manipulate the history or just update the `present` state based on the action type.
 *
 * ### History Recording Logic
 *
 * - Only action types registered in the `recordableActions` set trigger history recording.
 * - Even if an action is recordable, a new history entry is created only if `present.shapes` is actually changed (checked using `isEqual`).
 * - When a recordable action is executed, the `present.shapes` **before** the action is applied is added to `past`, and `future` is cleared.
 *
 * ### Non-Recordable Actions
 *
 * - For actions not in `recordableActions` (e.g., `SELECT_TOOL`), the history (`past`, `future`) remains unchanged.
 * - Only the `present` state is updated with the `newPresent` calculated by the original `reducer`.
 *
 * ### UNDO / REDO
 *
 * - `UNDO`: Retrieves the last `shapes` from `past` and sets it to `present.shapes`. The original `present.shapes` is added to the beginning of `future`. After Undo, `selectedShapeId` becomes `null` to avoid confusion.
 * - `REDO`: Retrieves the first `shapes` from `future` and sets it to `present.shapes`. The original `present.shapes` is added to the end of `past`. Similarly, `selectedShapeId` becomes `null` after Redo.
 *
 * ## How to Extend
 *
 * To make a new action (e.g., `MOVE_SHAPE`) undoable/redoable, simply add its action type to the `recordableActions` set in `historyReducer.ts`.
 *
 * @example
 * ```
 * const recordableActions = new Set<string>([
 *     'END_DRAWING',
 *     'DELETE_SELECTED_SHAPE',
 *     'CLEAR_CANVAS',
 *     'MOVE_SHAPE', // <--- Add new action here
 * ]);
 * ```
 */
import { reducer as originalReducer, initialState as originalInitialState } from './reducer';
import type { ShapeData, Action, AppState } from '../types';
import isEqual from 'lodash/isEqual.js';

export interface HistoryState {
  past: ShapeData[][]; // Array of past shape lists
  present: AppState; // Current full state including UI state
  future: ShapeData[][]; // Array of future shape lists
}

// Actions for undo/redo
export type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

// Define list of actions to record in history
const recordableActions = new Set<string>([
  'END_DRAWING',
  'DELETE_SELECTED_SHAPE',
  'CLEAR_CANVAS',
  'FINISH_TEXT_EDIT',
  'STOP_DRAGGING',
]);

// Higher-order reducer to add undo/redo functionality
export const undoable = (reducer: typeof originalReducer) => {
  // New Initial State
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
        const previousShapes = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        return {
          past: newPast,
          present: {
            ...present,
            shapes: previousShapes,
            selectedShapeId: null, // Deselect on Undo
            // Reset operation states (drawing, dragging)
            mode: 'idle',
            drawingState: null,
            draggingState: null,
          },
          future: [present.shapes, ...future],
        };
      }
      case 'REDO': {
        if (future.length === 0) {
          return state;
        }
        const nextShapes = future[0];
        const newFuture = future.slice(1);
        return {
          past: [...past, present.shapes],
          present: {
            ...present,
            shapes: nextShapes,
            selectedShapeId: null, // Deselect on Redo
            // Reset operation states (drawing, dragging)
            mode: 'idle',
            drawingState: null,
            draggingState: null,
          },
          future: newFuture,
        };
      }
      default: {
        // First, calculate the new state with the original reducer
        const newPresent = reducer(present, action as Action);

        // STOP_DRAGGING is treated specially. Record history only if there was movement.
        if (action.type === 'STOP_DRAGGING') {
          const { dx, dy } = action.payload;
          if (dx !== 0 || dy !== 0) {
            return {
              past: [...past, present.shapes], // Record shapes before drag
              present: newPresent,
              future: [],
            };
          }
        }
        // For other recordable actions, update history only if the shapes array actually changed
        else if (
          recordableActions.has(action.type) &&
          !isEqual(present.shapes, newPresent.shapes)
        ) {
          return {
            past: [...past, present.shapes],
            present: newPresent,
            future: [],
          };
        }

        // For non-recordable actions (e.g., SELECT_TOOL),
        // do not change history, only update the present state
        return { ...state, present: newPresent };
      }
    }
  };
};

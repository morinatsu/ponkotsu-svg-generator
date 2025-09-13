import { type Action, type AppState, type ShapeData, reducer as originalReducer, initialState as originalInitialState } from './reducer';
import isEqual from 'lodash/isEqual';

// The new state structure that includes history
export interface HistoryState {
    past: ShapeData[][]; // 過去の図形リスト
    present: AppState;   // 現在のフル状態
    future: ShapeData[][]; // 未来の図形リスト
}

// Actions for undo/redo
export type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

// 履歴に残すアクションのリスト
const recordableActions = new Set<string>([
    'END_DRAWING',
    'DELETE_SELECTED_SHAPE',
    'CLEAR_CANVAS',
]);

export const undoable = (reducer: typeof originalReducer) => {
    const initialState: HistoryState = {
        past: [],
        present: originalInitialState,
        future: [],
    };

    return (state: HistoryState = initialState, action: HistoryAction): HistoryState => {
        const { past, present, future } = state;

        switch (action.type) {
            case 'UNDO': {
                if (past.length === 0) return state;
                const previousShapes = past[past.length - 1];
                const newPast = past.slice(0, past.length - 1);
                return {
                    past: newPast,
                    present: { ...present, shapes: previousShapes, selectedShapeId: null }, // 選択は解除
                    future: [present.shapes, ...future],
                };
            }
            case 'REDO': {
                if (future.length === 0) return state;
                const nextShapes = future[0];
                const newFuture = future.slice(1);
                return {
                    past: [...past, present.shapes],
                    present: { ...present, shapes: nextShapes, selectedShapeId: null }, // 選択は解除
                    future: newFuture,
                };
            }
            default: {
                const newPresent = reducer(present, action as Action);

                // アクションが記録対象で、かつshapesの内容が実際に変更された場合のみ履歴を更新
                if (
                    recordableActions.has((action as Action).type) &&
                    !isEqual(present.shapes, newPresent.shapes)
                ) {
                    return {
                        past: [...past, present.shapes],
                        present: newPresent,
                        future: [], // 新しい操作が行われたらfutureはクリア
                    };
                }

                // 記録対象外のアクションの場合は、present stateのみを更新
                return { ...state, present: newPresent };
            }
        }
    };
};
import { type ShapeData, type Action, type AppState, reducer as originalReducer, initialState as originalInitialState } from './reducer';
import isEqual from 'lodash/isEqual';

export interface HistoryState {
    past: ShapeData[][];       // 過去の図形リストの配列
    present: AppState;         // UIの状態も含む現在のフル状態
    future: ShapeData[][];      // 未来の図形リストの配列
}

// Actions for undo/redo
type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

// 履歴に記録するアクションのリストを定義
const recordableActions = new Set<string>([
    'END_DRAWING',
    'DELETE_SELECTED_SHAPE',
    'CLEAR_CANVAS',
]);

// Higher-order reducer to add undo/redo functionality
export const undoable = (reducer: typeof originalReducer) => {
    // 新しいInitial State
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
                    present: { ...present, shapes: previousShapes, selectedShapeId: null }, // Undo時は選択を解除
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
                    present: { ...present, shapes: nextShapes, selectedShapeId: null }, // Redo時も選択を解除
                    future: newFuture,
                };
            }
            default: {
                // まず、元々のReducerで新しい状態を計算する
                const newPresent = reducer(present, action as Action);

                // もし、実行されたアクションが記録対象のアクションで、
                // かつ、shapes配列が実際に変更されていた場合のみ履歴を更新する
                if (
                    recordableActions.has((action as Action).type) &&
                    !isEqual(present.shapes, newPresent.shapes)
                ) {
                    // futureをクリアして、新しい履歴を追加
                    return {
                        past: [...past, present.shapes],
                        present: newPresent,
                        future: [],
                    };
                }

                // 記録対象外のアクション（SELECT_TOOLなど）の場合は、
                // 履歴を変更せず、presentの状態だけを更新する
                return { ...state, present: newPresent };
            }
        }
    };
};
/**
 * @file Undo/Redo機能を提供するHigher-Order Reducer
 *
 * ## 設計思想
 *
 * このUndo/Redo機構は、アプリケーションの状態のうち、ユーザーが「元に戻したい」「やり直したい」と考えるであろう
 * **永続的な変更**のみを履歴の対象とすることを目的としています。
 * 具体的には、キャンバス上の図形リスト (`shapes` 配列) への変更のみを追跡します。
 * ツールの選択や、一時的な描画中の状態など、UIの一時的な状態変更は履歴に記録しません。
 *
 * ## HistoryStateの構造
 *
 * - `past`: 過去の `shapes` の状態を保持する配列 (`ShapeData[][]`)。ユーザーがUNDOを行うと、ここの最後の状態が `present` に復元されます。
 * - `present`: 現在の完全なアプリケーションの状態 (`AppState`)。UIの状態も含みます。
 * - `future`: 未来の `shapes` の状態を保持する配列 (`ShapeData[][]`)。ユーザーがREDOを行うと、ここの最初の状態が `present` に復元されます。
 *
 * ## 動作の仕組み
 *
 * 1.  `undoable` は、元の `reducer` をラップするHigher-Order Reducerです。
 * 2.  全てのアクションを一旦受け取り、その種類によって履歴を操作するか、`present` の状態を更新するだけかを判断します。
 *
 * ### 履歴の記録ロジック
 *
 * - `recordableActions` セットに登録されたアクションタイプのみが、履歴記録のトリガーとなります。
 * - アクションが記録対象であっても、`isEqual` を用いて `present.shapes` が実際に変更された場合のみ、新しい履歴が作成されます。
 * - 記録対象のアクションが実行されると、そのアクションが適用される**前**の `present.shapes` が `past` に追加され、`future` はクリアされます。
 *
 * ### 記録対象外のアクション
 *
 * - `recordableActions` に含まれないアクション（例: `SELECT_TOOL`）の場合、履歴 (`past`, `future`) は変更されません。
 * - 元の `reducer` によって更新された `newPresent` で `present` の状態のみが更新されます。
 *
 * ### UNDO / REDO
 *
 * - `UNDO`: `past` の最後の `shapes` を取り出して `present.shapes` に設定します。元の `present.shapes` は `future` の先頭に追加されます。Undo実行後は、混乱を避けるため `selectedShapeId` は `null` になります。
 * - `REDO`: `future` の最初の `shapes` を取り出して `present.shapes` に設定します。元の `present.shapes` は `past` の末尾に追加されます。Redo実行後も同様に `selectedShapeId` は `null` になります。
 *
 * ## 拡張方法
 *
 * 新しいアクション（例: `MOVE_SHAPE`）をUndo/Redo可能にするには、`historyReducer.ts` 内の `recordableActions` セットにそのアクションタイプを追加するだけです。
 *
 * @example
 * ```
 * const recordableActions = new Set<string>([
 *     'END_DRAWING',
 *     'DELETE_SELECTED_SHAPE',
 *     'CLEAR_CANVAS',
 *     'MOVE_SHAPE', // <--- 新しいアクションをここに追加
 * ]);
 * ```
 */
import { type ShapeData, type Action, type AppState, reducer as originalReducer, initialState as originalInitialState } from './reducer';
import isEqual from 'lodash/isEqual';

export interface HistoryState {
    past: ShapeData[][];       // 過去の図形リストの配列
    present: AppState;         // UIの状態も含む現在のフル状態
    future: ShapeData[][];      // 未来の図形リストの配列
}

// Actions for undo/redo
export type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

// 履歴に記録するアクションのリストを定義
const recordableActions = new Set<string>([
    'END_DRAWING',
    'DELETE_SELECTED_SHAPE',
    'CLEAR_CANVAS',
    'FINISH_TEXT_EDIT',
    'STOP_DRAGGING',
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
                    present: {
                        ...present,
                        shapes: previousShapes,
                        selectedShapeId: null, // Undo時は選択を解除
                        // 操作中（描画、ドラッグ）の状態もリセットする
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
                        selectedShapeId: null, // Redo時も選択を解除
                        // 操作中（描画、ドラッグ）の状態もリセットする
                        mode: 'idle',
                        drawingState: null,
                        draggingState: null,
                    },
                    future: newFuture,
                };
            }
            default: {
                // まず、元々のReducerで新しい状態を計算する
                const newPresent = reducer(present, action as Action);

                // STOP_DRAGGINGは特別扱い。移動があった場合のみ履歴に記録する
                if (action.type === 'STOP_DRAGGING') {
                    const { dx, dy } = action.payload;
                    if (dx !== 0 || dy !== 0) {
                        return {
                            past: [...past, present.shapes], // ドラッグ前のshapesを記録
                            present: newPresent,
                            future: [],
                        };
                    }
                }
                // 他の記録対象アクションは、shapes配列が実際に変更された場合のみ履歴を更新する
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

                // 記録対象外のアクション（SELECT_TOOLなど）の場合は、
                // 履歴を変更せず、presentの状態だけを更新する
                return { ...state, present: newPresent };
            }
        }
    };
};
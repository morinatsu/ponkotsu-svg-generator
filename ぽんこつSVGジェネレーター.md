### Julesへの指示書 (v0.3.1 - Undo/Redo修正)

### **プロジェクト名:**

ぽんこつSVGジェネレーター (v0.3.1 - Undo/Redo修正)

### **プロジェクト概要:**

現在のUndo/Redo機構を修正し、**図形の追加・削除・全消去といった、キャンバスの内容が変更される操作のみを履歴として記録**するように変更します。図形の選択状態のような一時的なUIの状態は履歴管理から除外し、より直感的で安定した動作を目指します。

-----

### **実装ステップの提案:**

Jules、以下のステップで `historyReducer.ts` を修正してください。

#### 1\. 履歴管理するStateの対象を `shapes` に絞る

`historyReducer.ts` を開き、`HistoryState` の構造を変更します。`AppState` まるごとではなく、`shapes` 配列のみを履歴として管理するようにします。

**`src/state/historyReducer.ts` の修正:**

```typescript
// 変更前
// export interface HistoryState {
//   past: AppState[];
//   present: AppState;
//   future: AppState[];
// }

// 変更後
export interface HistoryState {
    past: ShapeData[][]; // 過去の図形リスト
    present: AppState;   // 現在のフル状態
    future: ShapeData[][]; // 未来の図形リスト
}
```

#### 2\. アクションに基づいて履歴を管理するようにロジックを修正

`isEqual` による比較をやめ、特定のアクションタイプに基づいて履歴を更新するロジックに変更します。

**`src/state/historyReducer.ts` の `undoable` Reducer内のロジックを以下のように修正してください:**

```typescript
// ... (HistoryStateの定義後)

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
```

この修正により、`SELECT_SHAPE` のようなUI操作は履歴に影響を与えず、図形の状態が変更されたときだけUndo/Redoが可能になります。また、Undo/Redo時には常に選択が解除されるため、より予測可能な動作になります。
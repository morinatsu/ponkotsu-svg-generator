### **プロジェクト名:**

ぽんこつSVGジェネレーター (v0.3 - Undo/Redo機能)

### **プロジェクト概要:**

v0.2で実装した選択・消去機能に加え、**「元に戻す (Undo)」** と **「やり直す (Redo)」** 機能を実装します。ユーザーが行った操作（図形の追加、削除、全消去）を履歴として管理し、時間を遡って状態を復元できるようにします。

### **技術スタック:**

* 変更ありません。Reactの `useReducer` を引き続き使用します。

---

### **機能要件 (変更・追加点):**

#### 1\. 画面構成

* **ツールバーの更新:**

  * 既存の「クリア」「エクスポート」ボタンの隣に、\*\*「Undo」**と**「Redo」\*\*ボタンを追加してください。
  * Undoができない場合（履歴がない場合）は「Undo」ボタンを、Redoができない場合は「Redo」ボタンを無効化（`disabled`）してください。

#### 2\. コア機能

* **状態管理の拡張:**

  * 現在の `AppState` を**履歴管理可能な新しいState**でラップしてください。新しいStateは `{ past: AppState\\\[], present: AppState, future: AppState\\\[] }` という構造を持ちます。

* **【新機能】Undo (元に戻す)**

  * 「Undo」ボタンをクリックするか、キーボードで `Ctrl+Z` (macOSでは `Cmd+Z`) を押すと、直前の状態に戻るようにしてください。
  * 具体的には、`past` 配列の最後の状態を新しい `present` にし、元々の `present` を `future` 配列の先頭に追加します。

* **【新機能】Redo (やり直す)**

  * 「Redo」ボタンをクリックするか、キーボードで `Ctrl+Y` (macOSでは `Cmd+Shift+Z`) を押すと、Undoで戻した操作をやり直せるようにしてください。
  * 具体的には、`future` 配列の最初の状態を新しい `present` にし、元々の `present` を `past` 配列の末尾に追加します。

* **履歴のリセット:**

  * 図形を新しく描き始めたり、消去したりするなど、`present` の状態に新しい変更が加わった際には、`future` の履歴はすべて破棄（空の配列にリセット）してください。

---

### **実装ステップの提案:**

Jules、以下のステップで実装を進めてください。

1. **新しいReducerの作成:**

   * `src/state` ディレクトリに、**`historyReducer.ts`** のような新しいファイルを作成します。
   * このファイルで、履歴を管理する高階Reducer（`undoable` のような名前の関数）を定義します。この関数は、引数として既存の図形操作Reducerを受け取ります。
   * `undoable` Reducerは、新しいアクションタイプ `'UNDO'` と `'REDO'` を処理します。それ以外のアクションが来た場合は、受け取ったReducerを実行し、その結果を使って `past`, `present`, `future` を更新します。

2. **`App.tsx` の更新:**

   * `useReducer` を、新しく作成した `undoable(reducer)` で初期化します。
   * `state` からは `state.present.shapes` や `state.present.selectedShapeId` のように、一段深くオブジェクトを辿って現在の状態を取得するように変更します。
   * Undo/Redoボタンのための `handleUndo`, `handleRedo` 関数を定義し、それぞれ `'UNDO'`, `'REDO'` アクションをdispatchするようにします。

3. **`Toolbar.tsx` の更新:**

   * 新しいPropsとして `onUndo`, `onRedo`, `canUndo`, `canRedo` を受け取るようにします。
   * `canUndo` (state.past.length > 0) と `canRedo` (state.future.length > 0) の状態に応じて、ボタンの `disabled` 属性を制御してください。

4. **`useKeyboardControls.ts` の更新:**

   * 既存の `handleKeyDown` イベントリスナーを拡張します。
   * `e.ctrlKey || e.metaKey` をチェックし、`e.key === 'z'` であればUndo、`e.key === 'y'` であればRedoのアクションをdispatchするようにしてください。 (Shift+Zの対応も忘れずに)

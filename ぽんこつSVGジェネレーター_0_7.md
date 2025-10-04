### Julesへの指示書 (v0.7 - 図形の移動機能)

### **プロジェクト名:**

ぽんこつSVGジェネレーター (v0.7 - 図形の移動機能)

### **プロジェクト概要:**

キャンバス上の図形（長方形、楕円、線）を、ユーザーがマウスでドラッグ＆ドロップして直感的に移動できる機能を実装します。これにより、SVGエディタとしての基本的な操作性を確立します。

---

### **機能要件:**

#### 1. 状態管理の拡張
* **操作モードの追加:**
    * アプリケーションの現在の操作モード（「描画中」「移動中」「通常」など）を管理する新しいStateを`AppState`に追加してください。例: `mode: 'idle' | 'drawing' | 'dragging'`
* **ドラッグ情報の保持:**
    * 図形をドラッグしている間の情報を保持するためのStateを追加します。これには、ドラッグ対象の図形ID、ドラッグ開始時のマウス座標、図形の元の座標との差分（オフセット）などを含めます。

#### 2. コア機能
* **移動の開始 (`mousedown`):**
    * いずれかの図形の上でマウスのボタンが押されたら、アプリケーションのモードを `'dragging'` に変更します。
    * その際、対象の図形IDと、ドラッグ開始時のマウス座標をStateに記録してください。
    * **重要:** この操作は、新しい図形を描き始める操作と競合しないように、`useDrawing`フックの`handleMouseDown`が実行されないようにする必要があります。
* **移動中 (`mousemove`):**
    * モードが`'dragging'`の間、マウスの動きに合わせて、対象図形の座標をリアルタイムに更新してください。
    * 計算方法: `(現在のマウス座標) - (ドラッグ開始時からのオフセット)`
* **移動の終了 (`mouseup`):**
    * マウスボタンが離されたら、モードを`'idle'`に戻し、図形の位置を最終決定します。
    * この**移動が完了したタイミング**で、操作履歴（Undo/Redo）に状態を記録してください。

---

### **実装ステップの提案:**

Jules、以下のステップで実装を進めてください。

#### 1. StateとActionの定義変更 (`src/state/reducer.ts`)

* **`AppState`の更新:**
    * `mode: 'idle' | 'drawing' | 'dragging'` を追加します。
    * `draggingState: { shapeId: string; startX: number; startY: number; offsetX: number; offsetY: number } | null` を追加します。
* **`Action`型の追加:**
    * `START_DRAGGING`, `DRAG_SHAPE`, `STOP_DRAGGING` のような、図形の移動に関する新しいアクションを追加してください。

#### 2. Reducerのロジック拡張 (`src/state/reducer.ts`)

* 追加した`START_DRAGGING`, `DRAG_SHAPE`, `STOP_DRAGGING`アクションを処理する`case`文を実装してください。
    * `START_DRAGGING`: `mode`を`'dragging'`に設定し、`draggingState`に必要な情報を格納します。
    * `DRAG_SHAPE`: `draggingState`の情報とマウス座標から、対象図形の新しい座標を計算し、`shapes`配列内の該当オブジェクトを更新します。
    * `STOP_DRAGGING`: `mode`を`'idle'`に戻し、`draggingState`を`null`にします。このアクションがUndo履歴の記録対象となります。

#### 3. 新しいカスタムフックの作成 (`src/hooks/useDragging.ts`)

* `useDrawing`フックを参考に、図形の移動操作を専門に扱う`useDragging`という新しいカスタムフックを作成します。
* このフックは、`dispatch`と`svgRef`を引数に取ります。
* 図形に対する`onMouseDown`, `onMouseMove`, `onMouseUp`イベントを処理する関数（`handleMouseDown`, `handleMouseMove`, `handleMouseUp`）を内部に実装し、それぞれ適切なアクション（`START_DRAGGING`など）を`dispatch`します。
* `onMouseMove`と`onMouseUp`は、`window`のイベントリスナーとして登録し、キャンバスの外にマウスが出てもドラッグが継続・終了できるようにしてください。

#### 4. コンポーネントへの適用

* **`App.tsx`:**
    * 作成した`useDragging`フックを呼び出します。
    * `useDrawing`の`handleMouseDown`と`useDragging`の`handleMouseDown`が競合しないよう、`SvgCanvas`の`onMouseDown`では、現在の`mode`が`'idle'`の時のみ描画を開始する、といった制御を追加します。
* **`Shape.tsx`:**
    * 各SVG要素（`<rect>`, `<ellipse>`など）に`onMouseDown`イベントハンドラを追加し、`useDragging`から渡された`handleMouseDown`を呼び出すようにします。これにより、図形の上でドラッグを開始できるようになります。
    * カーソルのスタイルを `'grab'` や `'grabbing'` に変更すると、より操作性が向上します。

#### 5. Undo/Redoへの対応 (`src/state/historyReducer.ts`)

* `recordableActions`のSetに`'STOP_DRAGGING'`アクション（または移動を確定させるアクション名）を追加し、移動操作が完了した時点でUndo履歴に保存されるようにしてください。

# ぽんこつSVGジェネレーター (v0.5 - 複数図形への対応)

### Julesへの指示書 (v0.4.2 - デバッグモードのコマンドライン対応)

## プロジェクト概要

現在の長方形のみを描画できる機能に加え、**「楕円」** と **「線」**を描画できるように機能を拡張します。ユーザーがツールバーから描画したい図形を選択できるUIを設け、アプリケーションの表現力を向上させます。

ぽんこつSVGジェネレーター (v0.4.2 - デバッグモードのコマンドライン対応)

## 機能要件 (変更・追加点)

### 1. 画面構成

デバッグ機能（アクションロガーと状態ビューア）の有効化を、これまでの `NODE_ENV` による自動判別に加え、**コマンドラインから明示的に指定できる**ように変更します。これにより、通常の開発時とデバッグ時を簡単に切り替えられるようにします。

- **ツールバーの更新:**
  - 既存のボタン群の近くに、描画ツールを選択するための**「長方形」「楕円」「線」**ボタンを設置してください。
  - 現在選択されている描画ツールがどれか、視覚的にわかるようにしてください（例：選択中のボタンの背景色を変える）。

### 2. コア機能

- **データ構造の拡張**:
  - `src/state/reducer.ts`の`ShapeData`型を、Discriminated Union（判別可能な合併型）に変更し、`rectangle, ellipse, line`の3種類の型を扱えるようにしてください。

    - 各型は`type`プロパティ（例: `type: 'rectangle'`）で識別できるようにします。
    - **Ellipse**: `{ id, type: 'ellipse', cx, cy, rx, ry }`
    - **Line**: `{ id, type: 'line', x1, y1, x2, y2 }`
  - `AppState`に、現在選択されている描画ツールを保持するための`currentTool: 'rectangle' | 'ellipse' | 'line'`のようなプロパティを追加してください。
- **ツールの切り替え**:
  - ユーザーがツールバーの図形ボタンをクリックすると、`AppState`の`currentTool`が切り替わるようにしてください。
- **描画ロジックの汎用化**:
  - マウスのドラッグ操作による描画ロジックを、`currentTool`の状態に応じて適切な図形を描画できるように変更してください。
    - **長方形**: 従来通り。
    - **楕円**: ドラッグで描かれる矩形に内接する楕円として描画します。
    - **線**: ドラッグの始点から終点まで直線を引きます。

### 3. レンダリング

- `Shape.tsx`の更新:
  - 現在`if (shape.type === 'rectangle')`となっている条件分岐を`switch`文に変更し、`shape.type`の値に応じて`<rect>, <ellipse>, <line>`の各SVG要素を正しくレンダリングできるようにしてください。

## 実装ステップの提案:

Jules、以下のステップで実装を進めてください。

1. Stateと型の定義変更 (src/state/reducer.ts):

- `ShapeData`を`RectangleData, EllipseData, LineData`のUnion型として再定義します。それぞれに必要なプロパティ（cx, ry, x1など）を定義してください。
- `AppState`に`currentTool: ShapeData['type']`プロパティを追加し、`initialState`では`'rectangle'`を初期値とします。
- `Action`型に`{ type: 'SELECT_TOOL'; payload: ShapeData['type'] }`を追加します。

2. Reducerのロジック拡張 (src/state/reducer.ts):

- `SELECT_TOOL`アクションを処理する`case`を追加し、`state.currentTool`を更新するようにします。
- `END_DRAWING`のロジックを修正し、`state.currentTool`の値を見て、適切な型の図形オブジェクト（長方形、楕円、または線）を生成し、`shapes`配列に追加するように変更してください。

3. ツールバーのUI実装 (Toolbar.tsx):

- 長方形、楕円、線の3つのボタンを追加します。
- `App.tsx`から`currentTool`と`onToolSelect`(ツール選択時にActionをdispatchする関数) をPropsとして受け取ります。
- `currentTool`の値と各ボタンを比較し、選択中のボタンに`active`などのCSSクラスを付与して見た目を変えてください。

4. 描画プレビューの更新 (SvgCanvas.tsx):

- 現在はドラッグ中に破線の長方形を描画していますが、ここも`currentTool`に応じて楕円や線がプレビューされるようにロジックを拡張してください。

5. 図形コンポーネントの汎用化 (Shape.tsx):

- `shape.type`に基づいてレンダリングを切り替える`switch`文を実装します。各`case`で`<rect>, <ellipse>, <line>`をそれぞれのプロパティ（x, width, cx, rx, x1など）を使って正しく描画してください。

6. テストコードの更新:

- `src/state/reducer.test.ts`と`src/state/historyReducer.test.ts`を開き、新しい図形の追加やツールの選択に関するテストケースを追加・修正してください。

Jules、以下のステップで実装を進めてください。

#### 1\. 起動コマンドの追加 (`package.json`)

デバッグモードで開発サーバーを起動するための新しいnpmスクリプトを追加します。このコマンドは、デバッグモードを有効にするための環境変数を設定します。

**`package.json` の `scripts` を以下のように更新してください:**

```json:package.json
"scripts": {
  "dev": "vite",
  "dev:debug": "vite --mode debug", // この行を追加
  "build": "tsc -b && vite build",
  // ... (他のスクリプト)
},
```

  * `vite --mode debug` とすることで、Viteは `.env.debug` という名前のファイルを読み込むようになります。

#### 2\. デバッグモード用の環境変数ファイルを作成

プロジェクトのルートに `.env.debug` という名前で新しいファイルを作成し、デバッグ機能を有効にするための変数を定義します。

**`.env.debug` (新規作成):**

```
VITE_DEBUG_MODE=true
```

#### 3\. デバッグ機能の有効化条件を変更

`logger` の適用と `DebugInfo` コンポーネントの表示条件を、`process.env.NODE_ENV` から新しい環境変数 `import.meta.env.VITE_DEBUG_MODE` を見るように変更します。

**`App.tsx` の修正:**

```typescript:src/app.tsx
// ... (import文)

const undoableReducer = undoable(reducer);
// デバッグモードが有効な場合のみロガーを適用
const rootReducer = import.meta.env.VITE_DEBUG_MODE === 'true'
    ? logger(undoableReducer)
    : undoableReducer;

function App() {
    // ...
}
```

**`DebugInfo.tsx` の修正:**

```tsx:src/components/debuginfo.tsx
// ...

const DebugInfo: React.FC<DebugInfoProps> = ({ history }) => {
  // VITE_DEBUG_MODEが'true'でない場合は何もレンダリングしない
  if (import.meta.env.VITE_DEBUG_MODE !== 'true') {
    return null;
  }

  // ... (以降のコードは変更なし)
};
```

-----

### 使い方

以上の修正により、開発サーバーの起動方法でデバッグ機能のON/OFFを切り替えられるようになります。

  * **通常モードで起動（デバッグ機能OFF）:**

    ```bash
    pnpm run dev
    ```

  * **デバッグモードで起動（ログ出力と状態ビューアON）:**

    ```bash
    pnpm run dev:debug
    ```

この方法は、Viteの標準的な機能を利用しているため、シンプルでメンテナンスしやすいのでおすすめです。
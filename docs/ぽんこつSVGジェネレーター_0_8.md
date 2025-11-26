# ぽんこつSVGジェネレーター (v0.8 - 図形の回転機能)

### **プロジェクト概要:**

既存の「移動」「描画」機能に加え、**「図形の回転」** 機能を実装します。
画面を煩雑にしないため、明示的な回転ハンドルは表示せず、**「図形の四隅にマウスを近づけたとき」**に回転モードへ移行する「プロキシミティ（近接）UI」を採用します。

### **前提条件:**

  * 現在のコードベースには、`src/hooks/useInteractionManager.ts` による集約されたイベント管理システムが導入されています。本機能もこのフックを拡張して実装します。
  * **拡大縮小（リサイズ）機能はまだ実装されていません**が、将来的な実装を見越して、回転の判定領域は「角の少し外側」に設けます。

-----

### **機能要件:**

#### 1\. データ構造の拡張

  * **`ShapeData` 型:**
      * 全ての図形共通で `rotation: number` (単位: 度, default: 0) プロパティを追加します。
  * **`AppState` 型:**
      * `mode` に `'rotating'` を追加します。
      * `rotatingState` を追加し、回転操作中の初期状態（開始角度、元の図形の角度など）を保持します。

#### 2\. インタラクション仕様 (Proximity UI)

  * **マウスオーバー時のカーソル変化:**
      * 図形が選択されている状態で、マウスカーソルが **「図形のバウンディングボックスの四隅」から一定距離（例: 10px〜30px）の外側** にある場合、カーソルを回転アイコン（`url(...)` または標準の `alias` や `context-menu` 等で代用）に変更します。
  * **回転操作:**
      * 上記エリアでドラッグを開始すると、回転モードに入ります。
      * 図形の **中心点（Centroid）** を軸として回転します。
      * **相対回転計算:** ドラッグ開始時のマウス角度と現在のマウス角度の「差分」を図形の初期角度に加算します（いきなりマウスの方向にジャンプしないようにするため）。
  * **スナップ機能:**
      * `Shift` キーを押しながらドラッグしている間は、角度を15度刻みにスナップ（吸着）させます。

-----

### **実装ステップ:**

Jules、以下の手順で実装を進めてください。

#### 1\. 型定義とStateの更新 (`src/types.ts`, `src/state/reducer.ts`)

  * **`src/types.ts`**:

      * `ShapeData` (Rectangle, Ellipse, Line, Text) の定義に `rotation: number` を追加してください。
      * `AppState` に `rotatingState` を定義します。
        ```typescript
        rotatingState: {
          shapeId: string;
          centerX: number;
          centerY: number;
          startMouseAngle: number; // ドラッグ開始時のマウスの角度 (ラジアン)
          initialShapeRotation: number; // ドラッグ開始時の図形の回転角 (度)
        } | null;
        ```
      * `Action` 型に `START_ROTATING`, `ROTATE_SHAPE`, `STOP_ROTATING` を追加します。

  * **`src/state/reducer.ts`**:

      * `ADD_SHAPE` (または `END_DRAWING`) 時の新規図形生成ロジックで、`rotation: 0` を初期値として設定します。
      * 新しいアクションの処理を追加します。
          * `ROTATE_SHAPE`: ペイロードの角度で対象図形を更新します。

#### 2\. 回転ロジックの実装 (`src/hooks/useInteractionManager.ts`)

このタスクの最難関部分です。既存の `handleMouseDown`, `handleMouseMove` を拡張します。

  * **ヘルパー関数の作成:**

      * `getCursorStyle(shape, mouseX, mouseY)`: マウス位置が図形の「回転領域（四隅の近傍）」にあるかどうかを判定し、適切なカーソルスタイル（またはモード）を返す関数を作成します。
      * **判定ロジック:**
        1.  図形の中心座標 $(Cx, Cy)$ とサイズ $(W, H)$ を取得。
        2.  図形の回転を考慮し、マウス座標を「図形のローカル座標系」に逆回転させてマッピングすると計算が容易になりますが、今回は簡易的に **「AABB（軸平行境界ボックス）の四隅」からの距離** で判定しても構いません。
        3.  四隅の座標から `10px < 距離 < 30px` の範囲にあれば「回転可能」とみなします。

  * **イベントハンドラの拡張:**

      * `handleMouseMove` (Idle時): カーソル位置を監視し、回転可能な領域にいる場合、`document.body.style.cursor` を変更してユーザーにフィードバックを与えます。
      * `handleMouseDown`: クリックされた位置が「回転領域」であれば、`START_ROTATING` を dispatch します。
          * この時、`Math.atan2(mouseY - centerY, mouseX - centerX)` を使用して、中心から見たマウスの角度（ラジアン）を計算し、`startMouseAngle` として保存します。
      * `handleMouseMove` (Rotating時):
          * 現在のマウス角度を `Math.atan2` で計算します。
          * `新しい角度 = 初期図形角度 + (現在のマウス角度 - 開始時マウス角度) * (180 / Math.PI)`
          * **Shiftキー対応:** `e.shiftKey` が true の場合、計算結果を15度刻みに丸めます。

#### 3\. レンダリングの更新 (`src/components/Shape.tsx`)

  * SVG要素の属性に `transform` を適用します。
  * SVGの回転は `rotate(angle, cx, cy)` で指定します。
      * **Rectangle / Text:** `cx = x + width/2`, `cy = y + height/2`
      * **Ellipse:** `cx`, `cy` そのもの
      * **Line:** `cx = (x1 + x2) / 2`, `cy = (y1 + y2) / 2`
  * **注意:** `<g>` 要素に `transform` を適用する場合、クリック判定用のヒットボックスと描画用の図形の両方が正しく回転することを確認してください。

#### 4\. 既存機能への影響確認

  * **ドラッグ移動 (`useDragging` ロジック):**
      * 回転した図形をドラッグ移動する場合、見た目の位置と実際の座標データが乖離しないか注意が必要です（SVGのtransformは座標系そのものを回転させるため）。今回は `x, y` の更新だけで問題ないはずですが、挙動を確認してください。
  * **リファクタリングの影響:**
      * 前回の修正で `data-shape-id` を親の `<g>` に移動しました。回転もこの `<g>` に対して適用するのが最も自然です。

-----

### **技術的な補足 (Julesへのメモ):**

マウス角度の計算には `Math.atan2(dy, dx)` を使用します。この関数は $-\pi$ から $\pi$ の値を返します。
回転角度の適用計算式は以下の通りです：

```typescript
const currentMouseAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
const deltaAngleRad = currentMouseAngle - startMouseAngle;
const deltaAngleDeg = deltaAngleRad * (180 / Math.PI);
let newRotation = initialShapeRotation + deltaAngleDeg;

if (isShiftDown) {
  newRotation = Math.round(newRotation / 15) * 15;
}
```

これにより、0度またぎの問題（179度から-179度への変化など）を気にすることなく、自然な回転操作が実現できます。
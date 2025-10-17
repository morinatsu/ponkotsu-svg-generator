Julesの報告、そして断念に至った経緯、承知いたしました。彼の丁寧な報告からは、タスクに対する誠実さが伝わってきます。そして、彼をここまで追い詰めてしまったのは、私の指示書の書き方にも原因があったと反省しています。

Jules、君の分析能力が低いわけでは決してありません。ドラッグ＆ドロップの実装は、一見簡単そうに見えて、実は\*\*特有の「落とし穴」\*\*がある、経験豊富な開発者でも一度はハマる道です。君が直面した「根深いバグ」の正体は、まさにその典型的な落とし穴でした。

君が断念したブランチのコード、拝見しました。結論から言うと、君は**仕様の8割を完璧に理解し、正しく実装**していました。`reducer`の設計、Stateの拡張、アクションの定義、これらはすべて的確です。あと一歩、本当にあと一歩でした。

失敗の原因はたった一つ、\*\*「マウスイベントを監視する場所」\*\*の見誤りです。

この失敗は、君の能力不足ではなく、私の指示がその「落とし穴」の危険性を十分に伝えきれていなかったことに起因します。そこで、Julesが再挑戦するにあたり、その一点を重点的に、そしてより具体的に解説した改訂版の仕様書を用意しました。

これを使えば、今度こそ必ず成功します。自信を持って、もう一度取り組んでみてください。

-----

### **プロジェクト名:**

ぽんこつSVGジェネレーター (v0.7 改訂版 - 図形の移動機能)

### **プロジェクト概要:**

キャンバス上の図形を、マウスでドラッグ＆ドロップして移動できる機能を実装します。**マウスカーソルがキャンバスの外に出ても操作が途切れない、安定したドラッグ＆ドロップ**を実現することに焦点を当てます。

-----

### **実装ステップの提案:**

Jules、君が以前実装してくれた`reducer`のロジックはほぼ完璧です。今回は、そのロジックを呼び出す**イベント処理の部分**を、以下の手順で**専用のカスタムフック**として再構築することに集中してください。

#### 1\. 【最重要】`useDragging`フックの作成とイベントリスナーの登録

このタスクの心臓部です。マウスイベントの管理を`App.tsx`から完全に分離します。

**`src/hooks/useDragging.ts` という新しいファイルを作成し、以下のコードを記述してください。**

```typescript:src/hooks/usedragging.ts
import { useEffect, useCallback } from 'react';
import type { Action, AppState } from '../state/reducer';

export const useDragging = (
  dispatch: React.Dispatch<Action>,
  mode: AppState['mode'],
  svgRef: React.RefObject<SVGSVGElement>
) => {

  // マウスの移動を処理する関数
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // マウス座標を取得するロジックはuseDrawing.tsからコピーする
    if (svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        const mouseX = (e.clientX - CTM.e) / CTM.a;
        const mouseY = (e.clientY - CTM.f) / CTM.d;
        dispatch({ type: 'DRAG_SHAPE', payload: { x: mouseX, y: mouseY } });
      }
    }
  }, [dispatch, svgRef]);

  // ドラッグ終了を処理する関数
  const handleMouseUp = useCallback(() => {
    dispatch({ type: 'STOP_DRAGGING' });
  }, [dispatch]);

  // ★★★ このuseEffectが最も重要なポイントです ★★★
  useEffect(() => {
    // アプリのモードが 'dragging' の間だけ、windowに対してイベントリスナーを登録する
    if (mode === 'dragging') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // クリーンアップ関数: コンポーネントが不要になったり、
    // modeが'dragging'でなくなったりした時に、リスナーを必ず解除する
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, handleMouseMove, handleMouseUp]);

  // 図形の上でmousedownされた時に呼ばれる関数
  const handleMouseDownOnShape = (shapeId: string, e: React.MouseEvent) => {
    if (svgRef.current) {
        // マウス座標とオフセット計算
        const CTM = svgRef.current.getScreenCTM();
        if (CTM) {
            const mouseX = (e.clientX - CTM.e) / CTM.a;
            const mouseY = (e.clientY - CTM.f) / CTM.d;
            dispatch({
                type: 'START_DRAGGING',
                payload: { shapeId, mouseX, mouseY },
            });
        }
    }
  };

  return { handleMouseDownOnShape };
};
```

#### 2\. `reducer.ts` の微修正

`START_DRAGGING`アクションが、図形の初期位置を元にオフセットを計算できるように、少しだけペイロードを修正します。

**`src/state/reducer.ts` を修正:**

```typescript:src/state/reducer.ts
// Action型定義を修正
// | { type: 'START_DRAGGING'; payload: { shapeId: string } }
   | { type: 'START_DRAGGING'; payload: { shapeId: string; mouseX: number; mouseY: number } }
   | { type: 'DRAG_SHAPE'; payload: { x: number; y: number } }

// reducer内のcase 'START_DRAGGING'を修正
case 'START_DRAGGING': {
    const shape = state.shapes.find(s => s.id === action.payload.shapeId);
    if (!shape) return state;

    let offsetX = 0;
    let offsetY = 0;

    // 図形の種類によって座標の基準が違うため、オフセットの計算方法を分岐
    if (shape.type === 'rectangle' || shape.type === 'text') {
        offsetX = action.payload.mouseX - shape.x;
        offsetY = action.payload.mouseY - shape.y;
    } else if (shape.type === 'ellipse') {
        offsetX = action.payload.mouseX - shape.cx;
        offsetY = action.payload.mouseY - shape.cy;
    } else if (shape.type === 'line') {
        //線の場合は特殊なため、一旦移動開始点のみ記録
        offsetX = action.payload.mouseX;
        offsetY = action.payload.mouseY;
    }

    return {
        ...state,
        mode: 'dragging',
        draggingState: {
            shapeId: action.payload.shapeId,
            startX: action.payload.mouseX,
            startY: action.payload.mouseY,
            offsetX,
            offsetY,
        },
    };
}
```

#### 3\. `App.tsx` と `Shape.tsx` の接続

`App.tsx`から`useDragging`フックを呼び出し、`Shape.tsx`の`onMouseDown`に接続します。これで`App.tsx`はシンプルになります。

**`App.tsx` を修正:**

```tsx:src/app.tsx
// ... (import文)
import { useDragging } from './hooks/useDragging'; // 新しいフックをインポート

function App() {
  // ... (state, dispatch, 他フックの呼び出し)
  const { mode } = state.present; // modeを取得

  // useDraggingフックを呼び出す
  const { handleMouseDownOnShape } = useDragging(dispatch, mode, svgRef);

  // ... (他のハンドラ)

  return (
    <div className="App">
      {/* ... (Toolbar) */}
      <SvgCanvas
        // ... (他のprops)
        onShapeMouseDown={handleMouseDownOnShape} // 新しいpropを渡す
      />
      {/* ... (DebugInfo) */}
    </div>
  );
}
```

**`SvgCanvas.tsx` と `Shape.tsx` を修正:**

  * `App.tsx`から`onShapeMouseDown`を`SvgCanvas`経由で`Shape`コンポーネントまで渡します。
  * `Shape.tsx`内の各SVG要素（`<rect>`など）の`onMouseDown`イベントで、渡された`onShapeMouseDown(shape.id, e)`を呼び出すようにしてください。

この改訂版の指示書は、君がつまずいた根本原因である\*\*「グローバルなイベント監視」\*\*を、Reactの流儀に沿ったカスタムフックという形で明確に示しました。これなら、もう迷うことはありません。

君のこれまでの実装は決して無駄ではなかった。さあ、この最後のピースをはめて、機能を完成させましょう！
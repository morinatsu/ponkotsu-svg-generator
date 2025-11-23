### **リファクタリング提案 2a: 起動時クラッシュとドラッグ不具合の緊急修正**

### **目的**

`refactor/drag-performance` ブランチで発生している、アプリケーションが起動せずに画面が真っ白になる致命的な問題と、その先に潜んでいたドラッグ操作の視覚的な不具合を修正します。これにより、パフォーマンスリファクタリングの本来の目的である、滑らかなドラッグ＆ドロップ操作を実現可能な状態に戻します。

### **現状の問題点**

#### 1\. 起動時のクラッシュ (`ReferenceError`)

  - **原因**: `src/hooks/useInteractionManager.ts` 内で、`handleMouseUp` 関数が定義されるよりも前に `handleMouseMove` 関数内から呼び出されているため、初期化エラー (`ReferenceError`) が発生しています。これがReactのレンダリングプロセスを完全に停止させ、画面が真っ白になる直接の原因です。

#### 2\. ドラッグ操作の視覚的な不整合

  - **原因**: `src/components/Shape.tsx` の実装において、ドラッグ対象を識別するための `data-shape-id` 属性が、実際に表示されている図形ではなく、透明なクリック判定用の要素（ヒットボックス）に付与されています。これにより、ドラッグ中にCSSの `transform` が適用されても、ユーザーには何も動いていないように見え、深刻な不整合を引き起こします。

-----

### **修正ステップ**

以下の2つのステップを順に実行し、問題を根本から解決してください。

#### **ステップ1: `useInteractionManager.ts` の関数定義順序を修正する**

`handleMouseUp` が `handleMouseMove` よりも先に定義されるように、コードの順序を入れ替えます。これにより起動時のクラッシュが解消されます。

**`src/hooks/useInteractionManager.ts` を以下の内容に置き換えてください。**

```typescript:src/hooks/useinteractionmanager.ts
import { useCallback, useEffect, useRef } from 'react';
import type { Action, AppState } from '../state/reducer';

export const useInteractionManager = (
  dispatch: React.Dispatch<Action>,
  state: AppState,
  svgRef: React.RefObject<SVGSVGElement>,
  wasDragged: React.MutableRefObject<boolean>
) => {
  const { mode, currentTool, drawingState, draggingState } = state;
  const dragTranslationRef = useRef({ dx: 0, dy: 0 });

  const getMousePosition = useCallback((e: React.MouseEvent | MouseEvent): { x: number, y: number } => {
    if (svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        return {
          x: (e.clientX - CTM.e) / CTM.a,
          y: (e.clientY - CTM.f) / CTM.d
        };
      }
    }
    return { x: 0, y: 0 };
  }, [svgRef]);

  // ★ 修正点: handleMouseUp の定義を handleMouseMove の前に移動
  const handleMouseUp = useCallback(() => {
    if (mode === 'drawing') {
      dispatch({ type: 'END_DRAWING' });
    } else if (mode === 'dragging' && draggingState) {
      const elementToDrag = svgRef.current?.querySelector<SVGGraphicsElement>(`[data-shape-id="${draggingState.shapeId}"]`);
      if (elementToDrag) {
        elementToDrag.style.transform = '';
      }

      dispatch({
        type: 'STOP_DRAGGING',
        payload: dragTranslationRef.current,
      });
    }
  }, [dispatch, mode, draggingState, svgRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'idle') return;
    wasDragged.current = false;
    const targetElement = e.target as SVGElement;
    const shapeId = targetElement.getAttribute('data-shape-id') || targetElement.closest('g[data-shape-id]')?.getAttribute('data-shape-id');
    const pos = getMousePosition(e);

    if (shapeId) {
      e.stopPropagation();
      dispatch({
          type: 'START_DRAGGING',
          payload: { shapeId, mouseX: pos.x, mouseY: pos.y },
      });
    } else {
      if (currentTool === 'text') {
        dispatch({
          type: 'START_TEXT_EDIT',
          payload: { id: null, x: pos.x, y: pos.y, content: '' },
        });
      } else {
        dispatch({ type: 'START_DRAWING', payload: pos });
      }
    }
  }, [dispatch, getMousePosition, mode, currentTool, wasDragged]);

  // ★ 修正点: handleMouseMove の定義を handleMouseUp の後に配置
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (mode === 'idle' || !e.buttons) {
        if (mode !== 'idle') {
            handleMouseUp();
        }
        return;
    }

    const pos = getMousePosition(e);
    wasDragged.current = true;

    if (mode === 'drawing') {
      if (drawingState?.x !== undefined && drawingState?.y !== undefined) {
        dispatch({
          type: 'DRAWING',
          payload: { x: pos.x, y: pos.y, startX: drawingState.x, startY: drawingState.y },
        });
      }
    } else if (mode === 'dragging' && draggingState) {
      const dx = pos.x - draggingState.startX;
      const dy = pos.y - draggingState.startY;
      dragTranslationRef.current = { dx, dy };

      const elementToDrag = svgRef.current?.querySelector<SVGGraphicsElement>(`[data-shape-id="${draggingState.shapeId}"]`);
      if (elementToDrag) {
        elementToDrag.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    }
  }, [getMousePosition, mode, wasDragged, drawingState, draggingState, svgRef, handleMouseUp]);


  useEffect(() => {
    if (mode === 'drawing' || mode === 'dragging') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, handleMouseMove, handleMouseUp]);

  return { handleMouseDown };
};
```

#### **ステップ2: `Shape.tsx` の `data-shape-id` とイベントハンドラを親要素に集約する**

`data-shape-id` 属性とイベントハンドラを、各図形を囲む親の `<g>` 要素に集約します。これにより、ドラッグ操作が視覚表示と正しく連動するようになります。

**`src/components/Shape.tsx` を以下の内容に置き換えてください。**

```tsx:src/components/shape.tsx
import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isDragging: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, isDragging, onClick, onDoubleClick }) => {
  const commonProps = {
    strokeWidth: 2,
    style: { cursor: 'grab', pointerEvents: isDragging ? 'none' : 'all' as const },
  };

  // ★ 修正点: イベントハンドラとIDを<g>要素に集約
  const groupProps = {
    onClick: onClick,
    onDoubleClick: onDoubleClick,
    'data-shape-id': shape.id,
    style: { cursor: 'grab' },
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <g {...groupProps}>
          <rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={commonProps.strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
          />
        </g>
      );
    case 'ellipse':
      return (
        <g {...groupProps}>
          <ellipse
            key={shape.id}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={commonProps.strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
          <ellipse
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            strokeWidth={10}
            stroke="transparent"
            fill="none"
          />
        </g>
      );
    case 'line':
      return (
        <g {...groupProps}>
          <line
            key={shape.id}
            x1={shape.x1}
            y1={shape.y1}
            x2={shape.x2}
            y2={shape.y2}
            stroke={isSelected ? 'blue' : 'black'}
            {...commonProps}
          />
        </g>
      );
    case 'text': {
      const lines = shape.content.split('\n');
      const lineHeight = shape.fontSize * 1.2;
      return (
        <g {...groupProps}>
          <text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fill={isSelected ? 'blue' : shape.fill}
            stroke="none"
            style={{ cursor: 'grab', userSelect: 'none' }}
          >
            {lines.map((line, index) => (
              <tspan key={index} x={shape.x} dy={index === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    }
    default: {
      const _exhaustiveCheck: never = shape;
      return null;
    }
  }
};

export default Shape;
```

-----

以上の修正を適用することで、アプリケーションは正常に起動し、かつ、意図通りに滑らかなドラッグ操作が可能になります。
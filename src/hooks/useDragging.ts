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
    e.stopPropagation(); // Prevent canvas mousedown from firing
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
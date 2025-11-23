import React, { useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { AppContext, type AppContextType } from './AppContext';
import { reducer, initialState } from './reducer';
import { undoable } from './historyReducer';
import { logger } from './logger';

const undoableReducer = undoable(reducer);
// Apply logger only in debug mode
const rootReducer =
  import.meta.env.VITE_DEBUG_MODE === 'true' ? logger(undoableReducer) : undoableReducer;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [historyState, dispatch] = useReducer(rootReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  // SVG要素への参照。エクスポート機能や座標計算に使用される。
  const svgRef = useRef<SVGSVGElement>(null);
  // ドラッグ操作が行われたかどうかを追跡するフラグ。
  // ドラッグ終了時にクリックイベントが発火して選択解除されるのを防ぐために使用。
  // 再描画を避けるためrefで管理。
  const wasDragged = useRef<boolean>(false);

  const value: AppContextType = {
    state: historyState.present,
    history: historyState,
    dispatch,
    wasDragged,
    svgRef,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

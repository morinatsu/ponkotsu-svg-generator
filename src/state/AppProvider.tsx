import React, { useReducer, useRef, useMemo } from 'react';
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

  // Reference to the SVG element. Used for export functionality and coordinate calculations.
  const svgRef = useRef<SVGSVGElement>(null);
  // Flag to track whether a drag operation occurred.
  // Used to prevent the click event from firing and deselecting the shape after a drag ends.
  // Managed with a ref to avoid re-renders.
  const wasDraggedRef = useRef<boolean>(false);

  const value: AppContextType = useMemo(
    () => ({
      state: historyState.present,
      history: historyState,
      dispatch,
      wasDraggedRef,
      svgRef,
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
    }),
    [historyState, dispatch, wasDraggedRef, svgRef],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

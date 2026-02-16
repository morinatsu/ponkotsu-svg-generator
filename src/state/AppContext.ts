import { createContext } from 'react';
import type { Dispatch, RefObject, MutableRefObject } from 'react';
import type { AppState } from '../types';
import type { HistoryAction, HistoryState } from './historyReducer';

export interface AppContextType {
  state: AppState;
  history: HistoryState;
  dispatch: Dispatch<HistoryAction>;
  wasDraggedRef: MutableRefObject<boolean>;
  svgRef: RefObject<SVGSVGElement | null>;
  canUndo: boolean;
  canRedo: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

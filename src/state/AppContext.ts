import { createContext } from 'react';
import type { Dispatch, RefObject } from 'react';
import type { AppState } from '../types';
import type { HistoryAction, HistoryState } from './historyReducer';

export interface AppContextType {
  state: AppState;
  history: HistoryState;
  dispatch: Dispatch<HistoryAction>;
  wasDragged: RefObject<boolean>;
  svgRef: RefObject<SVGSVGElement | null>;
  canUndo: boolean;
  canRedo: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

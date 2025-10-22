import { createContext } from 'react';
import type { Dispatch, RefObject } from 'react';
import type { AppState } from './reducer';
import type { HistoryAction } from './historyReducer';

export interface AppContextType {
  state: AppState;
  dispatch: Dispatch<HistoryAction>;
  wasDragged: RefObject<boolean>;
}

export const AppContext = createContext<AppContextType | null>(null);

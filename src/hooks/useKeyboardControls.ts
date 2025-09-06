import { useEffect } from 'react';
import type { Action } from '../state/reducer';

export const useKeyboardControls = (
  dispatch: React.Dispatch<Action>,
  selectedShapeId: string | null
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        dispatch({ type: 'DELETE_SELECTED_SHAPE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeId, dispatch]);
};

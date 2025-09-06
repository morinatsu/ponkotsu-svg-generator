import { useEffect } from 'react';

// Using a more generic dispatch type to accommodate undo/redo actions
export const useKeyboardControls = (
  dispatch: React.Dispatch<any>,
  selectedShapeId: string | null
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            dispatch({ type: 'REDO' });
          } else {
            dispatch({ type: 'UNDO' });
          }
          return;
        }
        if (e.key === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
          return;
        }
      }

      // Handle shape deletion
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

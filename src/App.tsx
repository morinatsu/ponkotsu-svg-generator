import React, { useContext } from 'react';
import Toolbar from './components/Toolbar';
import SvgCanvas from './components/SvgCanvas';
import DebugInfo from './components/DebugInfo';
import TextInputModal from './components/TextInputModal';
import CanvasSizeModal from './components/CanvasSizeModal';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useDragging } from './hooks/useDragging';
import { AppContext } from './state/AppContext';
import { AppProvider } from './state/AppProvider';
import './App.css';

/**
 * Main application content component.
 * It consumes AppContext and sets up event handlers and modal overlays.
 */
const AppContent: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('AppContent must be used within an AppContextProvider');
  }
  const { state, dispatch, history, svgRef } = context;
  const { editingText, selectedShapeId, mode, isCanvasInitialized, canvasWidth, canvasHeight } =
    state;

  // Set up global keyboard shortcuts (Undo, Redo, Delete)
  useKeyboardControls(dispatch, selectedShapeId);

  // Set up global drag-and-drop mouse handlers for shapes
  const { handleMouseDownOnShape } = useDragging(dispatch, mode, svgRef);

  return (
    <div className="App">
      <h1>ぽんこつSVGジェネレーター</h1>

      {/* Show initial canvas size setting dialog if not initialized */}
      {!isCanvasInitialized && (
        <CanvasSizeModal
          initialWidth={canvasWidth}
          initialHeight={canvasHeight}
          onConfirm={(width, height) => {
            dispatch({ type: 'SET_CANVAS_SIZE', payload: { width, height } });
          }}
        />
      )}

      <Toolbar />

      {/* SVG canvas workspace */}
      <SvgCanvas onShapeMouseDown={handleMouseDownOnShape} />

      {/* Debug console, rendered only when VITE_DEBUG_MODE is 'true' */}
      <DebugInfo history={history} />

      {/* Text creation / editing modal */}
      {editingText && (
        <TextInputModal
          initialContent={editingText.content}
          onOk={(content) => {
            dispatch({ type: 'FINISH_TEXT_EDIT', payload: { content } });
          }}
          onCancel={() => {
            dispatch({ type: 'CANCEL_TEXT_EDIT' });
          }}
        />
      )}
    </div>
  );
};

/**
 * Root App component wrapped with state provider.
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

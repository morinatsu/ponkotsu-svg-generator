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

const AppContent: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('AppContent must be used within an AppContextProvider');
  }
  const { state, dispatch, history, svgRef } = context;
  const { editingText, selectedShapeId, mode, isCanvasInitialized, canvasWidth, canvasHeight } = state;

  useKeyboardControls(dispatch, selectedShapeId);
  const { handleMouseDownOnShape } = useDragging(dispatch, mode, svgRef);

  return (
    <div className="App">
      <h1>ぽんこつSVGジェネレーター</h1>
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
      <SvgCanvas onShapeMouseDown={handleMouseDownOnShape} />
      <DebugInfo history={history} />

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

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

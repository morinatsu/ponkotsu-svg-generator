import { useReducer, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import SvgCanvas from './components/SvgCanvas';
import DebugInfo from './components/DebugInfo'; // Import DebugInfo
import TextInputModal from './components/TextInputModal'; // Import the modal
import { reducer, initialState, type Tool, type ShapeData } from './state/reducer';
import { undoable } from './state/historyReducer';
import { logger } from './state/logger'; // Import logger
import { useInteractionManager } from './hooks/useInteractionManager';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useSvgExport } from './hooks/useSvgExport';
import { AppContext } from './state/AppContext';
import './App.css';

const undoableReducer = undoable(reducer);
// Apply logger only in debug mode
const rootReducer = import.meta.env.VITE_DEBUG_MODE === 'true'
  ? logger(undoableReducer)
  : undoableReducer;

function App() {
  const [state, dispatch] = useReducer(rootReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const { shapes, selectedShapeId, drawingState, currentTool, editingText } = state.present;
  const svgRef = useRef<SVGSVGElement>(null);

  // This ref is used to prevent click events from firing after a drag operation.
  const wasDragged = useRef(false);

  // The new, unified interaction manager hook.
  const { handleMouseDown } = useInteractionManager(dispatch, state.present, svgRef, wasDragged);
  useKeyboardControls(dispatch, selectedShapeId);
  const { handleExport } = useSvgExport(svgRef);

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_SHAPE', payload: null });
  };

  return (
    <AppContext.Provider value={{ state: state.present, dispatch, wasDragged }}>
      <div className="App">
        <h1>ぽんこつSVGジェネレーター</h1>
        <Toolbar
          onExport={handleExport}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
        />
        <SvgCanvas
          ref={svgRef}
          onMouseDown={handleMouseDown}
          onCanvasClick={handleCanvasClick}
        />
        <DebugInfo history={state} />

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
    </AppContext.Provider>
  )
}

export default App

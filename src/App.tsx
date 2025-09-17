import { useReducer, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import SvgCanvas from './components/SvgCanvas';
import DebugInfo from './components/DebugInfo'; // Import DebugInfo
import TextInputModal from './components/TextInputModal'; // Import the modal
import { reducer, initialState, type Tool, type ShapeData } from './state/reducer';
import { undoable } from './state/historyReducer';
import { logger } from './state/logger'; // Import logger
import { useDrawing } from './hooks/useDrawing';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useSvgExport } from './hooks/useSvgExport';
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

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing(dispatch, svgRef, currentTool);
  useKeyboardControls(dispatch, selectedShapeId);
  const { handleExport } = useSvgExport(svgRef);

  const handleToolSelect = (tool: Tool) => {
    dispatch({ type: 'SELECT_TOOL', payload: tool });
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_CANVAS' });
  };

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_SHAPE', payload: null });
  };

  const handleShapeClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_SHAPE', payload: id });
  };

  const handleShapeDoubleClick = (shape: ShapeData) => {
    if (shape.type === 'text') {
      dispatch({
        type: 'START_TEXT_EDIT',
        payload: {
          id: shape.id,
          x: shape.x,
          y: shape.y,
          content: shape.content,
        },
      });
    }
  };

  return (
    <div className="App">
      <h1>ぽんこつSVGジェネレーター</h1>
      <Toolbar
        onClear={handleClear}
        onExport={handleExport}
        shapesCount={shapes.length}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        currentTool={currentTool}
        onToolSelect={handleToolSelect}
      />
      <SvgCanvas
        ref={svgRef}
        shapes={shapes}
        drawingState={drawingState}
        selectedShapeId={selectedShapeId}
        currentTool={currentTool}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onCanvasClick={handleCanvasClick}
        onShapeClick={handleShapeClick}
        onShapeDoubleClick={handleShapeDoubleClick}
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
  )
}

export default App

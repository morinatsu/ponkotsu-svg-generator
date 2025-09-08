import { useReducer, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import SvgCanvas from './components/SvgCanvas';
import { reducer, initialState } from './state/reducer';
import { undoable } from './state/historyReducer';
import { useDrawing } from './hooks/useDrawing';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useSvgExport } from './hooks/useSvgExport';
import './App.css'

// Type for a single shape data
export interface ShapeData {
  id: string; // Unique ID for each shape
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

const undoableReducer = undoable(reducer);

function App() {
  const [state, dispatch] = useReducer(undoableReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const { shapes, selectedShapeId, drawingState } = state.present;
  const svgRef = useRef<SVGSVGElement>(null);

  const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing(dispatch, svgRef);
  useKeyboardControls(dispatch, selectedShapeId);
  const { handleExport } = useSvgExport(svgRef);

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
      />
      <SvgCanvas
        ref={svgRef}
        shapes={shapes}
        drawingState={drawingState}
        selectedShapeId={selectedShapeId}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onCanvasClick={handleCanvasClick}
        onShapeClick={handleShapeClick}
      />
    </div>
  )
}

export default App

import { useReducer, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import SvgCanvas from './components/SvgCanvas';
import { reducer, initialState } from './state/reducer';
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

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { shapes, selectedShapeId, drawingState } = state;

  // Ref for the SVG element itself, used for getting mouse position and for export
  const svgRef = useRef<SVGSVGElement>(null);

  // Ref to track if the user is currently drawing
  const isDrawing = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });

  const getMousePosition = (e: React.MouseEvent): { x: number, y: number } => {
    if (svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        return {
          x: (e.clientX - CTM.e) / CTM.a,
          y: (e.clientY - CTM.f) / CTM.d
        };
      }
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drawing when clicking on an existing shape
    if ((e.target as SVGElement).closest('rect')) {
        return;
    }
    isDrawing.current = true;
    const pos = getMousePosition(e);
    startPoint.current = pos;
    dispatch({ type: 'START_DRAWING', payload: pos });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;

    const pos = getMousePosition(e);
    dispatch({
        type: 'DRAWING',
        payload: { x: pos.x, y: pos.y, startX: startPoint.current.x, startY: startPoint.current.y },
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    dispatch({ type: 'END_DRAWING' });
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_CANVAS' });
  };

  const handleExport = () => {
    if (svgRef.current) {
      // Create a clone of the SVG node to avoid modifying the one in the DOM
      const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement;

      // Add the required xmlns attribute for standalone SVG files
      svgNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Set a background color for the exported SVG
      svgNode.style.backgroundColor = 'white';

      const svgContent = svgNode.outerHTML;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ponkotsu.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_SHAPE', payload: null });
  };

  const handleShapeClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas click from firing
    dispatch({ type: 'SELECT_SHAPE', payload: id });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        dispatch({ type: 'DELETE_SELECTED_SHAPE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedShapeId]); // Dependency array ensures the effect re-runs if selectedShapeId changes

  return (
    <div className="App">
      <h1>ぽんこつSVGジェネレーター</h1>
      <Toolbar
        onClear={handleClear}
        onExport={handleExport}
        shapesCount={shapes.length}
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

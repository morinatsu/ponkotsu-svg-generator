import { useState, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import SvgCanvas from './components/SvgCanvas';
// import { SVG, Svg, Rect } from '@svgdotjs/svg.js'; // svg.js is no longer used for rendering
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
  // State to hold the data of created shapes
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  // State to hold the ID of the currently selected shape
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  // State to hold the shape currently being drawn
  const [drawingState, setDrawingState] = useState<ShapeData | null>(null);

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
    setDrawingState({
      id: 'drawing', // temporary ID
      type: 'rectangle',
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;

    const pos = getMousePosition(e);
    const x = Math.min(pos.x, startPoint.current.x);
    const y = Math.min(pos.y, startPoint.current.y);
    const width = Math.abs(pos.x - startPoint.current.x);
    const height = Math.abs(pos.y - startPoint.current.y);

    setDrawingState({
      id: 'drawing',
      type: 'rectangle',
      x,
      y,
      width,
      height,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !drawingState) return;

    isDrawing.current = false;

    if (drawingState.width > 0 && drawingState.height > 0) {
      // Add the new shape to the main state with a permanent, unique ID
      setShapes(prev => [...prev, { ...drawingState, id: crypto.randomUUID() }]);
    }

    // Clear the temporary drawing shape
    setDrawingState(null);
  };

  const handleClear = () => {
    setShapes([]);
    setSelectedShapeId(null); // Also clear selection
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
    setSelectedShapeId(null);
  };

  const handleShapeClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas click from firing
    setSelectedShapeId(id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        setShapes(prev => prev.filter(shape => shape.id !== selectedShapeId));
        setSelectedShapeId(null);
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

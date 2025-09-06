import { useState, useRef, useEffect } from 'react';
// import { SVG, Svg, Rect } from '@svgdotjs/svg.js'; // svg.js is no longer used for rendering
import './App.css'

// Type for a single rectangle data
interface RectangleData {
  id: string; // Unique ID for each rectangle
  x: number;
  y: number;
  width: number;
  height: number;
}

function App() {
  // State to hold the data of created rectangles
  const [rectangles, setRectangles] = useState<RectangleData[]>([]);
  // State to hold the ID of the currently selected shape
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  // State to hold the rectangle currently being drawn
  const [drawingState, setDrawingState] = useState<RectangleData | null>(null);

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
      // Add the new rectangle to the main state with a permanent, unique ID
      setRectangles(prev => [...prev, { ...drawingState, id: crypto.randomUUID() }]);
    }

    // Clear the temporary drawing rectangle
    setDrawingState(null);
  };

  const handleClear = () => {
    setRectangles([]);
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
        setRectangles(prev => prev.filter(rect => rect.id !== selectedShapeId));
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
      <div className="controls">
        <button onClick={handleClear}>クリア</button>
        <button onClick={handleExport} disabled={rectangles.length === 0}>エクスポート</button>
      </div>
      {/* SVG canvas is now rendered by React */}
      <svg
        ref={svgRef}
        width={800}
        height={600}
        style={{ border: '1px solid black' }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // End drawing if mouse leaves canvas
      >
        {rectangles.map((rect) => (
          <rect
            key={rect.id}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="none"
            stroke={selectedShapeId === rect.id ? 'blue' : 'black'}
            strokeWidth={2}
            onClick={(e) => handleShapeClick(rect.id, e)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        {/* Render the rectangle being currently drawn */}
        {drawingState && (
          <rect
            x={drawingState.x}
            y={drawingState.y}
            width={drawingState.width}
            height={drawingState.height}
            fill="none"
            stroke="black"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
        )}
      </svg>
    </div>
  )
}

export default App

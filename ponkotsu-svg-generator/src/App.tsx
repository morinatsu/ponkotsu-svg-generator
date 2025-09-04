import { useState, useRef, useEffect } from 'react';
import { SVG, Svg, Rect } from '@svgdotjs/svg.js';
import './App.css'

// Type for a single rectangle data
interface RectangleData {
  x: number;
  y: number;
  width: number;
  height: number;
}

function App() {
  // State to hold the data of created rectangles, for export purposes
  const [rectangles, setRectangles] = useState<RectangleData[]>([]);

  // Refs for SVG.js instance and container element
  const svgContainer = useRef<HTMLDivElement>(null);
  const draw = useRef<Svg | null>(null);

  // Refs for drawing logic
  const isDrawing = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const currentRect = useRef<Rect | null>(null);

  useEffect(() => {
    if (svgContainer.current && !draw.current) {
      // Initialize SVG.js canvas
      const svg = SVG().addTo(svgContainer.current).size(800, 600);
      draw.current = svg;

      // Attach event listeners
      svg.on('mousedown', handleMouseDown as EventListener);
      svg.on('mousemove', handleMouseMove as EventListener);
      svg.on('mouseup', handleMouseUp as EventListener);
      svg.on('mouseleave', handleMouseUp as EventListener);
    }
  }, []);

  const getMousePosition = (e: globalThis.MouseEvent): { x: number, y: number } => {
    if (draw.current) {
        const point = draw.current.point(e.clientX, e.clientY);
        return { x: point.x, y: point.y };
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = (e: globalThis.MouseEvent) => {
    isDrawing.current = true;
    const pos = getMousePosition(e);
    startPoint.current = pos;

    // Create a temporary rectangle with SVG.js
    currentRect.current = draw.current!.rect(0, 0)
      .move(pos.x, pos.y)
      .attr({
        fill: 'none',
        stroke: 'black',
      });
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isDrawing.current || !currentRect.current) return;

    const pos = getMousePosition(e);
    const x = Math.min(pos.x, startPoint.current.x);
    const y = Math.min(pos.y, startPoint.current.y);
    const width = Math.abs(pos.x - startPoint.current.x);
    const height = Math.abs(pos.y - startPoint.current.y);

    // Update the temporary rectangle's size and position
    currentRect.current.size(width, height).move(x, y);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentRect.current) return;

    isDrawing.current = false;
    const finalRect = currentRect.current;

    if (Number(finalRect.width()) > 0 && Number(finalRect.height()) > 0) {
      // Persist the rectangle data to our state
      setRectangles(prevRects => [...prevRects, {
        x: Number(finalRect.x()),
        y: Number(finalRect.y()),
        width: Number(finalRect.width()),
        height: Number(finalRect.height()),
      }]);
    } else {
      // If the rect has no size, remove it from the canvas
      finalRect.remove();
    }

    currentRect.current = null;
  };

  const handleClear = () => {
    if (draw.current) {
      draw.current.clear();
    }
    setRectangles([]);
  };

  const handleExport = () => {
    if (draw.current) {
      const svgContent = draw.current.svg();
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

  return (
    <div className="App">
      <h1>ぽんこつSVGジェネレーター</h1>
      <div className="controls">
        <button onClick={handleClear}>クリア</button>
        <button onClick={handleExport} disabled={rectangles.length === 0}>エクスポート</button>
      </div>
      {/* This div will contain the SVG.js canvas */}
      <div ref={svgContainer} style={{ width: 800, height: 600, border: '1px solid black' }}></div>
    </div>
  )
}

export default App

import { useState, MouseEvent } from 'react';
import './App.css'

// Type for a single rectangle
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Type for a point
interface Point {
  x: number;
  y: number;
}

function App() {
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);

  const getMousePosition = (e: MouseEvent<SVGSVGElement>): Point => {
    const svg = e.currentTarget;
    const CTM = svg.getScreenCTM();
    if (CTM) {
      return {
        x: (e.clientX - CTM.e) / CTM.a,
        y: (e.clientY - CTM.f) / CTM.d
      };
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    setIsDrawing(true);
    const pos = getMousePosition(e);
    setStartPoint(pos);
    setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPoint) return;

    const pos = getMousePosition(e);
    const x = Math.min(pos.x, startPoint.x);
    const y = Math.min(pos.y, startPoint.y);
    const width = Math.abs(pos.x - startPoint.x);
    const height = Math.abs(pos.y - startPoint.y);

    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(null);
    if (currentRect && currentRect.width > 0 && currentRect.height > 0) {
      setRectangles(prevRects => [...prevRects, currentRect]);
    }
    setCurrentRect(null);
  };

  const handleClear = () => {
    setRectangles([]);
  };

  const handleExport = () => {
    const svgContent = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      ${rectangles.map(rect =>
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="none" stroke="black" />`
      ).join('\n')}
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ponkotsu.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <h1>ぽんこつSVGジェネレーター</h1>
      <div className="controls">
        <button onClick={handleClear}>クリア</button>
        <button onClick={handleExport} disabled={rectangles.length === 0}>エクスポート</button>
      </div>
      <svg
        width="800"
        height="600"
        style={{ border: '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves canvas
      >
        {rectangles.map((rect, index) => (
          <rect
            key={index}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="none"
            stroke="black"
          />
        ))}
        {currentRect && (
          <rect
            x={currentRect.x}
            y={currentRect.y}
            width={currentRect.width}
            height={currentRect.height}
            fill="none"
            stroke="black"
            strokeDasharray="5,5" // Dashed line for the temporary rectangle
          />
        )}
      </svg>
    </div>
  )
}

export default App

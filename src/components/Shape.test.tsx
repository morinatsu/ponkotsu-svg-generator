// src/components/Shape.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import Shape from './Shape';
import type { RectangleData, EllipseData, LineData, TextData } from '../types';
import { AppContext } from '../state/AppContext';

// Mock context
const mockDispatch = vi.fn();
// We use a factory or reset it in beforeEach
const mockWasDragged = { current: false };

const renderShape = (shape: RectangleData | EllipseData | LineData | TextData, props = {}) => {
  return render(
    <AppContext.Provider value={{
        dispatch: mockDispatch,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        state: {} as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        history: {} as any,
        svgRef: { current: null },
        wasDragged: mockWasDragged,
        canUndo: false,
        canRedo: false,
    }}>
      <svg>
        <Shape
          shape={shape}
          isSelected={false}
          isDragging={false}
          isDrawingMode={false}
          onMouseDown={vi.fn()}
          {...props}
        />
      </svg>
    </AppContext.Provider>
  );
};

describe('Shape component', () => {
  beforeEach(() => {
      vi.clearAllMocks();
      mockWasDragged.current = false;
  });

  afterEach(() => {
      cleanup();
  });

  it('should render a rectangle', () => {
    const rect: RectangleData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 100, height: 50, rotation: 0 };
    renderShape(rect);

    // Check for the group
    const group = document.querySelector('[data-shape-id="1"]');
    expect(group).not.toBeNull();

    // Check for visible rect (strokeWidth=2)
    // There are two rects: one visible (strokeWidth=2) and one hitbox (strokeWidth=10)
    // We can just verify that 2 rects exist in the group
    const rects = group?.querySelectorAll('rect');
    expect(rects?.length).toBe(2);
  });

  it('should render an ellipse', () => {
      const ellipse: EllipseData = { id: '2', type: 'ellipse', cx: 50, cy: 50, rx: 20, ry: 10, rotation: 0 };
      renderShape(ellipse);
      const group = document.querySelector('[data-shape-id="2"]');
      expect(group).not.toBeNull();
      const ellipses = group?.querySelectorAll('ellipse');
      expect(ellipses?.length).toBe(2);
  });

  it('should render a line', () => {
      const line: LineData = { id: '3', type: 'line', x1: 0, y1: 0, x2: 10, y2: 10, rotation: 0 };
      renderShape(line);
      const group = document.querySelector('[data-shape-id="3"]');
      expect(group).not.toBeNull();
      const lines = group?.querySelectorAll('line');
      expect(lines?.length).toBe(2);
  });

  it('should render text', () => {
      const text: TextData = { id: '4', type: 'text', x: 0, y: 0, content: 'Hello', fontSize: 16, fill: 'black', fontFamily: 'serif' };
      renderShape(text);
      expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click to select', () => {
      const rect: RectangleData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 100, height: 50, rotation: 0 };
      renderShape(rect);

      const group = document.querySelector('[data-shape-id="1"]');
      if(group) {
          fireEvent.click(group);
          expect(mockDispatch).toHaveBeenCalledWith({ type: 'SELECT_SHAPE', payload: '1' });
      }
  });

  it('should not select if dragged', () => {
      const rect: RectangleData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 100, height: 50, rotation: 0 };
      mockWasDragged.current = true;
      renderShape(rect);

      const group = document.querySelector('[data-shape-id="1"]');
      expect(group).not.toBeNull();
      if(group) {
          fireEvent.click(group);
          expect(mockDispatch).not.toHaveBeenCalled();
          expect(mockWasDragged.current).toBe(false); // Should reset
      }
  });

  it('should render rotation zones when selected and rotated', () => {
       const rect: RectangleData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 100, height: 50, rotation: 45 };
       render(
        <AppContext.Provider value={{
            dispatch: mockDispatch,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state: {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            history: {} as any,
            svgRef: { current: null },
            wasDragged: mockWasDragged,
            canUndo: false,
            canRedo: false,
        }}>
          <svg>
            <Shape
              shape={rect}
              isSelected={true}
              isDragging={false}
              isDrawingMode={false}
              onMouseDown={vi.fn()}
            />
          </svg>
        </AppContext.Provider>
      );

      // Should find circles (rotation zones)
      const circles = document.querySelectorAll('circle');
      expect(circles.length).toBe(4);
  });
});

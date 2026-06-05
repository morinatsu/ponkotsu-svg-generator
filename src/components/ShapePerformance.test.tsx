import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Shape from './Shape';
import type { RectangleData } from '../types';
import { AppContext } from '../state/AppContext';
import React, { useState, useCallback, useMemo } from 'react';

const mockDispatch = vi.fn();
const mockWasDragged = { current: false };

let renderCount = 0;

vi.mock('./shapes/Rectangle', () => {
  return {
    default: () => {
      renderCount++;
      return <rect data-testid="mock-rect" />;
    },
  };
});

const BenchmarkComponent = () => {
  // Initialize shapes directly to avoid set-state-in-effect warning
  const initialShapes = useMemo(
    () =>
      Array.from({ length: 1000 }).map((_, i) => ({
        id: `shape-${i}`,
        type: 'rectangle' as const,
        x: i,
        y: i,
        width: 50,
        height: 50,
        rotation: 0,
      })),
    [],
  );

  const [shapes] = useState<RectangleData[]>(initialShapes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleUpdate = () => {
    setSelectedId('shape-500');
  };

  const handleMouseDown = useCallback(() => {
    // stable reference
  }, []);

  const contextValue = useMemo(
    () => ({
      dispatch: mockDispatch,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history: {} as any,
      svgRef: { current: null },
      wasDraggedRef: mockWasDragged,
      canUndo: false,
      canRedo: false,
    }),
    [],
  );

  return (
    <AppContext.Provider value={contextValue}>
      <button onClick={handleUpdate} data-testid="update-btn">
        Update
      </button>
      <svg>
        {shapes.map((shape) => (
          <Shape
            key={shape.id}
            shape={shape}
            isSelected={selectedId === shape.id}
            isDragging={false}
            isDrawingMode={false}
            onMouseDown={handleMouseDown}
          />
        ))}
      </svg>
    </AppContext.Provider>
  );
};

describe('Shape Performance Benchmark', () => {
  it('measures re-renders when updating a single shape selection', async () => {
    renderCount = 0;
    const { getByTestId, findAllByTestId } = render(<BenchmarkComponent />);

    // Wait for effect to finish rendering 1000 rects
    await findAllByTestId('mock-rect');

    // Initial render should have rendered each shape once (1000 times)
    expect(renderCount).toBeGreaterThanOrEqual(1000);

    // Reset counter to measure just the update
    renderCount = 0;
    const updateBtn = getByTestId('update-btn');

    const startTime = performance.now();
    fireEvent.click(updateBtn);
    const endTime = performance.now();

    const reRenders = renderCount;
    const duration = endTime - startTime;

    console.log(`[Benchmark] Updating selection triggered ${reRenders} shape re-renders`);
    console.log(`[Benchmark] Render time: ${duration.toFixed(2)}ms`);

    // With proper memoization, only the shape whose 'isSelected' changes should re-render
    // Since it goes from no selection to 1 selected shape, we expect exactly 1 re-render!
    expect(reRenders).toBe(1);
  });
});

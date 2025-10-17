import { renderHook, act } from '@testing-library/react';
import { useDrawing } from './useDrawing';
import { vi } from 'vitest';
import type { Action, Tool, AppMode } from '../state/reducer';

// Mock SVGElement and related methods
const mockGetScreenCTM = vi.fn(() => ({
  a: 1,
  d: 1,
  e: 0,
  f: 0,
}));

const mockClosest = vi.fn();

const mockSvgRef = {
  current: {
    getScreenCTM: mockGetScreenCTM,
  } as unknown as SVGSVGElement,
};

const createMockMouseEvent = (x: number, y: number, target?: EventTarget) =>
  ({
    clientX: x,
    clientY: y,
    target: target || { closest: mockClosest },
  } as React.MouseEvent);


describe('useDrawing', () => {
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatch = vi.fn();
    vi.clearAllMocks();
  });

  const renderDrawingHook = (initialProps: { tool: Tool; mode: AppMode }) => {
    return renderHook(({ tool, mode }) => useDrawing(dispatch, mockSvgRef, tool, mode), {
      initialProps,
    });
  };

  describe('handleMouseDown', () => {
    it('should not start drawing if mode is not "idle"', () => {
      const { result } = renderDrawingHook({ mode: 'drawing', tool: 'rect' });
      const event = createMockMouseEvent(10, 20);

      act(() => {
        result.current.handleMouseDown(event);
      });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should not start drawing if clicking on an existing shape', () => {
      const mockTarget = { closest: vi.fn().mockReturnValue(document.createElement('g')) };
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'rect' });
      const event = createMockMouseEvent(10, 20, mockTarget as any);

      act(() => {
        result.current.handleMouseDown(event);
      });

      expect(dispatch).not.toHaveBeenCalled();
      expect(mockTarget.closest).toHaveBeenCalledWith('g');
    });

    it('should dispatch START_TEXT_EDIT for text tool', () => {
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'text' });
      const event = createMockMouseEvent(50, 60);

      act(() => {
        result.current.handleMouseDown(event);
      });

      expect(dispatch).toHaveBeenCalledWith({
        type: 'START_TEXT_EDIT',
        payload: { id: null, x: 50, y: 60, content: '' },
      });
    });

    it('should dispatch START_DRAWING for a drawing tool', () => {
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'rect' });
      const event = createMockMouseEvent(100, 110);

      act(() => {
        result.current.handleMouseDown(event);
      });

      expect(dispatch).toHaveBeenCalledWith({
        type: 'START_DRAWING',
        payload: { x: 100, y: 110 },
      });
    });
  });

  describe('handleMouseMove', () => {
    it('should not draw if not in drawing state', () => {
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'rect' });
      const event = createMockMouseEvent(10, 20);

      act(() => {
        result.current.handleMouseMove(event);
      });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should dispatch DRAWING when moving mouse while drawing', () => {
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'ellipse' });
      const startEvent = createMockMouseEvent(100, 110);
      const moveEvent = createMockMouseEvent(120, 130);

      act(() => {
        result.current.handleMouseDown(startEvent);
      });
      
      dispatch.mockClear(); // Clear mock from mouseDown

      act(() => {
        result.current.handleMouseMove(moveEvent);
      });

      expect(dispatch).toHaveBeenCalledWith({
        type: 'DRAWING',
        payload: { x: 120, y: 130, startX: 100, startY: 110 },
      });
    });
  });

  describe('handleMouseUp', () => {
    it('should not end drawing if not in drawing state', () => {
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'rect' });

      act(() => {
        result.current.handleMouseUp();
      });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should dispatch END_DRAWING when mouse is up after drawing', () => {
      const { result } = renderDrawingHook({ mode: 'idle', tool: 'rect' });
      const startEvent = createMockMouseEvent(100, 110);

      act(() => {
        result.current.handleMouseDown(startEvent);
      });

      dispatch.mockClear(); // Clear mock from mouseDown

      act(() => {
        result.current.handleMouseUp();
      });

      expect(dispatch).toHaveBeenCalledWith({ type: 'END_DRAWING' });
    });
  });
});
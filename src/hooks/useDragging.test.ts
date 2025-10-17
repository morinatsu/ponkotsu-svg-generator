import { renderHook, act } from '@testing-library/react';
import { useDragging } from './useDragging';
import { vi } from 'vitest';
import type { Action, AppState } from '../state/reducer';

// Mocks
const mockGetScreenCTM = vi.fn(() => ({ a: 1, d: 1, e: 0, f: 0 }));
const mockSvgRef = {
  current: { getScreenCTM: mockGetScreenCTM } as unknown as SVGSVGElement,
};
const createMockMouseEvent = (x: number, y: number) =>
  ({
    clientX: x,
    clientY: y,
    stopPropagation: vi.fn(),
  } as unknown as React.MouseEvent);

const createMockGlobalMouseEvent = (x: number, y: number) =>
  new MouseEvent('mousemove', { clientX: x, clientY: y });


describe('useDragging', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let wasDragged: React.MutableRefObject<boolean>;

  beforeEach(() => {
    dispatch = vi.fn();
    wasDragged = { current: false };
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
    vi.clearAllMocks();
  });

  const renderDraggingHook = (initialMode: AppState['mode']) => {
    return renderHook(({ mode }) => useDragging(dispatch, mode, mockSvgRef, wasDragged), {
      initialProps: { mode: initialMode },
    });
  };

  it('handleMouseDownOnShape should dispatch START_DRAGGING', () => {
    const { result } = renderDraggingHook('idle');
    const event = createMockMouseEvent(50, 60);

    act(() => {
      result.current.handleMouseDownOnShape('shape-1', event);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'START_DRAGGING',
      payload: { shapeId: 'shape-1', mouseX: 50, mouseY: 60 },
    });
  });

  describe('useEffect for event listeners', () => {
    it('should add event listeners when mode becomes "dragging"', () => {
      const { rerender } = renderDraggingHook('idle');
      expect(window.addEventListener).not.toHaveBeenCalled();

      rerender({ mode: 'dragging' });

      expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should remove event listeners when mode is not "dragging"', () => {
      const { rerender } = renderDraggingHook('dragging');
      rerender({ mode: 'idle' });

      expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderDraggingHook('dragging');
      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('global event handlers', () => {
    it('should dispatch DRAG_SHAPE on window mousemove when dragging', () => {
      renderDraggingHook('dragging');
      const event = createMockGlobalMouseEvent(100, 120);
      
      act(() => {
        window.dispatchEvent(event);
      });

      expect(wasDragged.current).toBe(true);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'DRAG_SHAPE',
        payload: { x: 100, y: 120 },
      });
    });

    it('should dispatch STOP_DRAGGING on window mouseup when dragging', () => {
      renderDraggingHook('dragging');
      const event = new MouseEvent('mouseup');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_DRAGGING' });
    });

    it('should not dispatch events if not in dragging mode', () => {
      renderDraggingHook('idle');
      const moveEvent = createMockGlobalMouseEvent(100, 120);
      const upEvent = new MouseEvent('mouseup');

      act(() => {
        window.dispatchEvent(moveEvent);
        window.dispatchEvent(upEvent);
      });

      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});

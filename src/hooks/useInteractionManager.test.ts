// src/hooks/useInteractionManager.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteractionManager } from './useInteractionManager';
import type { AppState } from '../types';
import * as geometry from '../utils/geometry';

// Mock dependencies
vi.mock('../utils/geometry', async (importOriginal) => {
  const actual = await importOriginal<typeof geometry>();
  return {
    ...actual,
    getResizeHandleAt: vi.fn(),
    getRotationHandleAt: vi.fn(),
    getShapeCenter: vi.fn(),
  };
});

describe('useInteractionManager', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let state: AppState;
  let svgRef: React.RefObject<SVGSVGElement | null>;
  let wasDragged: React.MutableRefObject<boolean>;
  let addEventListenerSpy: MockInstance;
  let svgAddEventListenerSpy: MockInstance;
  let svgRemoveEventListenerSpy: MockInstance;

  beforeEach(() => {
    dispatch = vi.fn();
    state = {
      canvasWidth: 800,
      canvasHeight: 600,
      isCanvasInitialized: true,
      shapes: [],
      selectedShapeId: null,
      drawingState: null,
      currentTool: 'rectangle',
      editingText: null,
      mode: 'idle',
      draggingState: null,
      shapesBeforeDrag: null,
      shapesBeforeRotation: null,
      rotatingState: null,
      resizingState: null,
    };

    // Create a mock SVG element with getScreenCTM
    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockSvg.getScreenCTM = vi.fn().mockReturnValue({
      a: 1, d: 1, e: 0, f: 0, // Identity matrix
    });

    // Mock add/removeEventListener on the SVG element
    svgAddEventListenerSpy = vi.spyOn(mockSvg, 'addEventListener');
    svgRemoveEventListenerSpy = vi.spyOn(mockSvg, 'removeEventListener');

    svgRef = { current: mockSvg };
    wasDragged = { current: false };

    // Mock global addEventListener
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should attach mousemove listener to SVG when mode is idle', () => {
    renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));
    expect(svgAddEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('should attach global listeners when mode is resizing', () => {
    state.mode = 'resizing';
    renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  it('should cleanup listeners on unmount', () => {
      const { unmount } = renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));
      unmount();
      expect(svgRemoveEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('should handle idle mouse move (check resize handle)', () => {
    state.selectedShapeId = '1';
    state.shapes = [{ id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, rotation: 0 }];

    // Mock getResizeHandleAt to return 'se'
    vi.mocked(geometry.getResizeHandleAt).mockReturnValue('se');

    renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

    // Simulate mousemove on SVG
    const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
    act(() => {
        svgRef.current?.dispatchEvent(event);
    });

    expect(geometry.getResizeHandleAt).toHaveBeenCalled();
    expect(document.body.style.cursor).toBe('nwse-resize');
  });

  it('should start resizing on mouse down if over handle', () => {
    state.selectedShapeId = '1';
    state.shapes = [{ id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, rotation: 0 }];

    vi.mocked(geometry.getResizeHandleAt).mockReturnValue('se');

    const { result } = renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

    // Call handleMouseDown manually or via event?
    // result.current.handleMouseDown is exposed.
    const event = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 100,
        target: svgRef.current,
    } as unknown as React.MouseEvent;

    act(() => {
        result.current.handleMouseDown(event);
    });

    expect(dispatch).toHaveBeenCalledWith({
        type: 'START_RESIZING',
        payload: expect.objectContaining({
            shapeId: '1',
            handle: 'se',
        })
    });
  });

  it('should dispatch RESIZE_SHAPE on mouse move when mode is resizing', () => {
    state.mode = 'resizing';
    state.resizingState = {
        shapeId: '1',
        handle: 'se',
        startX: 0,
        startY: 0,
        initialShape: { id: '1', type: 'rectangle', x:0, y:0, width:100, height:100, rotation:0}
    };

    renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

    // Find the mousemove handler passed to window.addEventListener
    // This is tricky as we just have the spy.
    // However, we can simulate window event.

    const event = new MouseEvent('mousemove', { clientX: 50, clientY: 50, buttons: 1 });

    act(() => {
        window.dispatchEvent(event);
    });

    expect(dispatch).toHaveBeenCalledWith({
        type: 'RESIZE_SHAPE',
        payload: expect.objectContaining({ x: 50, y: 50 })
    });
  });

  it('should stop resizing on mouse up', () => {
      state.mode = 'resizing';
      renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

      const event = new MouseEvent('mouseup');
      act(() => {
          window.dispatchEvent(event);
      });

      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_RESIZING' });
  });

  // Coverage: Start Rotation
  it('should start rotating on mouse down if over rotation handle', () => {
      state.selectedShapeId = '1';
      state.shapes = [{ id: '1', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, rotation: 0 }];

      vi.mocked(geometry.getResizeHandleAt).mockReturnValue(null);
      vi.mocked(geometry.getRotationHandleAt).mockReturnValue('nw');
      vi.mocked(geometry.getShapeCenter).mockReturnValue({x: 50, y: 50});

      const { result } = renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

      const event = {
          preventDefault: vi.fn(),
          clientX: 20, // NW area
          clientY: 20,
          target: svgRef.current,
      } as unknown as React.MouseEvent;

      act(() => {
          result.current.handleMouseDown(event);
      });

      expect(dispatch).toHaveBeenCalledWith({
          type: 'START_ROTATING',
          payload: expect.anything()
      });
  });

    // Coverage: Start Drawing
    it('should start drawing on mouse down if idle and no handles hit', () => {
        const { result } = renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

        const event = {
            preventDefault: vi.fn(),
            clientX: 200,
            clientY: 200,
            target: svgRef.current, // Target is SVG, not a shape
        } as unknown as React.MouseEvent;

        act(() => {
            result.current.handleMouseDown(event);
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: 'START_DRAWING',
            payload: expect.anything()
        });
    });

    // Coverage: Mouse move rotation
    it('should rotate shape on mouse move', () => {
        state.mode = 'rotating';
        state.rotatingState = {
            shapeId: '1',
            centerX: 50,
            centerY: 50,
            startMouseAngle: 0,
            initialShapeRotation: 0,
        };

        renderHook(() => useInteractionManager(dispatch, state, svgRef, wasDragged));

        const event = new MouseEvent('mousemove', { clientX: 50, clientY: 100, buttons: 1 }); // 90 degrees down

        act(() => {
            window.dispatchEvent(event);
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: 'ROTATE_SHAPE',
            payload: expect.anything() // Angle calculation involves atan2
        });
    });
});

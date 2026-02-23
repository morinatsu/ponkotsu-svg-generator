// src/state/reducers/resizingReducer.test.ts
import { describe, it, expect } from 'vitest';
import { resizingReducer } from './resizingReducer';
import type { AppState, Action, RectangleData, LineData, EllipseData } from '../../types';

const initialState: AppState = {
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

describe('resizingReducer', () => {
  it('should start resizing', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const action: Action = {
      type: 'START_RESIZING',
      payload: {
        shapeId: '1',
        handle: 'se',
        startX: 110,
        startY: 110,
        initialShape: rect,
      },
    };

    const newState = resizingReducer({ ...initialState, shapes: [rect] }, action);

    expect(newState.mode).toBe('resizing');
    expect(newState.resizingState).toEqual({
      shapeId: '1',
      handle: 'se',
      startX: 110,
      startY: 110,
      initialShape: rect,
    });
  });

  it('should stop resizing', () => {
    const state: AppState = {
      ...initialState,
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'se',
        startX: 0,
        startY: 0,
        initialShape: {
          id: '1',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          rotation: 0,
        },
      },
    };
    const action: Action = { type: 'STOP_RESIZING' };
    const newState = resizingReducer(state, action);
    expect(newState.mode).toBe('idle');
    expect(newState.resizingState).toBeNull();
  });

  it('should resize a rectangle (SE handle)', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'se',
        startX: 100,
        startY: 100,
        initialShape: rect,
      },
    };

    // Move mouse to (150, 150)
    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 150, y: 150, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBe(150);
    expect(newRect.height).toBe(150);
    expect(newRect.x).toBe(0);
    expect(newRect.y).toBe(0);
  });

  it('should resize a rectangle (NW handle)', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
    };
    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'nw',
        startX: 100,
        startY: 100,
        initialShape: rect,
      },
    };

    // Move mouse to (50, 50) -> should increase size and move x,y
    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 50, y: 50, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBe(150); // (200 - 50)
    expect(newRect.height).toBe(150);
    expect(newRect.x).toBe(50);
    expect(newRect.y).toBe(50);
  });

  it('should resize a rotated rectangle', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 45,
    };
    // Center is (50, 50)

    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'se', // Bottom-Right in unrotated space (50, 50)
        startX: 0, // irrelevant for the calculation logic as it uses initialShape
        startY: 0,
        initialShape: rect,
      },
    };

    // If we drag SE handle further along the diagonal.
    // SE in local is (50, 50).
    // Let's move it to local (100, 100).
    // In global (rotation 45), (100, 100) relative to center is:
    // x' = 100 cos 45 - 100 sin 45 = 0
    // y' = 100 sin 45 + 100 cos 45 = 141.42...
    // Global pos = Center(50, 50) + (0, 141.42) = (50, 191.42)

    // Let's use simpler numbers.
    // Move local SE x by +10 (to 60), y by 0 (still 50).
    // Local bounds: left -50, top -50, right 60, bottom 50.
    // New width = 110, New height = 100.
    // New local center = (5, 0).

    // Global position of new local center (5, 0) rotated 45 around original center (50, 50):
    // x' = 5 cos 45 - 0 = 3.535
    // y' = 5 sin 45 + 0 = 3.535
    // New global center = (53.535, 53.535)

    // Target Mouse Global:
    // Local (60, 50) -> Global
    // x' = 60 cos 45 - 50 sin 45 = 10 * 0.707 = 7.07
    // y' = 60 sin 45 + 50 cos 45 = 110 * 0.707 = 77.78
    // Global = (50+7.07, 50+77.78) = (57.07, 127.78)

    const mouseX = 57.0710678;
    const mouseY = 127.7817459;

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: mouseX, y: mouseY, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBeCloseTo(110);
    expect(newRect.height).toBeCloseTo(100);
    // Verify center shift
    const newCenterX = newRect.x + newRect.width / 2;
    const newCenterY = newRect.y + newRect.height / 2;
    expect(newCenterX).toBeCloseTo(53.5355);
    expect(newCenterY).toBeCloseTo(53.5355);
  });

  it('should resize a line (start handle)', () => {
    const line: LineData = {
      id: '1',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [line],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'start',
        startX: 0,
        startY: 0,
        initialShape: line,
      },
    };

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: -10, y: -20, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newLine = newState.shapes[0] as LineData;

    expect(newLine.x1).toBe(-10);
    expect(newLine.y1).toBe(-20);
    expect(newLine.x2).toBe(100); // Unchanged
  });

  it('should resize a line (end handle)', () => {
    const line: LineData = {
      id: '1',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [line],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'end',
        startX: 100,
        startY: 100,
        initialShape: line,
      },
    };

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 150, y: 150, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newLine = newState.shapes[0] as LineData;

    expect(newLine.x1).toBe(0); // Unchanged
    expect(newLine.x2).toBe(150);
    expect(newLine.y2).toBe(150);
  });

  it('should maintain aspect ratio when shift key is pressed (SE handle)', () => {
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50, // Aspect ratio 2:1
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'se',
        startX: 100,
        startY: 50,
        initialShape: rect,
      },
    };

    // Move mouse to (200, 200). Delta width=100, delta height=150.
    // Target would be 200x200.
    // But aspect ratio 2:1 must be maintained.
    // If we use width (200) as driver, height should be 100.
    // If we use height (200) as driver, width should be 400.
    // My implementation takes "larger change"?
    // Let's see the logic:
    // currentWidth=200, currentHeight=200.
    // currentWidth / aspect (200 / 2 = 100) vs currentHeight (200).
    // 100 < 200. So Height is the driver.
    // targetWidth = currentHeight * aspect = 200 * 2 = 400.
    // So result should be 400x200.

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 200, y: 200, shiftKey: true },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBe(400);
    expect(newRect.height).toBe(200);
  });

  it('should maintain aspect ratio when shift key is pressed (NW handle)', () => {
    // Test dragging NW to check if position updates correctly with aspect ratio
    const rect: RectangleData = {
      id: '1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100, // AR 1:1
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'nw',
        startX: 100,
        startY: 100,
        initialShape: rect,
      },
    };

    // Drag NW to (50, 80).
    // New Width=150, New Height=120.
    // AR 1:1.
    // 150 > 120. Width is driver.
    // Target height = 150.
    // Since it's NW, we adjust Top.
    // New Top = Bottom (200) - 150 = 50.
    // New Left = 50.
    // Result: x=50, y=50, w=150, h=150.

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 50, y: 80, shiftKey: true },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBe(150);
    expect(newRect.height).toBe(150);
    expect(newRect.x).toBe(50);
    expect(newRect.y).toBe(50);
  });

  it('should ignore text shapes (handled gracefully)', () => {
    // Text resizing is not supported by this reducer logic directly as per spec
    // but we should ensure it doesn't crash if passed somehow
    // actually the reducer logic checks for rect/ellipse/line types explicitly
    // and returns state for unknown.

    const state: AppState = {
      ...initialState,
      mode: 'resizing',
      resizingState: {
        shapeId: '1',
        handle: 'se',
        startX: 0,
        startY: 0,
        initialShape: {
          id: '1',
          type: 'text',
          x: 0,
          y: 0,
          content: 'a',
          fontSize: 10,
          fill: 'black',
          fontFamily: 'sans',
        },
      },
    };

    const action: Action = { type: 'RESIZE_SHAPE', payload: { x: 10, y: 10, shiftKey: false } };
    const newState = resizingReducer(state, action);
    expect(newState).toBe(state);
  });

  it('should resize an ellipse (SE handle)', () => {
    const ellipse: EllipseData = {
      id: '2',
      type: 'ellipse',
      cx: 100,
      cy: 100,
      rx: 50,
      ry: 50,
      rotation: 0,
    };
    const state: AppState = {
      ...initialState,
      shapes: [ellipse],
      mode: 'resizing',
      resizingState: {
        shapeId: '2',
        handle: 'se',
        startX: 150,
        startY: 150,
        initialShape: ellipse,
      },
    };

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 180, y: 160, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newEllipse = newState.shapes[0] as EllipseData;

    expect(newEllipse.rx).toBe(65);
    expect(newEllipse.cx).toBe(115);
    expect(newEllipse.ry).toBe(55);
    expect(newEllipse.cy).toBe(105);
  });

  it('should maintain aspect ratio when shift key is pressed (SW handle)', () => {
    const rect: RectangleData = {
      id: 'r3',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 50, // AR 2:1
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: 'r3',
        handle: 'sw',
        startX: 100,
        startY: 150,
        initialShape: rect,
      },
    };

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 0, y: 160, shiftKey: true },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBe(200);
    expect(newRect.height).toBe(100);
  });

  it('should maintain aspect ratio when shift key is pressed (NE handle)', () => {
    const rect: RectangleData = {
      id: 'r4',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 50,
      height: 100, // AR 1:2
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: 'r4',
        handle: 'ne',
        startX: 150,
        startY: 100,
        initialShape: rect,
      },
    };

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 200, y: 0, shiftKey: true },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    // Both tie for driving dimension
    expect(newRect.width).toBe(100);
    expect(newRect.height).toBe(200);
  });

  it('should handle negative bounds wrapping (flip dimension manually)', () => {
    const rect: RectangleData = {
      id: 'r5',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      rotation: 0,
    };

    const state: AppState = {
      ...initialState,
      shapes: [rect],
      mode: 'resizing',
      resizingState: {
        shapeId: 'r5',
        handle: 'se',
        startX: 150,
        startY: 150,
        initialShape: rect,
      },
    };

    const action: Action = {
      type: 'RESIZE_SHAPE',
      payload: { x: 0, y: 0, shiftKey: false },
    };

    const newState = resizingReducer(state, action);
    const newRect = newState.shapes[0] as RectangleData;

    expect(newRect.width).toBe(100);
    expect(newRect.height).toBe(100);
  });
});

import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { updateCursorForShape } from './cursor';
import * as geometry from './geometry';
import type { ShapeData } from '../types';

vi.mock('./geometry', () => ({
  getResizeHandleAt: vi.fn(),
  getRotationHandleAt: vi.fn(),
}));

describe('updateCursorForShape', () => {
  const mockPos = { x: 0, y: 0 };
  const mockShape: ShapeData = {
    id: '1',
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
  };

  let mockGetResizeHandleAt: MockInstance;
  let mockGetRotationHandleAt: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.cursor = ''; // Reset cursor before each test

    mockGetResizeHandleAt = vi.mocked(geometry.getResizeHandleAt) as unknown as MockInstance;
    mockGetRotationHandleAt = vi.mocked(geometry.getRotationHandleAt) as unknown as MockInstance;

    mockGetResizeHandleAt.mockReturnValue(null);
    mockGetRotationHandleAt.mockReturnValue(null);
  });

  it('sets cursor to default if selectedShape is undefined', () => {
    updateCursorForShape(mockPos, undefined, null);
    expect(document.body.style.cursor).toBe('default');
  });

  it('sets cursor to nwse-resize for nw and se handles', () => {
    mockGetResizeHandleAt.mockReturnValue('nw');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('nwse-resize');

    mockGetResizeHandleAt.mockReturnValue('se');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('nwse-resize');
  });

  it('sets cursor to nesw-resize for ne and sw handles', () => {
    mockGetResizeHandleAt.mockReturnValue('ne');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('nesw-resize');

    mockGetResizeHandleAt.mockReturnValue('sw');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('nesw-resize');
  });

  it('sets cursor to pointer for other resize handles (e.g., start/end)', () => {
    mockGetResizeHandleAt.mockReturnValue('start');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('pointer');

    mockGetResizeHandleAt.mockReturnValue('end');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('pointer');
  });

  it('sets cursor to alias for rotation handles', () => {
    mockGetRotationHandleAt.mockReturnValue('tl');
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('alias');
  });

  it('sets cursor to move if hovering over a shape group', () => {
    const mockTargetElement = document.createElement('div');
    const mockShapeElement = document.createElement('g');
    mockShapeElement.setAttribute('data-shape-id', '1');
    mockShapeElement.appendChild(mockTargetElement);

    updateCursorForShape(mockPos, mockShape, mockTargetElement);
    expect(document.body.style.cursor).toBe('move');
  });

  it('sets cursor to default if no handles match and not hovering over a shape group', () => {
    const mockTargetElement = document.createElement('div'); // No parent with data-shape-id

    updateCursorForShape(mockPos, mockShape, mockTargetElement);
    expect(document.body.style.cursor).toBe('default');
  });

  it('sets cursor to default if targetElement is null and no handles match', () => {
    updateCursorForShape(mockPos, mockShape, null);
    expect(document.body.style.cursor).toBe('default');
  });
});

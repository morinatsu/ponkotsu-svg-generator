import { getResizeHandleAt, getRotationHandleAt, getRotatedShapeCorners } from './geometry';
import type { ShapeData, RectangleData, EllipseData, LineData } from '../types';

export const updateCursorForShape = (
  pos: { x: number; y: number },
  selectedShape: ShapeData | undefined,
  targetElement: HTMLElement | null,
) => {
  if (!selectedShape) {
    document.body.style.cursor = 'default';
    return;
  }

  // Pre-calculate corners for rotation and resize handles to avoid redundant calculation
  const corners = selectedShape.type !== 'text'
    ? getRotatedShapeCorners(selectedShape as RectangleData | EllipseData | LineData)
    : null;

  // Check for resize handle (inner circle) - Priority 1
  const resizeHandle = getResizeHandleAt(pos, selectedShape, corners);
  if (resizeHandle) {
    if (resizeHandle === 'nw' || resizeHandle === 'se') {
      document.body.style.cursor = 'nwse-resize';
    } else if (resizeHandle === 'ne' || resizeHandle === 'sw') {
      document.body.style.cursor = 'nesw-resize';
    } else {
      document.body.style.cursor = 'pointer'; // Fallback for start/end
    }
    return;
  }

  // Check for rotation handle (outer ring) - Priority 2
  if (getRotationHandleAt(pos, selectedShape, corners)) {
    document.body.style.cursor = 'alias';
    return;
  }

  // Find the shape group under the cursor to determine if we should show 'move'
  const shapeElement = targetElement?.closest('[data-shape-id]');
  if (shapeElement) {
    document.body.style.cursor = 'move';
  } else {
    document.body.style.cursor = 'default';
  }
};

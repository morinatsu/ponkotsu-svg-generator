// src/utils/geometry.ts
import type { ShapeData, RectangleData, EllipseData, LineData } from '../types';

/**
 * Calculates the center point of a shape.
 */
export const getShapeCenter = (shape: ShapeData): { x: number; y: number } => {
  switch (shape.type) {
    case 'rectangle':
      return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    case 'ellipse':
      return { x: shape.cx, y: shape.cy };
    case 'line':
      return { x: (shape.x1 + shape.x2) / 2, y: (shape.y1 + shape.y2) / 2 };
    case 'text':
      // This is a rough approximation
      return { x: shape.x, y: shape.y };
  }
};

/**
 * Represents the four corners of a shape.
 */
export type ShapeCorners = {
  nw: { x: number; y: number };
  ne: { x: number; y: number };
  sw: { x: number; y: number };
  se: { x: number; y: number };
};

/**
 * Calculates the bounding box corners of a shape *before* any rotation is applied.
 */
export const getShapeCorners = (shape: ShapeData): ShapeCorners | null => {
  switch (shape.type) {
    case 'rectangle':
      return {
        nw: { x: shape.x, y: shape.y },
        ne: { x: shape.x + shape.width, y: shape.y },
        sw: { x: shape.x, y: shape.y + shape.height },
        se: { x: shape.x + shape.width, y: shape.y + shape.height },
      };
    case 'ellipse':
      return {
        nw: { x: shape.cx - shape.rx, y: shape.cy - shape.ry },
        ne: { x: shape.cx + shape.rx, y: shape.cy - shape.ry },
        sw: { x: shape.cx - shape.rx, y: shape.cy + shape.ry },
        se: { x: shape.cx + shape.rx, y: shape.cy + shape.ry },
      };
    case 'line':
      // For lines, the corners are just the two endpoints. We'll label them nw/se for simplicity.
      return {
        nw: { x: shape.x1, y: shape.y1 },
        ne: { x: shape.x2, y: shape.y1 }, // Not a real corner, but needed for a bounding box concept
        sw: { x: shape.x1, y: shape.y2 }, // Not a real corner
        se: { x: shape.x2, y: shape.y2 },
      };
    case 'text':
      return null; // Text rotation is not supported from corners
  }
};

/**
 * Rotates a single point around a center point.
 * @param point The point to rotate.
 * @param center The center of rotation.
 * @param angle The angle of rotation in degrees.
 * @returns The new rotated point.
 */
export const rotatePoint = (
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number,
): { x: number; y: number } => {
  const angleRad = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

/**
 * Calculates the corners of a shape *after* its rotation is applied.
 */
export const getRotatedShapeCorners = (
  shape: RectangleData | EllipseData | LineData,
): ShapeCorners | null => {
  const corners = getShapeCorners(shape);
  if (!corners || !('rotation' in shape) || shape.rotation === 0) {
    return corners;
  }

  const center = getShapeCenter(shape);
  const angle = shape.rotation;

  return {
    nw: rotatePoint(corners.nw, center, angle),
    ne: rotatePoint(corners.ne, center, angle),
    sw: rotatePoint(corners.sw, center, angle),
    se: rotatePoint(corners.se, center, angle),
  };
};

/**
 * Checks if a mouse position is close enough to a rotation handle (corner).
 * @param pos The mouse position.
 * @param shape The shape to check against.
 * @returns The corner that is being hovered over, or null if none.
 */
export const getRotationHandleAt = (
  pos: { x: number; y: number },
  shape: ShapeData,
): keyof ShapeCorners | null => {
  if (!('rotation' in shape)) {
    return null;
  }
  const corners = getRotatedShapeCorners(shape as RectangleData | EllipseData | LineData);
  if (!corners) {
    return null;
  }

  // Spec: 10px < distance < 30px
  const MIN_DIST_SQUARED = 10 * 10;
  const MAX_DIST_SQUARED = 30 * 30;

  for (const key in corners) {
    // For lines, only allow rotation from the endpoints (nw/se in our mapping)
    if (shape.type === 'line' && key !== 'nw' && key !== 'se') {
      continue;
    }

    const corner = corners[key as keyof ShapeCorners];
    const dx = pos.x - corner.x;
    const dy = pos.y - corner.y;
    const distSquared = dx * dx + dy * dy;

    if (distSquared > MIN_DIST_SQUARED && distSquared < MAX_DIST_SQUARED) {
      return key as keyof ShapeCorners;
    }
  }

  return null;
};

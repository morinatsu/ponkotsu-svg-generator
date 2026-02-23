import { describe, it, expect } from 'vitest';
import {
  getShapeCenter,
  getShapeCorners,
  getRotatedShapeCorners,
  getRotationHandleAt,
  getResizeHandleAt,
} from '../utils/geometry';
import type { RectangleData, EllipseData, LineData, TextData } from '../types';

describe('geometry utilities', () => {
  const rect: RectangleData = {
    id: '1',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    rotation: 0,
  };

  const ellipse: EllipseData = {
    id: '2',
    type: 'ellipse',
    cx: 150,
    cy: 150,
    rx: 50,
    ry: 25,
    rotation: 0,
  };

  const line: LineData = {
    id: '3',
    type: 'line',
    x1: 100,
    y1: 100,
    x2: 200,
    y2: 200,
    rotation: 0,
  };

  const text: TextData = {
    id: '4',
    type: 'text',
    x: 50,
    y: 50,
    content: 'Hello',
    fontSize: 16,
    fontFamily: 'Arial',
    fill: 'black',
  };

  describe('getShapeCenter', () => {
    it('returns correct center for rectangle', () => {
      expect(getShapeCenter(rect)).toEqual({ x: 200, y: 150 });
    });

    it('returns correct center for ellipse', () => {
      expect(getShapeCenter(ellipse)).toEqual({ x: 150, y: 150 });
    });

    it('returns correct center for line', () => {
      expect(getShapeCenter(line)).toEqual({ x: 150, y: 150 });
    });

    it('returns correct center (approximation) for text', () => {
      expect(getShapeCenter(text)).toEqual({ x: 50, y: 50 });
    });
  });

  describe('getShapeCorners', () => {
    it('returns correct corners for rectangle', () => {
      expect(getShapeCorners(rect)).toEqual({
        nw: { x: 100, y: 100 },
        ne: { x: 300, y: 100 },
        sw: { x: 100, y: 200 },
        se: { x: 300, y: 200 },
      });
    });

    it('returns correct corners for ellipse', () => {
      expect(getShapeCorners(ellipse)).toEqual({
        nw: { x: 100, y: 125 },
        ne: { x: 200, y: 125 },
        sw: { x: 100, y: 175 },
        se: { x: 200, y: 175 },
      });
    });

    it('returns correct corners for line', () => {
      expect(getShapeCorners(line)).toEqual({
        nw: { x: 100, y: 100 },
        ne: { x: 200, y: 100 },
        sw: { x: 100, y: 200 },
        se: { x: 200, y: 200 },
      });
    });

    it('returns null for text', () => {
      expect(getShapeCorners(text)).toBeNull();
    });
  });

  describe('getRotatedShapeCorners', () => {
    it('returns unrotated corners if rotation is 0', () => {
      expect(getRotatedShapeCorners(rect)).toEqual(getShapeCorners(rect));
    });

    it('returns unrotated corners if rotation is undefined', () => {
      // @ts-expect-error Testing runtime fallback explicitly
      const lineNoRot: LineData = { ...line, rotation: undefined };
      expect(getRotatedShapeCorners(lineNoRot)).toEqual(getShapeCorners(lineNoRot));
    });

    it('returns corners properly ignoring text', () => {
      // TypeScript would usually stop this at compile time based on the type signature limit,
      // but testing the underlying function runtime behavior safely.
      // @ts-expect-error Testing invalid runtime input
      expect(getRotatedShapeCorners(text)).toBeNull();
    });
  });

  describe('getRotationHandleAt', () => {
    it('returns null for text', () => {
      expect(getRotationHandleAt({ x: 0, y: 0 }, text)).toBeNull();
    });

    it('returns null if no corners exist', () => {
      // Create a mock shape that somehow has rotation but no readable corners
      const weirdShape = { ...text, rotation: 90 };
      expect(getRotationHandleAt({ x: 0, y: 0 }, weirdShape)).toBeNull();
    });

    it('returns a handle if clicking within 10-30px radius of corner for rectangle', () => {
      // nw corner is at 100, 100.
      expect(getRotationHandleAt({ x: 115, y: 115 }, rect)).toBe('nw');
    });

    it('ignores handles that are not nw/se for lines', () => {
      // ne corner for line is a pseudo bounding box corner, not a real endpoint.
      // ne is 200, 100. Dist 15,15 is ~21px.
      expect(getRotationHandleAt({ x: 215, y: 115 }, line)).toBeNull();
      // nw is an actual endpoint 100, 100
      expect(getRotationHandleAt({ x: 115, y: 115 }, line)).toBe('nw');
    });

    it('returns null if click is too far', () => {
      expect(getRotationHandleAt({ x: 0, y: 0 }, rect)).toBeNull();
    });

    it('returns null if click is too close (resize zone)', () => {
      expect(getRotationHandleAt({ x: 101, y: 101 }, rect)).toBeNull();
    });
  });

  describe('getResizeHandleAt', () => {
    it('returns null for text', () => {
      expect(getResizeHandleAt({ x: 0, y: 0 }, text)).toBeNull();
    });

    it('returns handle if clicking within 10px of rectangle corner', () => {
      // nw corner is 100, 100
      expect(getResizeHandleAt({ x: 105, y: 105 }, rect)).toBe('nw');
    });

    it('returns start handle if clicking within 10px of line start (nw)', () => {
      // Start is 100, 100
      expect(getResizeHandleAt({ x: 105, y: 105 }, line)).toBe('start');
    });

    it('returns end handle if clicking within 10px of line end (se)', () => {
      // End is 200, 200
      expect(getResizeHandleAt({ x: 205, y: 205 }, line)).toBe('end');
    });

    it('returns null for line missing endpoints like ne/sw', () => {
      // ne is 200, 100
      expect(getResizeHandleAt({ x: 200, y: 100 }, line)).toBeNull();
    });

    it('returns null if too far from any corner', () => {
      expect(getResizeHandleAt({ x: 500, y: 500 }, rect)).toBeNull();
    });
  });
});

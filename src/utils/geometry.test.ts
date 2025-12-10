// src/utils/geometry.test.ts
import { describe, it, expect } from 'vitest';
import { rotatePoint, getRotatedShapeCorners, getRotationHandleAt, toLocal, toGlobal, getResizeHandleAt } from './geometry';
import type { RectangleData, LineData } from '../types';

describe('geometry utils', () => {
  describe('rotatePoint', () => {
    const center = { x: 10, y: 10 };
    it('should not move the point when rotated 0 degrees', () => {
      const point = { x: 20, y: 10 };
      const rotated = rotatePoint(point, center, 0);
      expect(rotated.x).toBeCloseTo(20);
      expect(rotated.y).toBeCloseTo(10);
    });

    it('should rotate the point 90 degrees correctly', () => {
      const point = { x: 20, y: 10 }; // 10 units to the right of center
      const rotated = rotatePoint(point, center, 90);
      // Should be 10 units "down" from the center
      expect(rotated.x).toBeCloseTo(10);
      expect(rotated.y).toBeCloseTo(20);
    });

    it('should rotate the point -90 degrees correctly', () => {
      const point = { x: 20, y: 10 };
      const rotated = rotatePoint(point, center, -90);
      // Should be 10 units "up" from the center
      expect(rotated.x).toBeCloseTo(10);
      expect(rotated.y).toBeCloseTo(0);
    });

    it('should rotate the point 180 degrees correctly', () => {
      const point = { x: 20, y: 10 };
      const rotated = rotatePoint(point, center, 180);
      // Should be 10 units "left" from the center
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(10);
    });
  });

  describe('coordinate transforms', () => {
    const center = { x: 100, y: 100 };
    const angle = 90;

    it('toLocal should transform global point to unrotated local offset', () => {
        // Global point (110, 100) -> 10 units right of center.
        // If system is rotated 90 deg, this point "was" originally at (100, 90) relative to center?
        // Wait.
        // Local: (10, 0) relative to center.
        // Rotated 90 deg -> (0, 10) relative to center -> Global (100, 110).

        const globalPoint = { x: 100, y: 110 };
        const local = toLocal(globalPoint, center, angle);

        expect(local.x).toBeCloseTo(10);
        expect(local.y).toBeCloseTo(0);
    });

    it('toGlobal should transform local offset to rotated global point', () => {
        const localPoint = { x: 10, y: 0 };
        const global = toGlobal(localPoint, center, angle);

        expect(global.x).toBeCloseTo(100);
        expect(global.y).toBeCloseTo(110);
    });

    it('should be inverse of each other', () => {
        const p = { x: 50, y: 50 };
        const local = toLocal(p, center, 45);
        const global = toGlobal(local, center, 45);

        expect(global.x).toBeCloseTo(p.x);
        expect(global.y).toBeCloseTo(p.y);
    });
  });

  describe('getRotatedShapeCorners', () => {
    it('should return correct corners for a rotated rectangle', () => {
      const rectangle: RectangleData = {
        id: 'rect1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 90,
      };
      // Center is (200, 150)
      // NW corner is (100, 100) -> rotated should be (250, 50)
      // NE corner is (300, 100) -> rotated should be (250, 250)
      // SW corner is (100, 200) -> rotated should be (150, 50)
      // SE corner is (300, 200) -> rotated should be (150, 250)
      const corners = getRotatedShapeCorners(rectangle);
      expect(corners).not.toBeNull();
      if (!corners) return;

      expect(corners.nw.x).toBeCloseTo(250);
      expect(corners.nw.y).toBeCloseTo(50);

      expect(corners.ne.x).toBeCloseTo(250);
      expect(corners.ne.y).toBeCloseTo(250);

      expect(corners.sw.x).toBeCloseTo(150);
      expect(corners.sw.y).toBeCloseTo(50);

      expect(corners.se.x).toBeCloseTo(150);
      expect(corners.se.y).toBeCloseTo(250);
    });
  });

  describe('getRotationHandleAt', () => {
    const rect: RectangleData = {
      id: 'r1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
    };
    // Corners: NW(100,100), NE(200,100), SW(100,200), SE(200,200)

    it('should return null if point is too close (< 10px)', () => {
      // 5px away from NW
      const pos = { x: 95, y: 100 };
      expect(getRotationHandleAt(pos, rect)).toBeNull();
    });

    it('should return corner if point is within range (10px < d < 30px)', () => {
      // 20px away from NW
      const pos = { x: 80, y: 100 };
      expect(getRotationHandleAt(pos, rect)).toBe('nw');
    });

    it('should return null if point is too far (> 30px)', () => {
      // 40px away from NW
      const pos = { x: 60, y: 100 };
      expect(getRotationHandleAt(pos, rect)).toBeNull();
    });

    it('should only allow rotation from endpoints for lines', () => {
      const line: LineData = {
        id: 'l1',
        type: 'line',
        x1: 100,
        y1: 100,
        x2: 200,
        y2: 200,
        rotation: 0,
      };
      // NW is (100,100), SE is (200,200). NE/SW are phantom corners.

      // Check NW (valid)
      expect(getRotationHandleAt({ x: 80, y: 100 }, line)).toBe('nw');

      // Check NE (invalid phantom corner at 200,100)
      expect(getRotationHandleAt({ x: 220, y: 100 }, line)).toBeNull();
    });
  });

  describe('getResizeHandleAt', () => {
    const rect: RectangleData = {
        id: 'r1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      };

    it('should return handle if point is within 10px', () => {
        expect(getResizeHandleAt({x: 105, y: 100}, rect)).toBe('nw');
        expect(getResizeHandleAt({x: 95, y: 100}, rect)).toBe('nw');
    });

    it('should return null if point is > 10px away', () => {
        expect(getResizeHandleAt({x: 80, y: 100}, rect)).toBeNull(); // This hits rotation handle range
    });

    it('should handle lines correctly', () => {
        const line: LineData = {
            id: 'l1',
            type: 'line',
            x1: 100,
            y1: 100,
            x2: 200,
            y2: 200,
            rotation: 0,
        };

        expect(getResizeHandleAt({x: 100, y: 100}, line)).toBe('start');
        expect(getResizeHandleAt({x: 200, y: 200}, line)).toBe('end');
        // Phantom corners
        expect(getResizeHandleAt({x: 200, y: 100}, line)).toBeNull();
    });
  });
});

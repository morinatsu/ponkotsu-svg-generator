// src/utils/geometry.test.ts
import { describe, it, expect } from 'vitest';
import { rotatePoint, getRotatedShapeCorners } from './geometry';
import type { RectangleData } from '../types';

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
});

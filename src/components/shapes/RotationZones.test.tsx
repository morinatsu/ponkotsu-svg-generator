import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RotationZones from './RotationZones';
import type { RectangleData, EllipseData, LineData, TextData } from '../../types';

describe('RotationZones', () => {
  const baseRectangle: RectangleData = {
    id: 'rect-1',
    type: 'rectangle',
    x: 10,
    y: 20,
    width: 30,
    height: 40,
    rotation: 0,
  };

  it('renders nothing when not selected', () => {
    const { container } = render(
      <svg>
        <RotationZones shape={baseRectangle} isSelected={false} />
      </svg>
    );
    expect(container.querySelectorAll('circle').length).toBe(0);
  });

  it('renders nothing if shape lacks rotation property (e.g., Text)', () => {
    // Note: TextData lacks rotation in current type definitions
    const textShape = {
      id: 'text-1',
      type: 'text',
      x: 10,
      y: 10,
      content: 'hello',
      fontSize: 16,
      fill: '#000',
      fontFamily: 'Arial',
    } as TextData; // Using 'as TextData' because type might evolve, but for this test we explicitly want one without 'rotation'

    const { container } = render(
      <svg>
        <RotationZones shape={textShape} isSelected={true} />
      </svg>
    );
    expect(container.querySelectorAll('circle').length).toBe(0);
  });

  it('renders 4 correct zones for a Rectangle', () => {
    const { container } = render(
      <svg>
        <RotationZones shape={baseRectangle} isSelected={true} />
      </svg>
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4);

    // Expected corners for x: 10, y: 20, w: 30, h: 40
    // (10, 20), (40, 20), (10, 60), (40, 60)
    expect(circles[0].getAttribute('cx')).toBe('10');
    expect(circles[0].getAttribute('cy')).toBe('20');

    expect(circles[1].getAttribute('cx')).toBe('40');
    expect(circles[1].getAttribute('cy')).toBe('20');

    expect(circles[2].getAttribute('cx')).toBe('10');
    expect(circles[2].getAttribute('cy')).toBe('60');

    expect(circles[3].getAttribute('cx')).toBe('40');
    expect(circles[3].getAttribute('cy')).toBe('60');
  });

  it('renders 4 correct zones for an Ellipse', () => {
    const ellipseShape: EllipseData = {
      id: 'ellipse-1',
      type: 'ellipse',
      cx: 50,
      cy: 60,
      rx: 20,
      ry: 30,
      rotation: 0,
    };
    const { container } = render(
      <svg>
        <RotationZones shape={ellipseShape} isSelected={true} />
      </svg>
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4);

    // Expected corners for cx: 50, cy: 60, rx: 20, ry: 30
    // (30, 30), (70, 30), (30, 90), (70, 90)
    expect(circles[0].getAttribute('cx')).toBe('30');
    expect(circles[0].getAttribute('cy')).toBe('30');

    expect(circles[1].getAttribute('cx')).toBe('70');
    expect(circles[1].getAttribute('cy')).toBe('30');

    expect(circles[2].getAttribute('cx')).toBe('30');
    expect(circles[2].getAttribute('cy')).toBe('90');

    expect(circles[3].getAttribute('cx')).toBe('70');
    expect(circles[3].getAttribute('cy')).toBe('90');
  });

  it('renders 2 correct zones for a Line', () => {
    const lineShape: LineData = {
      id: 'line-1',
      type: 'line',
      x1: 15,
      y1: 25,
      x2: 35,
      y2: 45,
      rotation: 0,
    };
    const { container } = render(
      <svg>
        <RotationZones shape={lineShape} isSelected={true} />
      </svg>
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);

    expect(circles[0].getAttribute('cx')).toBe('15');
    expect(circles[0].getAttribute('cy')).toBe('25');

    expect(circles[1].getAttribute('cx')).toBe('35');
    expect(circles[1].getAttribute('cy')).toBe('45');
  });
});

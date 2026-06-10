import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Rectangle from './Rectangle';
import type { RectangleData } from '../../types';

// Mock RotationZones to avoid rendering its complex SVG structure
vi.mock('./RotationZones', () => ({
  default: ({ shape, isSelected }: { shape: RectangleData; isSelected: boolean }) => (
    <g data-testid="rotation-zones" data-shape-id={shape.id} data-selected={isSelected} />
  ),
}));

describe('Rectangle component', () => {
  const defaultShape: RectangleData = {
    id: 'test-rect',
    type: 'rectangle',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 0,
  };

  const defaultProps = {
    shape: defaultShape,
    isSelected: false,
    visibleShapeStyle: { opacity: 0.8 },
    hitboxProps: { 'data-testid': 'hitbox' } as React.SVGProps<SVGRectElement>,
    groupProps: { 'data-testid': 'group' } as React.SVGProps<SVGGElement>,
  };

  it('renders correctly with default props (unselected, no custom stroke)', () => {
    const { getByTestId, container } = render(
      <svg>
        <Rectangle {...defaultProps} />
      </svg>,
    );

    // Check group props
    const group = getByTestId('group');
    expect(group).toBeInTheDocument();

    // Check visible rectangle
    // Use querySelector as we don't have a specific test id for it, but we can look for strokeWidth="2"
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);

    const visibleRect = Array.from(rects).find((r) => r.getAttribute('stroke-width') === '2');
    expect(visibleRect).not.toBeNull();
    expect(visibleRect).toHaveAttribute('x', '10');
    expect(visibleRect).toHaveAttribute('y', '20');
    expect(visibleRect).toHaveAttribute('width', '100');
    expect(visibleRect).toHaveAttribute('height', '50');
    expect(visibleRect).toHaveAttribute('stroke', 'black');
    expect(visibleRect).toHaveAttribute('fill', 'none');
    expect(visibleRect).toHaveStyle({ opacity: '0.8' });

    // Check hitbox rectangle
    const hitboxRect = getByTestId('hitbox');
    expect(hitboxRect).toBeInTheDocument();
    expect(hitboxRect).toHaveAttribute('x', '10');
    expect(hitboxRect).toHaveAttribute('y', '20');
    expect(hitboxRect).toHaveAttribute('width', '100');
    expect(hitboxRect).toHaveAttribute('height', '50');

    // Check RotationZones mock
    const rotationZones = getByTestId('rotation-zones');
    expect(rotationZones).toBeInTheDocument();
    expect(rotationZones).toHaveAttribute('data-shape-id', 'test-rect');
    expect(rotationZones).toHaveAttribute('data-selected', 'false');
  });

  it('renders correctly when selected', () => {
    const { container, getByTestId } = render(
      <svg>
        <Rectangle {...defaultProps} isSelected={true} />
      </svg>,
    );

    const rects = container.querySelectorAll('rect');
    const visibleRect = Array.from(rects).find((r) => r.getAttribute('stroke-width') === '2');
    expect(visibleRect).toHaveAttribute('stroke', 'blue');

    const rotationZones = getByTestId('rotation-zones');
    expect(rotationZones).toHaveAttribute('data-selected', 'true');
  });

  it('renders correctly with custom stroke when unselected', () => {
    const shapeWithStroke: RectangleData = {
      ...defaultShape,
      stroke: 'red',
    };
    const { container } = render(
      <svg>
        <Rectangle {...defaultProps} shape={shapeWithStroke} />
      </svg>,
    );

    const rects = container.querySelectorAll('rect');
    const visibleRect = Array.from(rects).find((r) => r.getAttribute('stroke-width') === '2');
    expect(visibleRect).toHaveAttribute('stroke', 'red');
  });
});

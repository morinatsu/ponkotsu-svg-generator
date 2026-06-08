import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Ellipse from './Ellipse';
import type { EllipseData } from '../../types';

// Mock RotationZones to avoid rendering its complex SVG structure
vi.mock('./RotationZones', () => ({
  default: ({ shape, isSelected }: { shape: EllipseData; isSelected: boolean }) => (
    <g data-testid="rotation-zones" data-shape-id={shape.id} data-selected={isSelected} />
  ),
}));

describe('Ellipse component', () => {
  const defaultShape: EllipseData = {
    id: 'test-ellipse',
    type: 'ellipse',
    cx: 100,
    cy: 150,
    rx: 50,
    ry: 25,
    rotation: 0,
  };

  const defaultProps = {
    shape: defaultShape,
    isSelected: false,
    visibleShapeStyle: { opacity: 0.8 },
    hitboxProps: { 'data-testid': 'hitbox' } as React.SVGProps<SVGEllipseElement>,
    groupProps: { 'data-testid': 'group' } as React.SVGProps<SVGGElement>,
  };

  it('renders correctly with default props (unselected, no custom stroke)', () => {
    const { getByTestId, container } = render(
      <svg>
        <Ellipse {...defaultProps} />
      </svg>
    );

    // Check group props
    const group = getByTestId('group');
    expect(group).toBeInTheDocument();

    // Check visible ellipse
    // Use querySelector as we don't have a specific test id for it, but we can look for strokeWidth="2"
    const ellipses = container.querySelectorAll('ellipse');
    expect(ellipses.length).toBe(2);

    const visibleEllipse = Array.from(ellipses).find(e => e.getAttribute('stroke-width') === '2');
    expect(visibleEllipse).not.toBeNull();
    expect(visibleEllipse).toHaveAttribute('cx', '100');
    expect(visibleEllipse).toHaveAttribute('cy', '150');
    expect(visibleEllipse).toHaveAttribute('rx', '50');
    expect(visibleEllipse).toHaveAttribute('ry', '25');
    expect(visibleEllipse).toHaveAttribute('stroke', 'black');
    expect(visibleEllipse).toHaveAttribute('fill', 'none');
    expect(visibleEllipse).toHaveStyle({ opacity: '0.8' });

    // Check hitbox ellipse
    const hitboxEllipse = getByTestId('hitbox');
    expect(hitboxEllipse).toBeInTheDocument();
    expect(hitboxEllipse).toHaveAttribute('cx', '100');
    expect(hitboxEllipse).toHaveAttribute('cy', '150');
    expect(hitboxEllipse).toHaveAttribute('rx', '50');
    expect(hitboxEllipse).toHaveAttribute('ry', '25');

    // Check RotationZones mock
    const rotationZones = getByTestId('rotation-zones');
    expect(rotationZones).toBeInTheDocument();
    expect(rotationZones).toHaveAttribute('data-shape-id', 'test-ellipse');
    expect(rotationZones).toHaveAttribute('data-selected', 'false');
  });

  it('renders correctly when selected', () => {
    const { container, getByTestId } = render(
      <svg>
        <Ellipse {...defaultProps} isSelected={true} />
      </svg>
    );

    const ellipses = container.querySelectorAll('ellipse');
    const visibleEllipse = Array.from(ellipses).find(e => e.getAttribute('stroke-width') === '2');
    expect(visibleEllipse).toHaveAttribute('stroke', 'blue');

    const rotationZones = getByTestId('rotation-zones');
    expect(rotationZones).toHaveAttribute('data-selected', 'true');
  });

  it('renders correctly with custom stroke when unselected', () => {
    const shapeWithStroke: EllipseData = {
      ...defaultShape,
      stroke: 'red',
    };
    const { container } = render(
      <svg>
        <Ellipse {...defaultProps} shape={shapeWithStroke} />
      </svg>
    );

    const ellipses = container.querySelectorAll('ellipse');
    const visibleEllipse = Array.from(ellipses).find(e => e.getAttribute('stroke-width') === '2');
    expect(visibleEllipse).toHaveAttribute('stroke', 'red');
  });
});
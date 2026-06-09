import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Line from './Line';
import type { LineData } from '../../types';

// Mock the RotationZones component
vi.mock('./RotationZones', () => ({
  default: ({ shape, isSelected }: { shape: { id: string }; isSelected: boolean }) => (
    <g data-testid="mock-rotation-zones" data-shape-id={shape.id} data-selected={isSelected} />
  ),
}));

describe('Line Component', () => {
  const defaultShape: LineData = {
    id: 'line-1',
    type: 'line',
    x1: 10,
    y1: 20,
    x2: 100,
    y2: 200,
    rotation: 0,
  };

  const defaultProps = {
    shape: defaultShape,
    isSelected: false,
    visibleShapeStyle: { opacity: 0.8 },
    hitboxProps: { strokeWidth: 10, className: 'hitbox' },
    groupProps: { 'data-testid': 'line-group', transform: 'translate(0, 0)' },
  };

  it('renders the visible line and hitbox correctly', () => {
    const { container } = render(
      <svg>
        <Line {...defaultProps} />
      </svg>,
    );

    const lines = container.querySelectorAll('line');
    expect(lines).toHaveLength(2); // Visible line and hitbox line

    const visibleLine = lines[0];
    const hitboxLine = lines[1];

    // Check visible line
    expect(visibleLine).toHaveAttribute('x1', '10');
    expect(visibleLine).toHaveAttribute('y1', '20');
    expect(visibleLine).toHaveAttribute('x2', '100');
    expect(visibleLine).toHaveAttribute('y2', '200');
    expect(visibleLine).toHaveAttribute('stroke', 'black'); // Default stroke
    expect(visibleLine).toHaveAttribute('stroke-width', '2');
    expect(visibleLine).toHaveStyle('opacity: 0.8');

    // Check hitbox line
    expect(hitboxLine).toHaveAttribute('x1', '10');
    expect(hitboxLine).toHaveAttribute('y1', '20');
    expect(hitboxLine).toHaveAttribute('x2', '100');
    expect(hitboxLine).toHaveAttribute('y2', '200');
    expect(hitboxLine).toHaveAttribute('stroke-width', '10');
    expect(hitboxLine).toHaveClass('hitbox');
  });

  it('applies the selection style correctly', () => {
    const { container } = render(
      <svg>
        <Line {...defaultProps} isSelected={true} />
      </svg>,
    );

    const visibleLine = container.querySelectorAll('line')[0];
    expect(visibleLine).toHaveAttribute('stroke', 'blue');
  });

  it('applies custom stroke colors correctly', () => {
    const shapeWithColor = { ...defaultShape, stroke: 'red' };
    const { container } = render(
      <svg>
        <Line {...defaultProps} shape={shapeWithColor} />
      </svg>,
    );

    const visibleLine = container.querySelectorAll('line')[0];
    expect(visibleLine).toHaveAttribute('stroke', 'red');
  });

  it('passes the groupProps to the wrapping <g> element', () => {
    const { getByTestId } = render(
      <svg>
        <Line {...defaultProps} />
      </svg>,
    );

    const group = getByTestId('line-group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('transform', 'translate(0, 0)');
  });

  it('renders RotationZones with correct props', () => {
    const { getByTestId } = render(
      <svg>
        <Line {...defaultProps} isSelected={true} />
      </svg>,
    );

    const rotationZones = getByTestId('mock-rotation-zones');
    expect(rotationZones).toBeInTheDocument();
    expect(rotationZones).toHaveAttribute('data-shape-id', 'line-1');
    expect(rotationZones).toHaveAttribute('data-selected', 'true');
  });
});

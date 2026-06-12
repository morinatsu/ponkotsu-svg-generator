import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Text from './Text';
import type { TextData } from '../../types';

describe('Text component', () => {
  const defaultShape: TextData = {
    id: 'test-text',
    type: 'text',
    x: 50,
    y: 100,
    content: 'Hello World',
    fontSize: 16,
    fill: 'black',
    fontFamily: 'Arial',
  };

  const defaultProps = {
    shape: defaultShape,
    isSelected: false,
    groupProps: { 'data-testid': 'group' } as React.SVGProps<SVGGElement>,
    isDragging: false,
    isDrawingMode: false,
  };

  it('renders correctly with default props', () => {
    const { getByTestId, container } = render(
      <svg>
        <Text {...defaultProps} />
      </svg>,
    );

    const group = getByTestId('group');
    expect(group).toBeInTheDocument();

    const textElement = container.querySelector('text');
    expect(textElement).not.toBeNull();
    expect(textElement).toHaveAttribute('x', '50');
    expect(textElement).toHaveAttribute('y', '100');
    expect(textElement).toHaveAttribute('font-size', '16');
    expect(textElement).toHaveAttribute('font-family', 'Arial');
    expect(textElement).toHaveAttribute('fill', 'black');
    expect(textElement).toHaveAttribute('stroke', 'none');

    // Check styles including pointer events, cursor, and user-select
    expect(textElement).toHaveStyle({
      pointerEvents: 'all',
      cursor: 'grab',
      userSelect: 'none',
    });

    const tspans = container.querySelectorAll('tspan');
    expect(tspans.length).toBe(1);
    expect(tspans[0]).toHaveTextContent('Hello World');
    expect(tspans[0]).toHaveAttribute('x', '50');
    expect(tspans[0]).toHaveAttribute('dy', '0');
  });

  it('renders correctly when selected', () => {
    const { container } = render(
      <svg>
        <Text {...defaultProps} isSelected={true} />
      </svg>,
    );

    const textElement = container.querySelector('text');
    expect(textElement).toHaveAttribute('fill', 'blue');
  });

  it('handles multi-line text correctly', () => {
    const multiLineShape: TextData = {
      ...defaultShape,
      content: 'Line 1\nLine 2\nLine 3',
    };

    const { container } = render(
      <svg>
        <Text {...defaultProps} shape={multiLineShape} />
      </svg>,
    );

    const tspans = container.querySelectorAll('tspan');
    expect(tspans.length).toBe(3);

    expect(tspans[0]).toHaveTextContent('Line 1');
    expect(tspans[0]).toHaveAttribute('dy', '0');

    const expectedLineHeight = String(16 * 1.2);
    expect(tspans[1]).toHaveTextContent('Line 2');
    expect(tspans[1]).toHaveAttribute('dy', expectedLineHeight);

    expect(tspans[2]).toHaveTextContent('Line 3');
    expect(tspans[2]).toHaveAttribute('dy', expectedLineHeight);
  });

  it('disables pointer events when dragging', () => {
    const { container } = render(
      <svg>
        <Text {...defaultProps} isDragging={true} />
      </svg>,
    );

    const textElement = container.querySelector('text');
    expect(textElement).toHaveStyle({ pointerEvents: 'none' });
  });

  it('disables pointer events when in drawing mode', () => {
    const { container } = render(
      <svg>
        <Text {...defaultProps} isDrawingMode={true} />
      </svg>,
    );

    const textElement = container.querySelector('text');
    expect(textElement).toHaveStyle({ pointerEvents: 'none' });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock initialState to have one shape so Export button is enabled
vi.mock('./state/reducer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./state/reducer')>();
  return {
    ...actual,
    initialState: {
      ...actual.initialState,
      shapes: [
        {
          id: '1',
          type: 'rectangle',
          x: 10,
          y: 10,
          width: 50,
          height: 50,
        },
      ],
    },
  };
});

// Mock child components that we don't want to test deeply
vi.mock('./components/DebugInfo', () => ({
  default: () => <div data-testid="debug-info" />,
}));
vi.mock('./components/TextInputModal', () => ({
  default: () => <div data-testid="text-input-modal" />,
}));

// Mock custom hooks
vi.mock('./hooks/useInteractionManager');
vi.mock('./hooks/useKeyboardControls');
vi.mock('./hooks/useSvgExport');

// Import hooks AFTER mocking
import { useInteractionManager } from './hooks/useInteractionManager';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useSvgExport } from './hooks/useSvgExport';

describe('App', () => {
  const mockUseInteractionManagerHandlers = {
    handleMouseDown: vi.fn(),
  };
  const mockUseSvgExportHandlers = {
    handleExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInteractionManager).mockReturnValue(mockUseInteractionManagerHandlers);
    vi.mocked(useKeyboardControls).mockImplementation(vi.fn());
    vi.mocked(useSvgExport).mockReturnValue(mockUseSvgExportHandlers);
  });

  it('renders the main title', () => {
    render(<App />);
    expect(screen.getByText('ぽんこつSVGジェネレーター')).toBeInTheDocument();
  });

  it('renders the main components', () => {
    render(<App />);
    // Toolbar elements
    expect(screen.getByText('長方形')).toBeInTheDocument();
    // SvgCanvas (it renders an svg element)
    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByTestId('debug-info')).toBeInTheDocument();
  });

  it('does not render TextInputModal initially', () => {
    render(<App />);
    expect(screen.queryByTestId('text-input-modal')).not.toBeInTheDocument();
  });

  it('initializes Toolbar with correct state', () => {
    render(<App />);
    // Expect 1 shape because we mocked initialState
    expect(screen.getByText('Shapes: 1')).toBeInTheDocument();
    // Check active tool
    const rectButton = screen.getByText('長方形');
    expect(rectButton).toHaveClass('active');
  });

  it('calls useKeyboardControls with the correct selectedShapeId', () => {
    render(<App />);
    expect(useKeyboardControls).toHaveBeenCalledWith(expect.any(Function), null);
  });

  it('calls canvas mousedown event handler from useInteractionManager', () => {
    render(<App />);
    const canvas = document.querySelector('svg');
    if (!canvas) throw new Error('Canvas not found');
    fireEvent.mouseDown(canvas);
    expect(mockUseInteractionManagerHandlers.handleMouseDown).toHaveBeenCalled();
  });

  it('calls handleExport from useSvgExport when export button is clicked', () => {
    render(<App />);
    const exportButton = screen.getByText('エクスポート');
    // Button should be enabled now
    expect(exportButton).not.toBeDisabled();
    fireEvent.click(exportButton);
    expect(mockUseSvgExportHandlers.handleExport).toHaveBeenCalled();
  });

  it('renders Toolbar control buttons', () => {
    render(<App />);
    expect(screen.getByText('クリア')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });
});


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { initialState } from './state/reducer';

// Mock child components
vi.mock('./components/Toolbar', () => ({
  default: ({ onClear, onExport, onUndo, onRedo, onToolSelect, ...rest }) => (
    <div data-testid="toolbar" data-props={JSON.stringify(rest)}>
      <button data-testid="clear-button" onClick={onClear}>Clear</button>
      <button data-testid="export-button" onClick={onExport}>Export</button>
      <button data-testid="undo-button" onClick={onUndo}>Undo</button>
      <button data-testid="redo-button" onClick={onRedo}>Redo</button>
      <button data-testid="rect-tool-button" onClick={() => onToolSelect('rectangle')}>Rect</button>
    </div>
  ),
}));
vi.mock('./components/SvgCanvas', () => ({
  default: React.forwardRef((props, ref) => <div data-testid="svg-canvas" {...props} ref={ref as React.Ref<HTMLDivElement>}></div>),
}));
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

    // Setup mock implementations for each test
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
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('debug-info')).toBeInTheDocument();
  });

  it('does not render TextInputModal initially', () => {
    render(<App />);
    expect(screen.queryByTestId('text-input-modal')).not.toBeInTheDocument();
  });

  it('passes correct initial props to Toolbar', () => {
    render(<App />);
    const toolbar = screen.getByTestId('toolbar');
    const props = JSON.parse(toolbar.getAttribute('data-props') || '{}');

    expect(props.shapesCount).toBe(initialState.shapes.length);
    expect(props.canUndo).toBe(false);
    expect(props.canRedo).toBe(false);
    expect(props.currentTool).toBe(initialState.currentTool);
  });

  it('calls useKeyboardControls with the correct selectedShapeId', () => {
    render(<App />);
    expect(useKeyboardControls).toHaveBeenCalledWith(expect.any(Function), null);
  });

  it('calls canvas mousedown event handler from useInteractionManager', () => {
    render(<App />);
    const canvas = screen.getByTestId('svg-canvas');

    fireEvent.mouseDown(canvas);
    expect(mockUseInteractionManagerHandlers.handleMouseDown).toHaveBeenCalled();
  });

  it('calls handleExport from useSvgExport when export button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('export-button'));
    expect(mockUseSvgExportHandlers.handleExport).toHaveBeenCalled();
  });

  it('renders Toolbar control buttons', () => {
    render(<App />);
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
    expect(screen.getByTestId('rect-tool-button')).toBeInTheDocument();
  });
});

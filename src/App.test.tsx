import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { initialState } from './state/reducer';

// Mock child components

vi.mock('./components/SvgCanvas', () => ({
  default: React.forwardRef((props, ref) => (
    <div data-testid="svg-canvas" {...props} ref={ref as React.Ref<HTMLDivElement>}></div>
  )),
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

describe('App', async () => {
  let App: React.ComponentType;

  beforeAll(async () => {
    vi.doMock('./components/Toolbar', async () => {
      const appContextModule = await vi.importActual<typeof import('./state/AppContext')>('./state/AppContext');
      const AppContext = appContextModule.AppContext;

      interface MockedToolbarProps {
        onExport: () => void;
        canUndo: boolean;
        canRedo: boolean;
      }

      const MockedToolbar = ({ onExport, canUndo, canRedo }: MockedToolbarProps) => {
        const context = React.useContext(AppContext);
        if (!context) return <div data-testid="toolbar">Loading...</div>;
        const { state, dispatch } = context;
        const { currentTool, shapes } = state;
        return (
          <div data-testid="toolbar" data-props={JSON.stringify({ canUndo, canRedo })}>
            <button data-testid="clear-button" onClick={() => dispatch({ type: 'CLEAR_CANVAS' })}>Clear</button>
            <button data-testid="export-button" onClick={onExport}>Export</button>
            <button data-testid="undo-button" onClick={() => dispatch({ type: 'UNDO' })}>Undo</button>
            <button data-testid="redo-button" onClick={() => dispatch({ type: 'REDO' })}>Redo</button>
            <button
              data-testid="rect-tool-button"
              onClick={() => dispatch({ type: 'SELECT_TOOL', payload: 'rectangle' })}
              className={currentTool === 'rectangle' ? 'active' : ''}
            >
              Rect
            </button>
            <span>Shapes: {shapes.length}</span>
          </div>
        );
      };
      return { default: MockedToolbar };
    });

    const appModule = await import('./App');
    App = appModule.default;
  });

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
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('svg-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('debug-info')).toBeInTheDocument();
  });

  it('does not render TextInputModal initially', () => {
    render(<App />);
    expect(screen.queryByTestId('text-input-modal')).not.toBeInTheDocument();
  });

  it('passes correct initial state to Toolbar', () => {
    render(<App />);
    const toolbar = screen.getByTestId('toolbar');
    const props = JSON.parse(toolbar.getAttribute('data-props') || '{}');

    expect(props.canUndo).toBe(false);
    expect(props.canRedo).toBe(false);

    expect(screen.getByText(`Shapes: ${initialState.shapes.length}`)).toBeInTheDocument();
    const rectToolButton = screen.getByTestId('rect-tool-button');
    expect(rectToolButton).toHaveClass('active');
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

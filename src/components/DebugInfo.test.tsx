import { render, screen, fireEvent } from '@testing-library/react';
import DebugInfo from './DebugInfo';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HistoryState } from '../state/historyReducer';
import React from 'react';

describe('DebugInfo', () => {
  const mockHistory: HistoryState = {
    past: [],
    present: {
      canvasWidth: 800,
      canvasHeight: 600,
      isCanvasInitialized: true,
      shapes: [],
      selectedShapeId: null,
      drawingState: null,
      currentTool: 'rectangle',
      editingText: null,
      mode: 'idle',
      draggingState: null,
      shapesBeforeDrag: null,
      shapesBeforeRotation: null,
      rotatingState: null,
      resizingState: null,
    },
    future: [],
  };

  beforeEach(() => {
    vi.stubEnv('VITE_DEBUG_MODE', 'true');
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders nothing when VITE_DEBUG_MODE is not true', () => {
    vi.stubEnv('VITE_DEBUG_MODE', 'false');
    const { container } = render(<DebugInfo history={mockHistory} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders debug sections when VITE_DEBUG_MODE is true', () => {
    render(<DebugInfo history={mockHistory} />);
    expect(screen.getByText('Past (0)')).toBeInTheDocument();
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Future (0)')).toBeInTheDocument();
  });

  it('logs to console when "Log to Console" is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<DebugInfo history={mockHistory} />);

    // There are 3 "Log to Console" buttons. Click the first one (Past).
    const logButtons = screen.getAllByText('Log to Console');
    fireEvent.click(logButtons[0]);

    expect(consoleSpy).toHaveBeenCalledWith('[DebugInfo] Past (0):', mockHistory.past);
  });

  it('exports JSON when "Export JSON" is clicked', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    render(<DebugInfo history={mockHistory} />);

    // Clear calls from initial render (Testing Library appends container to body)
    appendChildSpy.mockClear();

    const exportButtons = screen.getAllByText('Export JSON');
    fireEvent.click(exportButtons[0]);

    // Check if Blob was created (indirectly via createObjectURL)
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    const blob = (global.URL.createObjectURL as any).mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);

    // Check if anchor was appended, clicked, and removed
    expect(appendChildSpy).toHaveBeenCalled();
    // Find the call that appended an anchor tag
    const anchorCall = appendChildSpy.mock.calls.find(call => (call[0] as HTMLElement).tagName === 'A');
    expect(anchorCall).toBeDefined();

    const appendedElement = anchorCall![0] as HTMLAnchorElement;
    expect(appendedElement.tagName).toBe('A');
    expect(appendedElement.download).toContain('ponkotsu-state-past');
    expect(appendedElement.href).toContain('mock-url');

    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalledWith(appendedElement);

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });
});

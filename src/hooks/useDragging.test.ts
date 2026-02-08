// src/hooks/useDragging.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragging } from './useDragging';

describe('useDragging', () => {
    let dispatch: ReturnType<typeof vi.fn>;
    let svgRef: React.RefObject<SVGSVGElement | null>;
    let addEventListenerSpy: MockInstance;
    let removeEventListenerSpy: MockInstance;

    beforeEach(() => {
        dispatch = vi.fn();

        const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        mockSvg.getScreenCTM = vi.fn().mockReturnValue({
            a: 1, d: 1, e: 0, f: 0,
        });
        svgRef = { current: mockSvg };

        addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should not attach listeners when mode is not dragging', () => {
        renderHook(() => useDragging(dispatch, 'idle', svgRef));
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should attach listeners when mode is dragging', () => {
        renderHook(() => useDragging(dispatch, 'dragging', svgRef));
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should detach listeners on unmount/mode change', () => {
        const { unmount } = renderHook(() => useDragging(dispatch, 'dragging', svgRef));
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    });

    it('should dispatch START_DRAGGING on handleMouseDownOnShape', () => {
        const { result } = renderHook(() => useDragging(dispatch, 'idle', svgRef));
        const event = {
            preventDefault: vi.fn(),
            clientX: 100,
            clientY: 100,
        } as unknown as React.MouseEvent;

        act(() => {
            result.current.handleMouseDownOnShape('1', event);
        });

        expect(event.preventDefault).toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({
            type: 'START_DRAGGING',
            payload: { shapeId: '1', mouseX: 100, mouseY: 100 }
        });
    });

    it('should dispatch DRAG_SHAPE on mousemove when dragging', () => {
        renderHook(() => useDragging(dispatch, 'dragging', svgRef));

        const event = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
        act(() => {
            window.dispatchEvent(event);
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: 'DRAG_SHAPE',
            payload: { x: 150, y: 150 }
        });
    });

    it('should dispatch STOP_DRAGGING on mouseup', () => {
        renderHook(() => useDragging(dispatch, 'dragging', svgRef));

        const event = new MouseEvent('mouseup');
        act(() => {
            window.dispatchEvent(event);
        });

        expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_DRAGGING' });
    });
});

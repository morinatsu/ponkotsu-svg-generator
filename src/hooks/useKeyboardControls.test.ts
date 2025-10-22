import { renderHook } from '@testing-library/react';
import { useKeyboardControls } from './useKeyboardControls';
import { vi } from 'vitest';
const createMockKeyboardEvent = (
  key: string,
  ctrlKey = false,
  metaKey = false,
  shiftKey = false,
) => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey,
    metaKey,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  vi.spyOn(event, 'preventDefault');
  return event;
};

describe('useKeyboardControls', () => {
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatch = vi.fn();
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
    vi.clearAllMocks();
  });

  const renderKeyboardControlsHook = (selectedShapeId: string | null) => {
    return renderHook(() => useKeyboardControls(dispatch, selectedShapeId));
  };

  it('should add and remove keydown event listener', () => {
    const { unmount } = renderKeyboardControlsHook(null);
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  describe('Undo/Redo actions', () => {
    it.each([
      { key: 'z', ctrlKey: true, metaKey: false, type: 'UNDO' },
      { key: 'z', ctrlKey: false, metaKey: true, type: 'UNDO' },
      { key: 'y', ctrlKey: true, metaKey: false, type: 'REDO' },
      { key: 'y', ctrlKey: false, metaKey: true, type: 'REDO' },
      { key: 'z', ctrlKey: true, metaKey: false, shiftKey: true, type: 'REDO' },
      { key: 'z', ctrlKey: false, metaKey: true, shiftKey: true, type: 'REDO' },
    ])(
      'should dispatch $type for $key with modifiers',
      ({ key, ctrlKey, metaKey, shiftKey, type }) => {
        renderKeyboardControlsHook(null);
        const event = createMockKeyboardEvent(key, ctrlKey, metaKey, shiftKey);
        window.dispatchEvent(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalledWith({ type });
      },
    );
  });

  describe('Delete action', () => {
    it.each([{ key: 'Delete' }, { key: 'Backspace' }])(
      'should dispatch DELETE_SELECTED_SHAPE when a shape is selected and $key is pressed',
      ({ key }) => {
        renderKeyboardControlsHook('shape-1');
        const event = createMockKeyboardEvent(key);
        window.dispatchEvent(event);

        expect(dispatch).toHaveBeenCalledWith({ type: 'DELETE_SELECTED_SHAPE' });
      },
    );

    it('should not dispatch DELETE_SELECTED_SHAPE when no shape is selected', () => {
      renderKeyboardControlsHook(null);
      const event = createMockKeyboardEvent('Delete');
      window.dispatchEvent(event);

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  it('should not dispatch any action for other keys', () => {
    renderKeyboardControlsHook('shape-1');
    const event = createMockKeyboardEvent('a');
    window.dispatchEvent(event);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

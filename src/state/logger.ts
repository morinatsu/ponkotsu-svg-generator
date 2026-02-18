/**
 * A higher-order reducer that logs actions and state changes to the console.
 * This is a generic logger that can wrap any reducer.
 * @param reducer The reducer to wrap.
 * @returns A new reducer that logs actions and state changes.
 */
// Define a generic Reducer type that can accept any state and action shape.
type GenericReducer<S, A> = (state: S, action: A) => S;

// List of high-frequency actions to ignore to prevent console spam and performance issues.
const IGNORED_ACTIONS = new Set(['DRAWING', 'DRAG_SHAPE', 'ROTATE_SHAPE', 'RESIZE_SHAPE']);

export const logger = <S, A extends { type: string }>(
  reducer: GenericReducer<S, A>,
): GenericReducer<S, A> => {
  // In production, disable the logger entirely for performance.
  if (import.meta.env.PROD) {
    return reducer;
  }

  return (state: S, action: A): S => {
    // Skip logging for high-frequency actions to avoid performance bottlenecks.
    if (IGNORED_ACTIONS.has(action.type)) {
      return reducer(state, action);
    }

    console.group(`Action: ${action.type}`);
    console.log('%cPrevious State:', 'color: #9E9E9E; font-weight: 700;', state);
    console.log('%cAction:', 'color: #03A9F4; font-weight: 700;', action);

    const nextState = reducer(state, action);

    console.log('%cNext State:', 'color: #4CAF50; font-weight: 700;', nextState);
    console.groupEnd();

    return nextState;
  };
};

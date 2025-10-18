/**
 * A higher-order reducer that logs actions and state changes to the console.
 * This is a generic logger that can wrap any reducer.
 * @param reducer The reducer to wrap.
 * @returns A new reducer that logs actions and state changes.
 */
// Define a generic Reducer type that can accept any state and action shape.
type GenericReducer<S, A> = (state: S, action: A) => S;

export const logger = <S, A extends { type: string }>(reducer: GenericReducer<S, A>): GenericReducer<S, A> => {
  return (state: S, action: A): S => {
    console.group(`Action: ${action.type}`);
    console.log('%cPrevious State:', 'color: #9E9E9E; font-weight: 700;', state);
    console.log('%cAction:', 'color: #03A9F4; font-weight: 700;', action);

    const nextState = reducer(state, action);

    console.log('%cNext State:', 'color: #4CAF50; font-weight: 700;', nextState);
    console.groupEnd();

    return nextState;
  };
};
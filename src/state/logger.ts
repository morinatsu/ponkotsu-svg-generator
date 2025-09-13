import { type AppState, type Action } from './reducer';

// Define a generic Reducer type
type Reducer = (state: AppState, action: Action) => AppState;

/**
 * A higher-order reducer that logs actions and state changes to the console.
 * @param reducer The reducer to wrap.
 * @returns A new reducer that logs actions and state changes.
 */
export const logger = (reducer: Reducer): Reducer => {
  return (state: AppState, action: Action): AppState => {
    console.group(`Action: ${action.type}`);
    console.log('%cPrevious State:', 'color: #9E9E9E; font-weight: 700;', state);
    console.log('%cAction:', 'color: #03A9F4; font-weight: 700;', action);

    const nextState = reducer(state, action);

    console.log('%cNext State:', 'color: #4CAF50; font-weight: 700;', nextState);
    console.groupEnd();

    return nextState;
  };
};

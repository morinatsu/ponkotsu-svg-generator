import { describe, it, vi } from 'vitest';
import { logger } from './logger';

describe('Logger Performance Benchmark', () => {
  it('measures execution time of high-frequency actions', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dummyReducer = (state: any) => state;
    const wrappedReducer = logger(dummyReducer);
    const initialState = { count: 0 };
    const action = { type: 'DRAG_SHAPE', payload: { x: 10, y: 10 } };

    // Mock console methods to avoid output but count calls
    const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    const start = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      wrappedReducer(initialState, action);
    }

    const end = performance.now();
    const duration = end - start;

    // Restore mocks
    consoleGroupSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();

    // Log result using restored console
    console.log(`\n[Benchmark] 10,000 DRAG_SHAPE actions took: ${duration.toFixed(2)}ms`);
  });
});

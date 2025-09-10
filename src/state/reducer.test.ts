import { describe, it, expect } from 'vitest';
import { reducer, initialState, type ShapeData, type AppState } from './reducer';

describe('reducer', () => {
    it('should return the initial state', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(reducer(initialState, { type: 'UNKNOWN' } as any)).toEqual(initialState);
    });

    it('ADD_SHAPE: should add a new shape to the shapes array', () => {
        const newShape: ShapeData = {
            id: '1',
            type: 'rectangle',
            x: 10,
            y: 10,
            width: 50,
            height: 50,
        };
        const action = { type: 'ADD_SHAPE' as const, payload: newShape };
        const newState = reducer(initialState, action);

        expect(newState.shapes).toHaveLength(1);
        expect(newState.shapes[0]).toEqual(newShape);
    });

    it('DELETE_SELECTED_SHAPE: should delete the selected shape', () => {
        const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };
        const shape2: ShapeData = { id: '2', type: 'rectangle', x: 20, y: 20, width: 60, height: 60 };
        const currentState: AppState = {
            ...initialState,
            shapes: [shape1, shape2],
            selectedShapeId: '1',
        };
        const action = { type: 'DELETE_SELECTED_SHAPE' as const };
        const newState = reducer(currentState, action);

        expect(newState.shapes).toHaveLength(1);
        expect(newState.shapes[0].id).toBe('2');
        expect(newState.selectedShapeId).toBeNull();
    });

    it('DELETE_SELECTED_SHAPE: should do nothing if no shape is selected', () => {
        const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };
        const currentState: AppState = {
            ...initialState,
            shapes: [shape1],
            selectedShapeId: null,
        };
        const action = { type: 'DELETE_SELECTED_SHAPE' as const };
        const newState = reducer(currentState, action);

        expect(newState.shapes).toHaveLength(1);
        expect(newState).toEqual(currentState);
    });

    it('CLEAR_CANVAS: should remove all shapes and reset selection', () => {
        const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };
        const currentState: AppState = {
            ...initialState,
            shapes: [shape1],
            selectedShapeId: '1',
        };
        const action = { type: 'CLEAR_CANVAS' as const };
        const newState = reducer(currentState, action);

        expect(newState.shapes).toHaveLength(0);
        expect(newState.selectedShapeId).toBeNull();
    });

    it('SELECT_SHAPE: should set the selectedShapeId', () => {
        const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };
        const currentState: AppState = {
            ...initialState,
            shapes: [shape1],
            selectedShapeId: null,
        };
        const action = { type: 'SELECT_SHAPE' as const, payload: '1' };
        const newState = reducer(currentState, action);

        expect(newState.selectedShapeId).toBe('1');
    });

    it('SELECT_SHAPE: should deselect by passing null', () => {
        const shape1: ShapeData = { id: '1', type: 'rectangle', x: 10, y: 10, width: 50, height: 50 };
        const currentState: AppState = {
            ...initialState,
            shapes: [shape1],
            selectedShapeId: '1',
        };
        const action = { type: 'SELECT_SHAPE' as const, payload: null };
        const newState = reducer(currentState, action);

        expect(newState.selectedShapeId).toBeNull();
    });
});

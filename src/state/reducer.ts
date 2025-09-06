// The state is defined based on the state of App.tsx.
export interface ShapeData {
    id: string; // Unique ID for each shape
    type: 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface AppState {
    shapes: ShapeData[];
    selectedShapeId: string | null;
    drawingState: ShapeData | null;
}

export const initialState: AppState = {
    shapes: [],
    selectedShapeId: null,
    drawingState: null,
};

// Actions that can be dispatched
export type Action =
    | { type: 'START_DRAWING'; payload: { x: number; y: number } }
    | { type: 'DRAWING'; payload: { x: number; y: number; startX: number; startY: number } }
    | { type: 'END_DRAWING' }
    | { type: 'ADD_SHAPE'; payload: ShapeData }
    | { type: 'SELECT_SHAPE'; payload: string | null }
    | { type: 'DELETE_SELECTED_SHAPE' }
    | { type: 'CLEAR_CANVAS' };

// Reducer function to handle state updates
export const reducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'START_DRAWING':
            return {
                ...state,
                drawingState: {
                    id: 'drawing',
                    type: 'rectangle',
                    x: action.payload.x,
                    y: action.payload.y,
                    width: 0,
                    height: 0,
                },
            };
        case 'DRAWING': {
            if (!state.drawingState) {
                return state;
            }
            const { x, y, startX, startY } = action.payload;
            const newX = Math.min(x, startX);
            const newY = Math.min(y, startY);
            const newWidth = Math.abs(x - startX);
            const newHeight = Math.abs(y - startY);
            return {
                ...state,
                drawingState: {
                    ...state.drawingState,
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                },
            };
        }
        case 'END_DRAWING': {
            if (state.drawingState && state.drawingState.width > 0 && state.drawingState.height > 0) {
                const newShape = { ...state.drawingState, id: crypto.randomUUID() };
                return {
                    ...state,
                    shapes: [...state.shapes, newShape],
                    drawingState: null,
                };
            }
            return {
                ...state,
                drawingState: null,
            };
        }
        case 'ADD_SHAPE':
            return {
                ...state,
                shapes: [...state.shapes, action.payload],
            };
        case 'SELECT_SHAPE':
            return {
                ...state,
                selectedShapeId: action.payload,
            };
        case 'DELETE_SELECTED_SHAPE':
            if (!state.selectedShapeId) return state;
            return {
                ...state,
                shapes: state.shapes.filter(shape => shape.id !== state.selectedShapeId),
                selectedShapeId: null,
            };
        case 'CLEAR_CANVAS':
            return {
                ...state,
                shapes: [],
                selectedShapeId: null,
            };
        default:
            return state;
    }
};
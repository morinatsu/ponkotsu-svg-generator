// The state is defined based on the state of App.tsx.
export interface RectangleData {
    id: string;
    type: 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface EllipseData {
    id: string;
    type: 'ellipse';
    cx: number;
    cy: number;
    rx: number;
    ry: number;
}

export interface LineData {
    id: string;
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TextData {
    id: string;
    type: 'text';
    x: number;
    y: number;
    content: string;
    fontSize: number;
    fill: string;
    fontFamily: string;
}

export type ShapeData = RectangleData | EllipseData | LineData | TextData;

// A temporary type for drawing state, which might not have all properties of a full shape
export type DrawingShape = Omit<RectangleData, 'id'> & { id?: string };

export type Tool = ShapeData['type'];

export interface AppState {
    shapes: ShapeData[];
    selectedShapeId: string | null;
    drawingState: DrawingShape | null; // Use a generic rectangle for drawing preview
    currentTool: Tool;
    editingText: { id: string | null; content: string; x: number; y: number } | null;
}

export const initialState: AppState = {
    shapes: [],
    selectedShapeId: null,
    drawingState: null,
    currentTool: 'rectangle',
    editingText: null,
};

// Actions that can be dispatched
export type Action =
    | { type: 'START_DRAWING'; payload: { x: number; y: number } }
    | { type: 'DRAWING'; payload: { x: number; y: number; startX: number; startY: number } }
    | { type: 'END_DRAWING' }
    | { type: 'ADD_SHAPE'; payload: ShapeData }
    | { type: 'SELECT_SHAPE'; payload: string | null }
    | { type: 'DELETE_SELECTED_SHAPE' }
    | { type: 'CLEAR_CANVAS' }
    | { type: 'SELECT_TOOL'; payload: Tool }
    // Text-related actions
    | { type: 'START_TEXT_EDIT'; payload: { id: string | null; x: number; y: number; content: string } }
    | { type: 'FINISH_TEXT_EDIT'; payload: { content: string } }
    | { type: 'CANCEL_TEXT_EDIT' };

// Reducer function to handle state updates
export const reducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SELECT_TOOL':
            return {
                ...state,
                currentTool: action.payload,
            };
        case 'START_DRAWING':
            return {
                ...state,
                selectedShapeId: null, // Deselect any selected shape
                drawingState: {
                    type: state.currentTool,
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

            // For lines, the start and end points are direct.
            if (state.currentTool === 'line') {
                return {
                    ...state,
                    drawingState: {
                        ...state.drawingState,
                        x: startX,
                        y: startY,
                        width: x - startX, // Use width/height to store end coordinates
                        height: y - startY,
                    },
                };
            }

            // For rectangles and ellipses, calculate top-left and dimensions.
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
            if (!state.drawingState) {
                return { ...state, drawingState: null };
            }
            const { x, y, width, height } = state.drawingState;

            // Do not create a shape if the dimensions are too small
            if (width === 0 && height === 0) {
                return { ...state, drawingState: null };
            }

            let newShape: ShapeData;
            const id = crypto.randomUUID();

            switch (state.currentTool) {
                case 'rectangle':
                    newShape = { id, type: 'rectangle', x, y, width, height };
                    break;
                case 'ellipse':
                    newShape = {
                        id,
                        type: 'ellipse',
                        cx: x + width / 2,
                        cy: y + height / 2,
                        rx: width / 2,
                        ry: height / 2,
                    };
                    break;
                case 'line':
                    newShape = {
                        id,
                        type: 'line',
                        x1: x,
                        y1: y,
                        x2: x + width, // End coordinates are stored in width/height during drawing
                        y2: y + height,
                    };
                    break;
                default:
                    // Should not happen
                    return { ...state, drawingState: null };
            }

            return {
                ...state,
                shapes: [...state.shapes, newShape],
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
        // --- Text editing cases ---
        case 'START_TEXT_EDIT':
            return {
                ...state,
                selectedShapeId: null, // Deselect any selected shape
                editingText: {
                    id: action.payload.id,
                    content: action.payload.content,
                    x: action.payload.x,
                    y: action.payload.y,
                },
            };
        case 'FINISH_TEXT_EDIT': {
            if (!state.editingText) return state;
            const { id, x, y } = state.editingText;
            const { content } = action.payload;

            // If content is empty, do nothing and just cancel.
            if (!content.trim()) {
                return { ...state, editingText: null };
            }

            let newShapes: ShapeData[];
            if (id) {
                // Update existing text shape
                newShapes = state.shapes.map(shape =>
                    shape.id === id && shape.type === 'text'
                        ? { ...shape, content }
                        : shape
                );
            } else {
                // Add new text shape
                const newTextShape: TextData = {
                    id: crypto.randomUUID(),
                    type: 'text',
                    x,
                    y,
                    content,
                    fontSize: 16,
                    fill: '#000000',
                    fontFamily: 'Meiryo',
                };
                newShapes = [...state.shapes, newTextShape];
            }
            return {
                ...state,
                shapes: newShapes,
                editingText: null,
            };
        }
        case 'CANCEL_TEXT_EDIT':
            return {
                ...state,
                editingText: null,
            };
        default:
            return state;
    }
};
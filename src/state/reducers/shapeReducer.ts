import type { AppState, Action, ShapeData, TextData } from '../reducer';

export const shapeReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SELECT_TOOL':
      return {
        ...state,
        currentTool: action.payload,
      };

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
        shapes: state.shapes.filter((shape) => shape.id !== state.selectedShapeId),
        selectedShapeId: null,
      };

    case 'CLEAR_CANVAS':
      return {
        ...state,
        shapes: [],
        selectedShapeId: null,
        shapesBeforeDrag: null,
        draggingState: null,
        drawingState: null,
        mode: 'idle',
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
        newShapes = state.shapes.map((shape) =>
          shape.id === id && shape.type === 'text' ? { ...shape, content } : shape,
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

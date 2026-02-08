// src/state/reducers/resizingReducer.ts
import type { AppState, Action, RectangleData, EllipseData, LineData } from '../../types';
import { getShapeCenter, toLocal, toGlobal } from '../../utils/geometry';

export const resizingReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'START_RESIZING': {
      const { shapeId, handle, startX, startY, initialShape } = action.payload;
      return {
        ...state,
        mode: 'resizing',
        resizingState: {
          shapeId,
          handle,
          startX,
          startY,
          initialShape,
        },
      };
    }
    case 'RESIZE_SHAPE': {
      if (!state.resizingState) return state;

      const { handle, initialShape } = state.resizingState;
      const { x: mouseX, y: mouseY, shiftKey } = action.payload;

      // Deep copy initial shape to avoid mutation
      const newShape = JSON.parse(JSON.stringify(initialShape));

      // Handle Line resizing (simpler case)
      if (initialShape.type === 'line') {
        const line = newShape as LineData;
        if (handle === 'start') {
          line.x1 = mouseX;
          line.y1 = mouseY;
        } else if (handle === 'end') {
          line.x2 = mouseX;
          line.y2 = mouseY;
        }

        return {
          ...state,
          shapes: state.shapes.map((s) => (s.id === initialShape.id ? line : s)),
        };
      }

      // Handle Rectangle and Ellipse resizing
      // 1. Calculate the center of the INITIAL shape
      const initialCenter = getShapeCenter(initialShape);
      const rotation = 'rotation' in initialShape ? initialShape.rotation : 0;

      // 2. Convert current mouse position to local coordinates relative to the INITIAL center
      const localMouse = toLocal({ x: mouseX, y: mouseY }, initialCenter, rotation);

      // 3. Define initial bounds in local coordinates
      // Since 'toLocal' is relative to center (0,0), we need to derive half-sizes
      let initialLocalBounds: { left: number; top: number; right: number; bottom: number };

      if (initialShape.type === 'rectangle') {
        const halfW = initialShape.width / 2;
        const halfH = initialShape.height / 2;
        initialLocalBounds = {
          left: -halfW,
          top: -halfH,
          right: halfW,
          bottom: halfH,
        };
      } else if (initialShape.type === 'ellipse') {
        initialLocalBounds = {
          left: -initialShape.rx,
          top: -initialShape.ry,
          right: initialShape.rx,
          bottom: initialShape.ry,
        };
      } else {
         return state;
      }

      // 4. Calculate NEW local bounds based on the handle being dragged
      const newLocalBounds = { ...initialLocalBounds };

      switch (handle) {
        case 'nw':
          newLocalBounds.left = localMouse.x;
          newLocalBounds.top = localMouse.y;
          break;
        case 'ne':
          newLocalBounds.right = localMouse.x;
          newLocalBounds.top = localMouse.y;
          break;
        case 'se':
          newLocalBounds.right = localMouse.x;
          newLocalBounds.bottom = localMouse.y;
          break;
        case 'sw':
          newLocalBounds.left = localMouse.x;
          newLocalBounds.bottom = localMouse.y;
          break;
      }

      // 5. Enforce aspect ratio if Shift is pressed
      if (shiftKey) {
        const initialWidth = initialLocalBounds.right - initialLocalBounds.left;
        const initialHeight = initialLocalBounds.bottom - initialLocalBounds.top;
        const aspectRatio = initialWidth / initialHeight;

        // Use logic from test: determine dominant dimension change
        // Or simply: use the dimension that has changed the most relative to initial size?

        const newWidth = Math.abs(newLocalBounds.right - newLocalBounds.left);
        const newHeight = Math.abs(newLocalBounds.bottom - newLocalBounds.top);

        // Correct logic: we should project the new point onto the diagonal that preserves aspect ratio.
        // But simply picking the larger dimension works well for UX.

        // Check which dimension grew/shrank more relative to Aspect Ratio
        if (newWidth / aspectRatio > newHeight) {
             // Width is the driver, adjust height
             const targetHeight = newWidth / aspectRatio;

             if (handle.includes('n')) {
                 newLocalBounds.top = newLocalBounds.bottom - targetHeight;
             } else {
                 newLocalBounds.bottom = newLocalBounds.top + targetHeight;
             }
        } else {
             // Height is the driver, adjust width
             const targetWidth = newHeight * aspectRatio;

             if (handle.includes('w')) {
                 newLocalBounds.left = newLocalBounds.right - targetWidth;
             } else {
                 newLocalBounds.right = newLocalBounds.left + targetWidth;
             }
        }
      }

      // 6. Normalize bounds (handle negative width/height by flipping)
      if (newLocalBounds.left > newLocalBounds.right) {
          const temp = newLocalBounds.left;
          newLocalBounds.left = newLocalBounds.right;
          newLocalBounds.right = temp;
      }
      if (newLocalBounds.top > newLocalBounds.bottom) {
          const temp = newLocalBounds.top;
          newLocalBounds.top = newLocalBounds.bottom;
          newLocalBounds.bottom = temp;
      }


      // 7. Calculate new center in LOCAL coordinates
      const newLocalCenter = {
          x: (newLocalBounds.left + newLocalBounds.right) / 2,
          y: (newLocalBounds.top + newLocalBounds.bottom) / 2
      };

      // 8. Convert new center back to GLOBAL coordinates
      // The local coordinate system was relative to the *initial* center.
      // So we take newLocalCenter (which is offset from initial center) and rotate it back + add initialCenter.
      const newCenterGlobal = toGlobal(newLocalCenter, initialCenter, rotation);

      // 9. Update the shape
      if (initialShape.type === 'rectangle') {
          const rect = newShape as RectangleData;
          rect.width = newLocalBounds.right - newLocalBounds.left;
          rect.height = newLocalBounds.bottom - newLocalBounds.top;
          rect.x = newCenterGlobal.x - rect.width / 2;
          rect.y = newCenterGlobal.y - rect.height / 2;
      } else if (initialShape.type === 'ellipse') {
          const ellipse = newShape as EllipseData;
          ellipse.rx = (newLocalBounds.right - newLocalBounds.left) / 2;
          ellipse.ry = (newLocalBounds.bottom - newLocalBounds.top) / 2;
          ellipse.cx = newCenterGlobal.x;
          ellipse.cy = newCenterGlobal.y;
      }

      return {
        ...state,
        shapes: state.shapes.map((s) => (s.id === initialShape.id ? newShape : s)),
      };
    }
    case 'STOP_RESIZING': {
      return {
        ...state,
        mode: 'idle',
        resizingState: null,
      };
    }
    default:
      return state;
  }
};

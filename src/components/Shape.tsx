import React, { useContext } from 'react';
import type { ShapeData } from '../types';
import { AppContext } from '../state/AppContext';
import { getShapeCenter } from '../utils/geometry';
import Rectangle from './shapes/Rectangle';
import Ellipse from './shapes/Ellipse';
import Line from './shapes/Line';
import Text from './shapes/Text';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isDragging: boolean; // True if ANOTHER shape is being dragged
  isDrawingMode: boolean; // True if the user is currently drawing a new shape
  onMouseDown: (shapeId: string, e: React.MouseEvent) => void;
}

const Shape: React.FC<ShapeProps> = ({
  shape,
  isSelected,
  isDragging,
  isDrawingMode,
  onMouseDown,
}) => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('Shape must be used within an AppContextProvider');
  }
  const { dispatch, wasDraggedRef } = context;

  // Event handlers and ID are attached to the parent group.
  const groupProps = {
    onClick: (e: React.MouseEvent) => {
      if (wasDraggedRef.current) {
        wasDraggedRef.current = false;
        return;
      }
      // Prevent the click from bubbling up to the canvas and triggering deselection.
      e.stopPropagation();
      dispatch({ type: 'SELECT_SHAPE', payload: shape.id });
    },
    onMouseDown: (e: React.MouseEvent) => {
      onMouseDown(shape.id, e);
    },
    onDoubleClick: () => {
      if (shape.type === 'text') {
        dispatch({
          type: 'START_TEXT_EDIT',
          payload: {
            id: shape.id,
            x: shape.x,
            y: shape.y,
            content: shape.content,
          },
        });
      }
    },
    'data-shape-id': shape.id,
    style: { cursor: isSelected ? 'move' : 'pointer' },
  };

  if ('rotation' in shape && shape.rotation !== 0) {
    const center = getShapeCenter(shape);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (groupProps as any).transform = `rotate(${shape.rotation} ${center.x} ${center.y})`;
  }

  // Props for the hitbox element, which is responsible for capturing all pointer events.
  // It should be disabled if another shape is being dragged.
  // Note: In the new structure, the group handles the events, so the hitbox just needs to exist to define the area.
  // However, we need to ensure the click bubbles up to the group.
  const hitboxProps = {
    fill: 'none', // 'none' is crucial for only capturing clicks on the stroke (or fill if we had one)
    stroke: 'transparent',
    strokeWidth: 10,
    style: {
      // If we are dragging another shape or drawing, we don't want this shape to interfere.
      // But if we set pointerEvents to none, the group won't get the event either unless the group has a fill.
      // The group doesn't have a fill.
      // So the children MUST capture the event and let it bubble.
      pointerEvents: isDragging || isDrawingMode ? ('none' as const) : ('visiblePainted' as const),
      cursor: 'grab',
    },
    'data-export-ignore': 'true',
  };

  // The visible shape should never capture pointer events to avoid interfering with the hitbox or group logic?
  // Actually, if the visible shape is clicked, it should also trigger the group handler.
  // But to keep it simple and consistent with the hitbox logic, we can disable pointer events on the visible shape
  // and rely solely on the hitbox (which covers the visible shape + margin).
  const visibleShapeStyle: React.CSSProperties = { pointerEvents: 'none' };

  switch (shape.type) {
    case 'rectangle':
      return (
        <Rectangle
          shape={shape}
          isSelected={isSelected}
          visibleShapeStyle={visibleShapeStyle}
          hitboxProps={hitboxProps}
          groupProps={groupProps}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          shape={shape}
          isSelected={isSelected}
          visibleShapeStyle={visibleShapeStyle}
          hitboxProps={hitboxProps}
          groupProps={groupProps}
        />
      );
    case 'line':
      return (
        <Line
          shape={shape}
          isSelected={isSelected}
          visibleShapeStyle={visibleShapeStyle}
          hitboxProps={hitboxProps}
          groupProps={groupProps}
        />
      );
    case 'text': {
      return (
        <Text
          shape={shape}
          isSelected={isSelected}
          groupProps={groupProps}
          isDragging={isDragging}
          isDrawingMode={isDrawingMode}
        />
      );
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = shape;
      return null;
    }
  }
};

export default Shape;

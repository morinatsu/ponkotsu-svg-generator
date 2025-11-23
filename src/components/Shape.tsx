import React, { useContext } from 'react';
import type { ShapeData } from '../state/reducer';
import { AppContext } from '../state/AppContext';

interface ShapeProps {
  shape: ShapeData;
  isSelected: boolean;
  isDragging: boolean; // True if ANOTHER shape is being dragged
  isDrawingMode: boolean; // True if the user is currently drawing a new shape
}

const Shape: React.FC<ShapeProps> = ({ shape, isSelected, isDragging, isDrawingMode }) => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('Shape must be used within an AppContextProvider');
  }
  const { dispatch, wasDragged } = context;

  // Event handlers and ID are attached to the parent group.
  const groupProps = {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      // ドラッグ操作の直後であれば、選択イベントを無視する
      if (wasDragged.current) {
        return;
      }
      dispatch({ type: 'SELECT_SHAPE', payload: shape.id });
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
    style: { cursor: 'grab' },
  };

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
  };

  // The visible shape should never capture pointer events to avoid interfering with the hitbox or group logic?
  // Actually, if the visible shape is clicked, it should also trigger the group handler.
  // But to keep it simple and consistent with the hitbox logic, we can disable pointer events on the visible shape
  // and rely solely on the hitbox (which covers the visible shape + margin).
  const visibleShapeStyle: React.CSSProperties = { pointerEvents: 'none' };

  switch (shape.type) {
    case 'rectangle':
      return (
        <g {...groupProps}>
          <rect
            key={`${shape.id}-visible`}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={2}
            style={visibleShapeStyle}
          />
          <rect
            key={`${shape.id}-hitbox`}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            {...hitboxProps}
          />
        </g>
      );
    case 'ellipse':
      return (
        <g {...groupProps}>
          <ellipse
            key={`${shape.id}-visible`}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            stroke={isSelected ? 'blue' : 'black'}
            fill="none"
            strokeWidth={2}
            style={visibleShapeStyle}
          />
          <ellipse
            key={`${shape.id}-hitbox`}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
            {...hitboxProps}
          />
        </g>
      );
    case 'line':
      return (
        <g {...groupProps}>
          <line // The visible line
            key={`${shape.id}-visible`}
            x1={shape.x1}
            y1={shape.y1}
            x2={shape.x2}
            y2={shape.y2}
            stroke={isSelected ? 'blue' : 'black'}
            strokeWidth={2}
            style={visibleShapeStyle}
          />
          <line // The hitbox
            key={`${shape.id}-hitbox`}
            x1={shape.x1}
            y1={shape.y1}
            x2={shape.x2}
            y2={shape.y2}
            {...hitboxProps}
          />
        </g>
      );
    case 'text': {
      const lines = shape.content.split('\n');
      const lineHeight = shape.fontSize * 1.2;
      // Text is its own hitbox.
      const textStyle: React.CSSProperties = {
        cursor: 'grab',
        userSelect: 'none',
        pointerEvents: isDragging || isDrawingMode ? 'none' : 'all',
      };
      return (
        <g {...groupProps}>
          <text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fill={isSelected ? 'blue' : shape.fill}
            stroke="none"
            style={textStyle}
          >
            {lines.map((line, index) => (
              <tspan key={index} x={shape.x} dy={index === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
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

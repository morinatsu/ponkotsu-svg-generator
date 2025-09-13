import React from 'react';
import type { ShapeData } from '../state/reducer';

interface ToolbarProps {
  onClear: () => void;
  onExport: () => void;
  shapesCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentTool: ShapeData['type'];
  onToolSelect: (tool: ShapeData['type']) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onClear,
  onExport,
  shapesCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentTool,
  onToolSelect,
}) => {
  const isActive = (tool: ShapeData['type']) => tool === currentTool;

  return (
    <div className="controls">
      <div className="tool-group">
        <button onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button onClick={onRedo} disabled={!canRedo}>Redo</button>
      </div>
      <div className="tool-group">
        <button
          onClick={() => onToolSelect('rectangle')}
          className={isActive('rectangle') ? 'active' : ''}
        >
          長方形
        </button>
        <button
          onClick={() => onToolSelect('ellipse')}
          className={isActive('ellipse') ? 'active' : ''}
        >
          楕円
        </button>
        <button
          onClick={() => onToolSelect('line')}
          className={isActive('line') ? 'active' : ''}
        >
          線
        </button>
      </div>
      <div className="tool-group">
        <button onClick={onClear}>クリア</button>
        <button onClick={onExport} disabled={shapesCount === 0}>エクスポート</button>
      </div>
    </div>
  );
};

export default Toolbar;

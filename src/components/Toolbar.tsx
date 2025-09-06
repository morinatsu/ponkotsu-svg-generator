import React from 'react';

interface ToolbarProps {
  onClear: () => void;
  onExport: () => void;
  shapesCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onClear,
  onExport,
  shapesCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="controls">
      <button onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button onClick={onRedo} disabled={!canRedo}>Redo</button>
      <button onClick={onClear}>クリア</button>
      <button onClick={onExport} disabled={shapesCount === 0}>エクスポート</button>
    </div>
  );
};

export default Toolbar;

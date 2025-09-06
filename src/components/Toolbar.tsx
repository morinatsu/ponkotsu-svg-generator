import React from 'react';

interface ToolbarProps {
  onClear: () => void;
  onExport: () => void;
  shapesCount: number;
}

const Toolbar: React.FC<ToolbarProps> = ({ onClear, onExport, shapesCount }) => {
  return (
    <div className="controls">
      <button onClick={onClear}>クリア</button>
      <button onClick={onExport} disabled={shapesCount === 0}>エクスポート</button>
    </div>
  );
};

export default Toolbar;

import React, { useContext } from 'react';
import type { Tool } from '../types';
import { AppContext } from '../state/AppContext';
import { useSvgExport } from '../hooks/useSvgExport';

const Toolbar: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('Toolbar must be used within an AppContextProvider');
  }
  const { state, dispatch, canUndo, canRedo, svgRef } = context;
  const { currentTool, shapes } = state;
  const { handleExport } = useSvgExport(svgRef);

  const isActive = (tool: Tool) => tool === currentTool;

  const handleToolSelect = (tool: Tool) => {
    dispatch({ type: 'SELECT_TOOL', payload: tool });
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_CANVAS' });
  };

  return (
    <div className="controls">
      <div className="tool-group">
        <button
          onClick={() => handleToolSelect('rectangle')}
          className={isActive('rectangle') ? 'active' : ''}
        >
          長方形
        </button>
        <button
          onClick={() => handleToolSelect('ellipse')}
          className={isActive('ellipse') ? 'active' : ''}
        >
          楕円
        </button>
        <button
          onClick={() => handleToolSelect('line')}
          className={isActive('line') ? 'active' : ''}
        >
          線
        </button>
        <button
          onClick={() => handleToolSelect('text')}
          className={isActive('text') ? 'active' : ''}
        >
          テキスト
        </button>
      </div>
      <div className="tool-group">
        <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}>
          Redo
        </button>
      </div>
      <div className="tool-group">
        <button onClick={handleExport} disabled={shapes.length === 0}>
          エクスポート
        </button>
      </div>
      <div className="tool-group">
        <button onClick={handleClear}>クリア</button>
      </div>
      <div className="tool-group">
        <span>Shapes: {shapes.length}</span>
      </div>
    </div>
  );
};

export default Toolbar;

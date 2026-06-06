import React, { useEffect, useContext, useRef } from 'react';
import { AppContext } from '../state/AppContext';

interface ContextMenuProps {
  x: number;
  y: number;
  shapeId: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, shapeId }) => {
  const context = useContext(AppContext);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!context) return;
    const { dispatch } = context;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        dispatch({ type: 'HIDE_CONTEXT_MENU' });
      }
    };

    const handleScroll = () => {
      dispatch({ type: 'HIDE_CONTEXT_MENU' });
    };

    // Close on any click or scroll outside
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [context]);

  if (!context) return null;
  const { dispatch } = context;

  const handleBringToFront = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'MOVE_TO_FRONT', payload: shapeId });
  };

  const handleSendToBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'MOVE_TO_BACK', payload: shapeId });
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: '4px 0',
        minWidth: '160px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
      }}
    >
      <button
        onClick={handleBringToFront}
        style={{
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>最前面へ移動</span>
      </button>
      <button
        onClick={handleSendToBack}
        style={{
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>最背面に移動</span>
      </button>
    </div>
  );
};

export default ContextMenu;

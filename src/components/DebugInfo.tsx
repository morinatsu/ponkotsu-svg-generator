import React from 'react';
import { type HistoryState } from '../state/historyReducer';

interface DebugInfoProps {
  history: HistoryState;
}

const debugStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: '10px',
  right: '10px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '10px',
  borderRadius: '5px',
  maxHeight: '500px',
  maxWidth: '600px',
  overflow: 'auto',
  fontSize: '14px',
  fontFamily: 'monospace',
  zIndex: 1000,
};

const preStyles: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
};

const DebugInfo: React.FC<DebugInfoProps> = ({ history }) => {
  // VITE_DEBUG_MODEが'true'でない場合は何もレンダリングしない
  if (import.meta.env.VITE_DEBUG_MODE !== 'true') {
    return null;
  }

  const { past, present, future } = history;

  return (
    <div style={debugStyles}>
      <h4>State Viewer</h4>
      <div>
        <h5>Past ({past.length})</h5>
        <pre style={preStyles}>{JSON.stringify(past, null, 2)}</pre>
      </div>
      <div>
        <h5>Present</h5>
        <pre style={preStyles}>{JSON.stringify(present, null, 2)}</pre>
      </div>
      <div>
        <h5>Future ({future.length})</h5>
        <pre style={preStyles}>{JSON.stringify(future, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugInfo;

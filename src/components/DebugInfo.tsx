import React from 'react';
import { type HistoryState } from '../state/historyReducer';

interface DebugInfoProps {
  history: HistoryState;
}

const debugStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: '10px',
  right: '10px',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#e0e0e0',
  padding: '12px',
  borderRadius: '8px',
  maxHeight: '500px',
  maxWidth: '300px',
  overflow: 'auto',
  fontSize: '12px',
  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
  zIndex: 1000,
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  border: '1px solid #444',
};

const sectionStyles: React.CSSProperties = {
  marginBottom: '12px',
  borderBottom: '1px solid #555',
  paddingBottom: '8px',
};

const buttonGroupStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '4px',
};

const buttonStyles: React.CSSProperties = {
  backgroundColor: '#333',
  color: '#81a1c1',
  border: '1px solid #555',
  borderRadius: '4px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '11px',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s',
};

interface DebugSectionProps {
  label: string;
  data: unknown;
  filename: string;
}

const DebugSection: React.FC<DebugSectionProps> = ({ label, data, filename }) => {
  const handleLog = () => {
    console.log(`[DebugInfo] ${label}:`, data);
  };

  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export JSON. Check console for details.');
    }
  };

  return (
    <div style={sectionStyles}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>{label}</div>
      <div style={buttonGroupStyles}>
        <button style={buttonStyles} onClick={handleLog}>
          Log to Console
        </button>
        <button style={buttonStyles} onClick={handleExport}>
          Export JSON
        </button>
      </div>
    </div>
  );
};

const DebugInfo: React.FC<DebugInfoProps> = ({ history }) => {
  // Do not render anything if VITE_DEBUG_MODE is not 'true'
  if (import.meta.env.VITE_DEBUG_MODE !== 'true') {
    return null;
  }

  const { past, present, future } = history;

  return (
    <div style={debugStyles}>
      <h4
        style={{
          marginTop: 0,
          marginBottom: '12px',
          borderBottom: '1px solid #666',
          paddingBottom: '8px',
        }}
      >
        🛠️ State Debugger
      </h4>

      <DebugSection label={`Past (${past.length})`} data={past} filename="ponkotsu-state-past" />

      <DebugSection label="Present" data={present} filename="ponkotsu-state-present" />

      <DebugSection
        label={`Future (${future.length})`}
        data={future}
        filename="ponkotsu-state-future"
      />
    </div>
  );
};

export default DebugInfo;

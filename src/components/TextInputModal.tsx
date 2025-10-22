import React, { useState, useEffect } from 'react';

interface TextInputModalProps {
  initialContent: string;
  onOk: (content: string) => void;
  onCancel: () => void;
}

const TextInputModal: React.FC<TextInputModalProps> = ({ initialContent, onOk, onCancel }) => {
  const [content, setContent] = useState(initialContent);

  // Allow using Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleOk = () => {
    onOk(content);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ marginTop: 0 }}>テキストを編集</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={styles.textarea}
          autoFocus
        />
        <div style={styles.buttons}>
          <button onClick={onCancel} style={styles.button}>
            キャンセル
          </button>
          <button onClick={handleOk} style={{ ...styles.button, ...styles.okButton }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple styling for the modal
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  textarea: {
    width: '100%',
    height: '120px',
    marginBottom: '15px',
    padding: '10px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: '10px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  okButton: {
    backgroundColor: '#007bff',
    color: 'white',
  },
};

export default TextInputModal;

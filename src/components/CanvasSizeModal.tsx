import React, { useState, useEffect } from 'react';

interface CanvasSizeModalProps {
  initialWidth: number;
  initialHeight: number;
  onConfirm: (width: number, height: number) => void;
}

const CanvasSizeModal: React.FC<CanvasSizeModalProps> = ({
  initialWidth,
  initialHeight,
  onConfirm,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isValid, setIsValid] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Update window size on resize, although likely not needed for initial modal
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    validate(width, height);
  }, [width, height, windowSize]);

  const validate = (w: number, h: number) => {
    if (
      w < 200 ||
      h < 200 ||
      w > windowSize.width ||
      h > windowSize.height
    ) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(width, height);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ marginTop: 0 }}>キャンバスサイズ設定</h2>
        <div style={styles.inputGroup}>
          <label style={styles.label}>幅 (Width):</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>高さ (Height):</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={styles.input}
          />
        </div>
        <div style={styles.info}>
          <p>
            設定可能な範囲:
            <br />
            幅: 200 〜 {windowSize.width}
            <br />
            高さ: 200 〜 {windowSize.height}
          </p>
          {!isValid && (
            <p style={{ color: 'red' }}>
              入力値が範囲外です。
            </p>
          )}
        </div>
        <div style={styles.buttons}>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            style={{
              ...styles.button,
              ...styles.confirmButton,
              ...(isValid ? {} : styles.disabledButton),
            }}
          >
            設定して開始
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    width: '400px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  inputGroup: {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    width: '120px',
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    padding: '8px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  info: {
    margin: '20px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

export default CanvasSizeModal;

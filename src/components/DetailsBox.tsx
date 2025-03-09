import { DetailsBoxProps } from '../types';

export const DetailsBox = ({ id, x, y, onClose }: DetailsBoxProps) => (
  <div
    style={{
      position: 'fixed',
      left: x + 150,
      top: y - 50,
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '6px',
      padding: '12px',
      minWidth: '200px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '8px',
      borderBottom: '1px solid #eee',
      paddingBottom: '8px'
    }}>
      <strong>Node Details</strong>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          color: '#666'
        }}
      >
        ×
      </button>
    </div>
    <div>
      <p style={{ margin: '4px 0' }}><strong>ID:</strong> {id}</p>
      <p style={{ margin: '4px 0' }}><strong>Type:</strong> {parseInt(id) % 2 === 1 ? 'Odd' : 'Even'}</p>
      <p style={{ margin: '4px 0' }}><strong>Level:</strong> {
        id === '1' ? '0 (Root)' :
        ['2', '3'].includes(id) ? '1 (Process)' :
        '2 (Sub-Process)'
      }</p>
    </div>
  </div>
); 
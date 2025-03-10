import { DetailsBoxProps } from '../types';
import { Theme, themes } from '../utils/theme';

interface ExtendedDetailsBoxProps extends DetailsBoxProps {
  theme: Theme;
}

export const DetailsBox = ({ id, x, y, onClose, theme }: ExtendedDetailsBoxProps) => {
  const currentTheme = themes[theme];
  
  return (
    <div
      style={{
        position: 'fixed',
        left: x + 150,
        top: y - 50,
        background: currentTheme.legendBg,
        border: `1px solid ${currentTheme.nodeBorder}`,
        borderRadius: '6px',
        padding: '12px',
        minWidth: '200px',
        boxShadow: theme === 'dark' 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        color: currentTheme.text,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px',
        borderBottom: `1px solid ${currentTheme.nodeBorder}`,
        paddingBottom: '8px'
      }}>
        <strong>Node Details</strong>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="details-close-button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            color: currentTheme.text,
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
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
      <style>
        {`
          .details-close-button:hover {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
}; 
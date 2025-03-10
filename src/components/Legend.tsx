import React from 'react';
import { Theme, themes } from '../utils/theme';

export type NodeLevel = '0' | '1' | '2' | '3' | '4';

const legendItems = [
  { color: '#818cf8', label: 'Parent Company (Level 0)', shape: 'rectangle', level: '0' as NodeLevel },
  { color: '#f472b6', label: 'First-Level Subsidiary (Level 1)', shape: 'rectangle', level: '1' as NodeLevel },
  { color: '#4ade80', label: 'Second-Level Subsidiary (Level 2)', shape: 'rectangle', level: '2' as NodeLevel },
  { color: '#fb923c', label: 'Third-Level Subsidiary (Level 3)', shape: 'rectangle', level: '3' as NodeLevel },
  { color: '#a78bfa', label: 'Fourth-Level+ Subsidiary (Level 4)', shape: 'rectangle', level: '4' as NodeLevel },
];

interface LegendProps {
  activeFilters: Set<NodeLevel>;
  onFilterChange: (level: NodeLevel) => void;
  theme: Theme;
}

export function Legend({ activeFilters, onFilterChange, theme }: LegendProps) {
  const currentTheme = themes[theme];

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: currentTheme.legendBg,
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '24px',
      zIndex: 5,
    }}>
      {legendItems.map((item, index) => {
        const isActive = activeFilters.size === 0 || activeFilters.has(item.level);
        return (
          <div
            key={index}
            onClick={() => onFilterChange(item.level)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              background: isActive ? currentTheme.searchBg : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: item.shape === 'circle' ? '20px' : '24px',
              height: '20px',
              background: item.color,
              border: `2px solid ${currentTheme.nodeBorder}`,
              borderRadius: item.shape === 'circle' ? '50%' : '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 0.2s ease',
            }} />
            <span style={{ 
              color: currentTheme.legendText, 
              fontSize: '14px',
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 0.2s ease',
            }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
} 
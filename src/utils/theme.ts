export type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  text: string;
  nodeBg: string;
  nodeBorder: string;
  nodeText: string;
  edgeStroke: string;
  controlsBg: string;
  controlsButton: string;
  legendBg: string;
  legendText: string;
  searchBg: string;
  searchText: string;
}

export const themes: Record<Theme, ThemeColors> = {
  light: {
    background: '#ffffff',
    text: '#475569',
    nodeBg: '#ffffff',
    nodeBorder: '#64748b',
    nodeText: '#475569',
    edgeStroke: '#64748b',
    controlsBg: '#ffffff',
    controlsButton: '#475569',
    legendBg: '#ffffff',
    legendText: '#475569',
    searchBg: '#f1f5f9',
    searchText: '#475569',
  },
  dark: {
    background: '#1e293b',
    text: '#e2e8f0',
    nodeBg: '#334155',
    nodeBorder: '#94a3b8',
    nodeText: '#e2e8f0',
    edgeStroke: '#94a3b8',
    controlsBg: '#334155',
    controlsButton: '#94a3b8',
    legendBg: '#334155',
    legendText: '#e2e8f0',
    searchBg: '#334155',
    searchText: '#e2e8f0',
  },
}; 
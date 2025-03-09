export type LayoutType = 'hierarchical' | 'circular';

export interface DetailsBoxProps {
  id: string;
  x: number;
  y: number;
  onClose: () => void;
}

export interface Position {
  x: number;
  y: number;
}

export interface SelectedNode {
  id: string;
  x: number;
  y: number;
} 
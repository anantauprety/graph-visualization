import { Node, Edge } from 'reactflow';

export const HIERARCHICAL_POSITIONS = {
  '1': { x: 250, y: 5 },
  '2': { x: 100, y: 100 },
  '3': { x: 400, y: 100 },
  '4': { x: 50, y: 200 },
  '5': { x: 200, y: 200 },
  '6': { x: 350, y: 200 },
  '7': { x: 500, y: 200 },
  '8': { x: 650, y: 200 },
  '9': { x: 800, y: 200 },
  '10': { x: 950, y: 200 },
  '11': { x: 1100, y: 200 },
  '12': { x: 1250, y: 200 },
  '13': { x: 550, y: 300 },
  '14': { x: 650, y: 300 },
  '15': { x: 750, y: 300 },
};

export const generateCircularLayout = (inputNodes: Node[]) => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
  
  return inputNodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / inputNodes.length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    return {
      ...node,
      position: { x, y }
    };
  });
};

export const getChildNodeIds = (nodeId: string, edges: Edge[]): string[] => {
  const directChildren = edges
    .filter(edge => edge.source === nodeId)
    .map(edge => edge.target);
  
  const allChildren = [...directChildren];
  directChildren.forEach(childId => {
    allChildren.push(...getChildNodeIds(childId, edges));
  });
  
  return allChildren;
}; 
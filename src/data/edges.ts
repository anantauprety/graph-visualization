import { Edge } from 'reactflow';

// Helper function to calculate percentages for sibling edges
const calculateSiblingPercentages = (edges: Edge[]): Edge[] => {
  const parentChildMap: { [key: string]: string[] } = {};
  
  // Group edges by source (parent)
  edges.forEach(edge => {
    if (!parentChildMap[edge.source]) {
      parentChildMap[edge.source] = [];
    }
    parentChildMap[edge.source].push(edge.target);
  });

  // Calculate percentages for each group of siblings
  return edges.map(edge => {
    const siblings = parentChildMap[edge.source] || [];
    const percentage = Math.round(100 / siblings.length);
    return {
      ...edge,
      label: `${percentage}%`,
      labelStyle: { fill: '#64748b', fontWeight: 500 },
      labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.8 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
    };
  });
};

// Base edges without labels
const baseEdges: Edge[] = [
  // Connections from Start Node
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
  // Connections from Process Node
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e2-5', source: '2', target: '5' },
  // Connections from Process Node 2
  { id: 'e3-6', source: '3', target: '6' },
  { id: 'e3-7', source: '3', target: '7' },
  { id: 'e3-8', source: '3', target: '8' },
  { id: 'e3-9', source: '3', target: '9' },
  { id: 'e3-10', source: '3', target: '10' },
  { id: 'e3-11', source: '3', target: '11' },
  { id: 'e3-12', source: '3', target: '12' },
  // Connections from Sub-Process E
  { id: 'e8-13', source: '8', target: '13' },
  { id: 'e8-14', source: '8', target: '14' },
  { id: 'e8-15', source: '8', target: '15' },
];

// Export edges with calculated percentages
export const initialEdges = calculateSiblingPercentages(baseEdges); 
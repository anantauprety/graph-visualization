import { Node, Edge } from 'reactflow';

interface EntityHierarchy {
  company_name: string;
  company_code: string;
  parent_id: string | null;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export async function fetchEntityHierarchy(): Promise<GraphData> {
  try {
    const response = await fetch('http://localhost:3001/get-entity-hierarchy', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: EntityHierarchy[] = await response.json();
    
    // Convert API data to graph format
    const nodes: Node[] = data.map(entity => ({
      id: entity.company_code,
      type: entity.parent_id ? undefined : 'input', // Root nodes are 'input' type
      data: { label: entity.company_name },
      position: { x: 0, y: 0 }, // Position will be set by the layout algorithm
    }));

    const edges: Edge[] = data
      .filter(entity => entity.parent_id) // Filter out root nodes
      .map(entity => ({
        id: `e${entity.parent_id}-${entity.company_code}`,
        source: entity.parent_id!,
        target: entity.company_code,
        type: 'default',
      }));

    return { nodes, edges };
  } catch (error) {
    console.error('Error fetching entity hierarchy:', error);
    // Rethrow with a more user-friendly message
    throw new Error(
      error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'Unable to connect to API server'
        : 'Failed to load entity hierarchy'
    );
  }
} 
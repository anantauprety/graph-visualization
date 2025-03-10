import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Edge, Node } from 'reactflow';

// Load environment variables
dotenv.config();

// Define the interface for company relationships
export interface CompanyRelation {
  company_code: string;
  company_name: string;
  parent_company_id: string;
  ownership_percentage: number;
  description: string;
}

// Define custom node data type
interface NodeData {
  label: string;
  description: string;
}

// Define custom edge data type
interface EdgeData {
  label: string;
}

// Create a connection pool
const pool = new Pool({
  host: process.env.REDSHIFT_HOST,
  port: parseInt(process.env.REDSHIFT_PORT || '5439'),
  database: process.env.REDSHIFT_DATABASE,
  user: process.env.REDSHIFT_USER,
  password: process.env.REDSHIFT_PASSWORD,
  ssl: process.env.REDSHIFT_SSL === 'true',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
});

// Function to load company relationships from Redshift
export async function loadCompanyRelations(): Promise<CompanyRelation[]> {
  try {
    const client = await pool.connect();
    try {
      const query = `
        WITH RECURSIVE company_hierarchy AS (
          -- Find root companies (those without parents or where parent_company_id is null)
          SELECT 
            company_code,
            company_name,
            parent_company_id,
            ownership_percentage,
            description,
            0 as level
          FROM company_relationships
          WHERE parent_company_id IS NULL
          
          UNION ALL
          
          -- Find children companies
          SELECT 
            cr.company_code,
            cr.company_name,
            cr.parent_company_id,
            cr.ownership_percentage,
            cr.description,
            ch.level + 1
          FROM company_relationships cr
          INNER JOIN company_hierarchy ch ON cr.parent_company_id = ch.company_code
        )
        SELECT * FROM company_hierarchy
        ORDER BY level, company_code;
      `;
      
      const result = await client.query(query);
      return result.rows as CompanyRelation[];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error loading company relations:', error);
    throw error;
  }
}

// Function to convert company relations to graph nodes and edges
export function convertToGraphData(relations: CompanyRelation[]) {
  const nodes = new Map<string, Node<NodeData>>();
  const edges: Edge<EdgeData>[] = [];
  const processedCompanies = new Set<string>();

  // First pass: Create all nodes
  relations.forEach((relation) => {
    // Add current company node if not exists
    if (!nodes.has(relation.company_code)) {
      nodes.set(relation.company_code, {
        id: relation.company_code,
        data: {
          label: relation.company_name,
          description: relation.description
        },
        position: { x: 0, y: 0 }, // Initial position will be set by the layout
      });
    }

    // Add parent company node if exists and not already added
    if (relation.parent_company_id && !nodes.has(relation.parent_company_id)) {
      // Find parent company details from relations
      const parentCompany = relations.find(r => r.company_code === relation.parent_company_id);
      if (parentCompany) {
        nodes.set(relation.parent_company_id, {
          id: relation.parent_company_id,
          data: {
            label: parentCompany.company_name,
            description: parentCompany.description
          },
          position: { x: 0, y: 0 },
        });
      }
    }

    // Create edge if there's a parent relationship
    if (relation.parent_company_id) {
      edges.push({
        id: `${relation.parent_company_id}-${relation.company_code}`,
        source: relation.parent_company_id,
        target: relation.company_code,
        data: {
          label: `${relation.ownership_percentage}%`
        },
      });
    }

    processedCompanies.add(relation.company_code);
  });

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

// Function to close the connection pool
export async function closePool() {
  await pool.end();
}

// Example usage:
// const relations = await loadCompanyRelations();
// const graphData = convertToGraphData(relations);
// closePool(); // Call when shutting down the application 
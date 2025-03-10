import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { loadCompanyRelations, convertToGraphData, closePool } from '../utils/redshiftConnector';
import { generateCircularLayout } from '../utils/layoutUtils';
import { LayoutType, SelectedNode } from '../types';
import { DetailsBox } from './DetailsBox';
import { Legend, NodeLevel } from './Legend';
import { ThemeToggle } from './ThemeToggle';
import { Theme, themes } from '../utils/theme';

export function Graph() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeChildren, setIncludeChildren] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('hierarchical');
  const [theme, setTheme] = useState<Theme>('light');
  const [showEdges, setShowEdges] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<NodeLevel>>(
    new Set(['0', '1', '2', '3', '4'])
  );

  const currentTheme = themes[theme];

  // Get node level based on the number of ancestors
  const getNodeLevel = (nodeId: string): NodeLevel => {
    const parentEdges = edges.filter(edge => edge.target === nodeId);
    if (parentEdges.length === 0) return '0';
    
    let level = 0;
    let currentId = nodeId;
    
    while (true) {
      const parentEdge = edges.find(edge => edge.target === currentId);
      if (!parentEdge) break;
      level++;
      currentId = parentEdge.source;
    }
    
    return Math.min(level, 4).toString() as NodeLevel;
  };

  const getNodeStyle = (nodeId: string) => {
    const level = getNodeLevel(nodeId);
    const colors = {
      '0': '#818cf8', // Root companies
      '1': '#f472b6', // First-level subsidiaries
      '2': '#4ade80', // Second-level subsidiaries
      '3': '#fb923c', // Third-level subsidiaries
      '4': '#a78bfa'  // Fourth-level and deeper subsidiaries
    };
    
    const node = nodesState.find(n => n.id === nodeId);
    const baseStyle = {
      padding: '10px',
      borderWidth: '2px',
      borderStyle: 'solid',
      fontSize: '14px',
      fontWeight: 500,
      textAlign: 'center' as const,
      width: '150px',
      height: '80px',
    };
    
    return {
      ...baseStyle,
      opacity: activeFilters.size === 0 || activeFilters.has(level) ? 1 : 0.2,
      transition: 'all 0.3s ease',
      background: colors[level],
      color: currentTheme.nodeText,
      borderColor: currentTheme.nodeBorder,
    };
  };

  const [nodesState, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load company data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const relations = await loadCompanyRelations();
        const { nodes, edges } = convertToGraphData(relations);
        
        // Apply initial layout
        const positionedNodes = layout === 'circular' 
          ? generateCircularLayout(nodes)
          : nodes.map((node, index) => ({
              ...node,
              position: {
                x: (index % 5) * 200,
                y: Math.floor(index / 5) * 150
              }
            }));

        setNodes(positionedNodes);
        setEdges(edges);
        setError(null);
      } catch (err) {
        setError('Failed to load company data. Please try again later.');
        console.error('Error loading company data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => {
      // Clean up connection pool on unmount
      closePool();
    };
  }, []);

  // Update layout when changed
  useEffect(() => {
    if (nodesState.length === 0) return;

    const updatedNodes = layout === 'circular'
      ? generateCircularLayout(nodesState)
      : nodesState.map((node, index) => ({
          ...node,
          position: {
            x: (index % 5) * 200,
            y: Math.floor(index / 5) * 150
          }
        }));

    setNodes(updatedNodes);
  }, [layout]);

  // Update node styles when filters or theme changes
  useEffect(() => {
    const updatedNodes = nodesState.map(node => ({
      ...node,
      style: getNodeStyle(node.id)
    }));
    setNodes(updatedNodes);
  }, [activeFilters, theme]);

  const getFilteredNodes = useCallback((nodes: Node[], searchTerm: string, includeChildren: boolean) => {
    if (!searchTerm) return nodes;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const directMatches = nodes.filter(node => 
      node.id.toLowerCase().includes(lowerSearchTerm) || 
      node.data.label.toString().toLowerCase().includes(lowerSearchTerm)
    );

    if (!includeChildren) return directMatches;

    const matchingNodeIds = new Set(directMatches.map(node => node.id));
    directMatches.forEach(node => {
      const childEdges = edges.filter(edge => edge.source === node.id);
      const childIds = childEdges.map(edge => edge.target);
      childIds.forEach(id => matchingNodeIds.add(id));
    });

    return nodes.filter(node => matchingNodeIds.has(node.id));
  }, [edges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeMouseEnter = useCallback((event: any, node: Node) => {
    const rect = event.target.getBoundingClientRect();
    setSelectedNode({
      id: node.id,
      x: rect.x,
      y: rect.y
    });
  }, []);

  const onNodeClick = useCallback((event: any, node: Node) => {
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode({
        id: node.id,
        x: rect.x,
        y: rect.y
      });
    }
  }, [selectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filteredNodes = getFilteredNodes(nodesState, value, includeChildren);
    setNodes(filteredNodes.map(node => ({
      ...node,
      style: getNodeStyle(node.id)
    })));
  }, [getFilteredNodes, includeChildren, setNodes, nodesState]);

  const onSearchClear = useCallback(() => {
    setSearchTerm('');
    setNodes(nodesState.map(node => ({
      ...node,
      style: getNodeStyle(node.id)
    })));
  }, [setNodes, nodesState]);

  const onIncludeChildrenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIncludeChildren(checked);
    if (searchTerm) {
      const filteredNodes = getFilteredNodes(nodesState, searchTerm, checked);
      setNodes(filteredNodes.map(node => ({
        ...node,
        style: getNodeStyle(node.id)
      })));
    }
  }, [searchTerm, getFilteredNodes, setNodes, nodesState]);

  const handleFilterChange = useCallback((level: NodeLevel) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(level)) {
        newFilters.delete(level);
      } else {
        newFilters.add(level);
      }
      return newFilters;
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold text-gray-700">Loading company data...</div>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold text-red-600">{error}</div>
    </div>;
  }

  return (
    <div className="h-screen w-full bg-white dark:bg-gray-900">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 w-64">
        <div className="flex items-center gap-2">
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutType)}
            className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="hierarchical">Hierarchical Layout</option>
            <option value="circular">Circular Layout</option>
          </select>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search companies..."
            className="w-full p-2 pr-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          {searchTerm && (
            <button
              onClick={onSearchClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <input
            type="checkbox"
            checked={includeChildren}
            onChange={onIncludeChildrenChange}
            disabled={!searchTerm}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className={!searchTerm ? 'opacity-50' : ''}>Include child companies</span>
        </label>

        <label className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <input
            type="checkbox"
            checked={showEdges}
            onChange={(e) => setShowEdges(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span>Display Edges</span>
        </label>

        <Legend activeFilters={activeFilters} onFilterChange={handleFilterChange} theme={theme} />
      </div>

      <div className="w-full h-full">
        <ReactFlow
          nodes={nodesState}
          edges={showEdges ? edges : []}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      {selectedNode && (
        <DetailsBox
          nodeId={selectedNode.id}
          x={selectedNode.x}
          y={selectedNode.y}
          onClose={() => setSelectedNode(null)}
          theme={theme}
        />
      )}
    </div>
  );
} 
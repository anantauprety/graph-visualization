import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { generateCircularLayout, getChildNodeIds, HIERARCHICAL_POSITIONS } from '../utils/layoutUtils';
import { LayoutType, SelectedNode } from '../types';
import { DetailsBox } from './DetailsBox';
import { Legend, NodeLevel } from './Legend';
import { ThemeToggle } from './ThemeToggle';
import { Theme, themes } from '../utils/theme';
import { initialEdges } from '../data/edges';
import { initialNodes } from '../data/graph-nodes';
import { fetchEntityHierarchy } from '../utils/apiClient';

interface ConfirmationDialogProps {
  data: { nodes: Node[]; edges: any[] } | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  theme: Theme;
}

function ConfirmationDialog({ data, onConfirm, onCancel, loading, error, theme }: ConfirmationDialogProps) {
  const currentTheme = themes[theme];
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: currentTheme.background,
        borderRadius: '8px',
        padding: '20px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}>
        <h3 style={{ 
          margin: 0,
          color: currentTheme.text,
          fontSize: '18px',
          fontWeight: 600,
        }}>
          API Data Preview
        </h3>
        
        {loading && (
          <div style={{ 
            color: currentTheme.text,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Loading API data...
          </div>
        )}
        
        {error && (
          <div style={{ 
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        
        {data && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: currentTheme.searchBg,
            borderRadius: '6px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: currentTheme.text,
          }}>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '8px',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.nodeBorder}`,
              background: 'transparent',
              color: currentTheme.text,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !!error || !data}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: loading || error || !data ? '#9ca3af' : '#3b82f6',
              color: 'white',
              cursor: loading || error || !data ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Apply Data
          </button>
        </div>
      </div>
    </div>
  );
}

export function Graph() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeChildren, setIncludeChildren] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('hierarchical');
  const [theme, setTheme] = useState<Theme>('light');
  const [showEdges, setShowEdges] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<NodeLevel>>(
    new Set(['0', '1', '2', '3'])
  );
  const [useApiData, setUseApiData] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiNodes, setApiNodes] = useState<Node[]>([]);
  const [apiEdges, setApiEdges] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingApiData, setPendingApiData] = useState<{ nodes: Node[]; edges: any[] } | null>(null);

  const currentTheme = themes[theme];

  const getNodeLevel = (nodeId: string): NodeLevel => {
    const id = parseInt(nodeId);
    if (id === 1) return '0';
    if (id <= 3) return '1';
    if (id <= 12) return '2';
    return '3';
  };

  const getNodeStyle = (nodeId: string, nodeType: string | undefined) => {
    const level = getNodeLevel(nodeId);
    const colors = {
      '0': '#818cf8',
      '1': '#f472b6',
      '2': '#4ade80',
      '3': '#fb923c'
    };
    
    const baseStyle = {
      padding: '10px',
      borderWidth: '2px',
      borderStyle: 'solid',
      fontSize: '14px',
      fontWeight: 500,
      textAlign: 'center' as const,
      width: nodeType === 'input' ? '150px' : '80px',
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

  const getInitialNodes = () => {
    const nodes = useApiData ? (apiNodes.length > 0 ? apiNodes : []) : initialNodes;
    const baseNodes = nodes.map((node: Node) => ({
      ...node,
      position: layout === 'circular'
        ? generateCircularLayout(nodes)[nodes.findIndex(n => n.id === node.id)]?.position || node.position
        : HIERARCHICAL_POSITIONS[node.id as keyof typeof HIERARCHICAL_POSITIONS] || {
            x: (parseInt(node.id) % 5) * 300 + 100,
            y: Math.floor(parseInt(node.id) / 5) * 200 + 100
          },
      style: getNodeStyle(node.id, node.type),
    }));

    return baseNodes;
  };

  const [nodesState, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(useApiData ? (apiEdges.length > 0 ? apiEdges : []) : initialEdges);

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
      const childIds = getChildNodeIds(node.id, initialEdges);
      childIds.forEach(id => matchingNodeIds.add(id));
    });

    return nodes.filter(node => matchingNodeIds.has(node.id));
  }, []);

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
    if (!value) {
      setNodes(getInitialNodes());
    } else {
      const filteredNodes = getFilteredNodes(getInitialNodes(), value, includeChildren);
      setNodes(filteredNodes);
    }
  }, [getFilteredNodes, includeChildren, setNodes, layout]);

  const onSearchClear = useCallback(() => {
    setSearchTerm('');
    setNodes(getInitialNodes());
  }, [setNodes, layout]);

  const onIncludeChildrenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIncludeChildren(checked);
    if (!searchTerm) {
      setNodes(getInitialNodes());
    } else {
      const filteredNodes = getFilteredNodes(getInitialNodes(), searchTerm, checked);
      setNodes(filteredNodes);
    }
  }, [searchTerm, getFilteredNodes, setNodes, layout]);

  const handleNodesChange = useCallback((changes: any[]) => {
    const positionChanges = changes.filter(change => change.type === 'position' && change.dragging);
    
    if (positionChanges.length > 0 && layout === 'hierarchical') {
      positionChanges.forEach(change => {
        if (change.position) {
          HIERARCHICAL_POSITIONS[change.id as keyof typeof HIERARCHICAL_POSITIONS] = change.position;
        }
      });
    }
    
    if (positionChanges.length > 0) {
      const updatedChanges = [...changes];
      
      positionChanges.forEach(change => {
        const nodeId = change.id;
        const childIds = getChildNodeIds(nodeId, edges);
        
        if (childIds.length > 0) {
          const originalNode = nodesState.find(n => n.id === nodeId);
          if (originalNode && change.position) {
            const dx = change.position.x - originalNode.position.x;
            const dy = change.position.y - originalNode.position.y;
            
            childIds.forEach(childId => {
              const childNode = nodesState.find(n => n.id === childId);
              if (childNode) {
                const newPosition = {
                  x: childNode.position.x + dx,
                  y: childNode.position.y + dy,
                };
                updatedChanges.push({
                  type: 'position',
                  id: childId,
                  position: newPosition,
                  dragging: change.dragging,
                });
                
                if (layout === 'hierarchical') {
                  HIERARCHICAL_POSITIONS[childId as keyof typeof HIERARCHICAL_POSITIONS] = newPosition;
                }
              }
            });
          }
        }
      });
      
      onNodesChange(updatedChanges);
    } else {
      onNodesChange(changes);
    }
  }, [nodesState, onNodesChange, layout, edges]);

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

  const handleApiToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      setShowDialog(true);
      setApiLoading(true);
      setApiError(null);
      
      // Fetch data but don't apply it yet
      fetchEntityHierarchy()
        .then(({ nodes, edges }) => {
          setPendingApiData({ nodes, edges });
        })
        .catch(error => {
          console.error('API Error:', error);
          setApiError(error instanceof Error ? error.message : 'Failed to fetch data');
        })
        .finally(() => {
          setApiLoading(false);
        });
    } else {
      setUseApiData(false);
      setNodes(getInitialNodes());
      setEdges(initialEdges);
    }
  }, []);

  const handleConfirmApiData = useCallback(() => {
    if (!pendingApiData) return;
    
    setUseApiData(true);
    setApiNodes(pendingApiData.nodes);
    setApiEdges(pendingApiData.edges);
    
    const updatedNodes = pendingApiData.nodes.map(node => ({
      ...node,
      position: layout === 'circular'
        ? generateCircularLayout(pendingApiData.nodes)[pendingApiData.nodes.findIndex(n => n.id === node.id)]?.position || node.position
        : {
            x: (parseInt(node.id) % 5) * 300 + 100,
            y: Math.floor(parseInt(node.id) / 5) * 200 + 100
          },
      style: getNodeStyle(node.id, node.type),
    }));
    
    setNodes(updatedNodes);
    setEdges(pendingApiData.edges);
    setShowDialog(false);
  }, [pendingApiData, layout]);

  const handleCancelApiData = useCallback(() => {
    setShowDialog(false);
    setUseApiData(false);
    setPendingApiData(null);
    setApiError(null);
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: currentTheme.background,
      color: currentTheme.text,
    }}>
      {showDialog && (
        <ConfirmationDialog
          data={pendingApiData}
          onConfirm={handleConfirmApiData}
          onCancel={handleCancelApiData}
          loading={apiLoading}
          error={apiError}
          theme={theme}
        />
      )}
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${currentTheme.nodeBorder}`,
        background: currentTheme.background,
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutType)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.nodeBorder}`,
              background: currentTheme.searchBg,
              color: currentTheme.text,
              cursor: 'pointer',
            }}
          >
            <option value="hierarchical">Hierarchical Layout</option>
            <option value="circular">Circular Layout</option>
          </select>

          <div style={{
            width: '1px',
            height: '24px',
            background: currentTheme.nodeBorder,
          }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '400px',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              background: theme === 'dark' ? currentTheme.controlsBg : 'white',
              border: `1px solid ${currentTheme.nodeBorder}`,
              borderRadius: '8px',
              boxShadow: theme === 'dark' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                  background: currentTheme.searchBg,
                  borderRadius: '6px',
                  padding: '6px 12px',
                  border: theme === 'dark' ? `1px solid ${currentTheme.nodeBorder}` : 'none',
                }}>
                  <input
                    type="text"
                    placeholder="Search nodes by label or ID..."
                    value={searchTerm}
                    onChange={onSearchChange}
                    style={{
                      border: 'none',
                      background: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '14px',
                      color: currentTheme.searchText,
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={onSearchClear}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 4px',
                        color: currentTheme.text,
                        fontSize: '16px',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: searchTerm ? currentTheme.text : `${currentTheme.text}80`,
                  cursor: searchTerm ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}>
                  <input
                    type="checkbox"
                    checked={includeChildren}
                    onChange={onIncludeChildrenChange}
                    disabled={!searchTerm}
                    style={{ 
                      cursor: searchTerm ? 'pointer' : 'not-allowed',
                      opacity: searchTerm ? 1 : 0.5,
                    }}
                  />
                  Include children
                </label>
              </div>
            </div>

            {searchTerm && (
              <div style={{
                position: 'absolute',
                top: '92px',
                left: '0',
                right: '0',
                padding: '8px 12px',
                background: currentTheme.legendBg,
                border: `1px solid ${currentTheme.nodeBorder}`,
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: `${currentTheme.text}99`,
                zIndex: 10,
              }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginTop: '-1px' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="8" />
                </svg>
                {`${getFilteredNodes(nodesState, searchTerm, includeChildren).length} nodes found`}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: currentTheme.text,
              cursor: apiLoading ? 'wait' : 'pointer',
            }}>
              <input
                type="checkbox"
                checked={useApiData}
                onChange={handleApiToggle}
                disabled={apiLoading}
                style={{ cursor: apiLoading ? 'wait' : 'pointer' }}
              />
              Use API Data
              {apiLoading && (
                <span style={{ 
                  fontSize: '12px', 
                  color: `${currentTheme.text}80`,
                  marginLeft: '4px',
                }}>
                  Loading...
                </span>
              )}
            </label>

            {apiError && (
              <span style={{ 
                fontSize: '12px', 
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {apiError}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowEdges(!showEdges)}
            title={`${showEdges ? 'Hide' : 'Display'} Edges`}
            style={{
              background: showEdges ? currentTheme.searchBg : 'transparent',
              border: `1px solid ${currentTheme.nodeBorder}`,
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: currentTheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 3 H10 A2 2 0 0 1 12 5 V19 A2 2 0 0 0 14 21 H19" />
              <circle cx="4" cy="3" r="2" />
              <circle cx="20" cy="21" r="2" />
            </svg>
          </button>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>
      </div>
      <div style={{ flex: 1, background: currentTheme.background }}>
        <style>
          {`
            .react-flow__node {
              transition: all 0.2s ease;
            }
            .react-flow__node:hover {
              transform: translateY(-2px);
            }
            .react-flow__node[data-type="input"] {
              width: 150px;
              height: 80px;
            }
            .react-flow__node[data-type="input"]:hover {
              box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
            }
            .react-flow__node[data-nodeid="2"],
            .react-flow__node[data-nodeid="3"] {
              width: 80px;
              height: 80px;
            }
            .react-flow__controls {
              background: ${currentTheme.controlsBg};
            }
            .react-flow__controls-button {
              background: ${currentTheme.controlsBg};
              border-bottom: 1px solid ${currentTheme.nodeBorder};
              color: ${currentTheme.controlsButton};
            }
            .react-flow__controls-button:hover {
              background: ${currentTheme.searchBg};
            }
            .react-flow__edge-path {
              stroke: ${currentTheme.edgeStroke};
              stroke-width: 2;
              transition: all 0.2s ease;
            }
            .react-flow__edge:hover .react-flow__edge-path {
              stroke: ${currentTheme.text};
              stroke-width: 3;
            }
            .react-flow__edge-text {
              fill: ${currentTheme.text};
              font-size: 12px;
              transition: all 0.2s ease;
            }
            .react-flow__edge:hover .react-flow__edge-text {
              transform: scale(1.05);
            }
            .react-flow__background {
              background: ${currentTheme.background};
            }
            input::placeholder {
              color: ${theme === 'dark' ? 'rgba(226, 232, 240, 0.5)' : 'inherit'};
            }
          `}
        </style>
        {selectedNode && (
          <DetailsBox
            id={selectedNode.id}
            x={selectedNode.x}
            y={selectedNode.y}
            onClose={() => setSelectedNode(null)}
            theme={theme}
          />
        )}
        <ReactFlow
          nodes={nodesState}
          edges={showEdges ? edges : []}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
        >
          <Controls />
          <Background gap={12} size={1} />
          <Legend 
            activeFilters={activeFilters} 
            onFilterChange={handleFilterChange}
            theme={theme}
          />
        </ReactFlow>
      </div>
    </div>
  );
} 
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

import { getNodeStyle } from '../utils/nodeStyles';
import { generateCircularLayout, getChildNodeIds, HIERARCHICAL_POSITIONS } from '../utils/layoutUtils';
import { LayoutType, SelectedNode } from '../types';
import { DetailsBox } from './DetailsBox';
import { initialEdges } from '../data/edges';
import { initialNodes } from '../data/graph-nodes';

export function Graph() {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeChildren, setIncludeChildren] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('hierarchical');

  const getInitialNodes = () => {
    const baseNodes = initialNodes.map((node: Node) => ({
      ...node,
      position: HIERARCHICAL_POSITIONS[node.id as keyof typeof HIERARCHICAL_POSITIONS],
      style: getNodeStyle(node.id, node.type),
    }));

    return layout === 'circular' ? generateCircularLayout(baseNodes) : baseNodes;
  };

  const [nodesState, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const currentNodes = nodesState.map(node => ({
      ...node,
      position: layout === 'circular' 
        ? generateCircularLayout(nodesState)[nodesState.findIndex(n => n.id === node.id)].position
        : HIERARCHICAL_POSITIONS[node.id as keyof typeof HIERARCHICAL_POSITIONS]
    }));
    setNodes(currentNodes);
  }, [layout]);

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

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #eee',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value as LayoutType)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            cursor: 'pointer',
            marginRight: '20px'
          }}
        >
          <option value="hierarchical">Hierarchical Layout</option>
          <option value="circular">Circular Layout</option>
        </select>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '0 0 500px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '6px',
            padding: '6px 12px',
            flex: 1,
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
                  color: '#94a3b8',
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
            fontSize: '14px',
            color: '#64748b',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={includeChildren}
              onChange={onIncludeChildrenChange}
              style={{ cursor: 'pointer' }}
            />
            Include child nodes
          </label>
        </div>
        <div style={{ color: '#64748b', fontSize: '14px' }}>
          {searchTerm ? `${getFilteredNodes(nodesState, searchTerm, includeChildren).length} nodes found` : `${nodesState.length} total nodes`}
        </div>
      </div>
      <div style={{ flex: 1 }}>
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
            .react-flow__node[data-nodeid$="1"]:hover,
            .react-flow__node[data-nodeid$="3"]:hover,
            .react-flow__node[data-nodeid$="5"]:hover,
            .react-flow__node[data-nodeid$="7"]:hover,
            .react-flow__node[data-nodeid$="9"]:hover,
            .react-flow__node[data-nodeid$="11"]:hover {
              box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);
            }
            .react-flow__node[data-nodeid$="2"]:hover,
            .react-flow__node[data-nodeid$="4"]:hover,
            .react-flow__node[data-nodeid$="6"]:hover,
            .react-flow__node[data-nodeid$="8"]:hover,
            .react-flow__node[data-nodeid$="10"]:hover,
            .react-flow__node[data-nodeid$="12"]:hover {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .react-flow__handle {
              background: #64748b;
              width: 8px;
              height: 8px;
            }
            .react-flow__node-default {
              font-size: 14px;
              border-radius: 4px;
              text-align: center;
            }
          `}
        </style>
        {selectedNode && (
          <DetailsBox
            id={selectedNode.id}
            x={selectedNode.x}
            y={selectedNode.y}
            onClose={() => setSelectedNode(null)}
          />
        )}
        <ReactFlow
          nodes={nodesState}
          edges={edges}
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
        </ReactFlow>
      </div>
    </div>
  );
} 
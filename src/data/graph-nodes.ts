import { Node } from 'reactflow';

export const initialNodes: Node[] = [
  // Level 0
  {
    id: '1',
    type: 'input',
    data: { 
      label: "Start Node"
    },
    position: { x: 0, y: 0 }, // Position will be overridden
  },
  // Level 1
  {
    id: '2',
    data: { 
      label: "Process Node"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '3',
    data: { 
      label: "Process Node 2"
    },
    position: { x: 0, y: 0 },
  },
  // Level 2
  {
    id: '4',
    data: { 
      label: "Sub-Process A"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '5',
    data: { 
      label: "Sub-Process B"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '6',
    data: { 
      label: "Sub-Process C"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '7',
    data: { 
      label: "Sub-Process D"
    },
    position: { x: 0, y: 0 },
  },
  // Additional Level 2 nodes
  {
    id: '8',
    data: { 
      label: "Sub-Process E"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '9',
    data: { 
      label: "Sub-Process F"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '10',
    data: { 
      label: "Sub-Process G"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '11',
    data: { 
      label: "Sub-Process H"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '12',
    data: { 
      label: "Sub-Process I"
    },
    position: { x: 0, y: 0 },
  },
  // Level 3 (under Sub-Process E)
  {
    id: '13',
    data: { 
      label: "Task A"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '14',
    data: { 
      label: "Task B"
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '15',
    data: { 
      label: "Task C"
    },
    position: { x: 0, y: 0 },
  },
]; 
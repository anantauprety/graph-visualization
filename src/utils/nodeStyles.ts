export const getNodeStyle = (id: string, type?: string) => {
  const baseStyle = {
    padding: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: type === 'input' ? '150px' : ['2', '3'].includes(id) ? '80px' : '150px',
    height: type === 'input' ? '80px' : ['2', '3'].includes(id) ? '80px' : '60px',
    fontSize: '14px',
  };

  // Start node (blue triangle)
  if (type === 'input') {
    return {
      ...baseStyle,
      background: '#6366f1',
      color: 'white',
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      border: 'none',
    };
  }

  // Level 1 nodes (circles)
  if (['2', '3'].includes(id)) {
    return {
      ...baseStyle,
      background: parseInt(id) % 2 === 1 ? '#ef4444' : '#ffffff',
      color: parseInt(id) % 2 === 1 ? 'white' : 'black',
      borderRadius: '50%',
      border: '1px solid #ddd',
    };
  }

  // Other nodes (rectangles)
  return {
    ...baseStyle,
    background: parseInt(id) % 2 === 1 ? '#ef4444' : '#ffffff',
    color: parseInt(id) % 2 === 1 ? 'white' : 'black',
    border: '1px solid #ddd',
    borderRadius: '4px',
  };
}; 
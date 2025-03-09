import { Graph } from './components/Graph';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <Graph />
      </ReactFlowProvider>
    </div>
  );
}

export default App;

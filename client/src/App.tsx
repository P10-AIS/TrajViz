import { useEffect, useState } from 'react';
import MapWithCanvas from './components/MapWithCanvas';
import type { Trajectory } from './types/Trajectory';
import { drawTrajectory } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import { parseTrajectory } from './utils/parse';

function App() {
  const [trajectories, setTrajectories] = useState<Trajectory[]>([]);

  useEffect(() => {
    const fetchLatestTrajectory = async () => {
      try {
        const response = await fetch('http://localhost:4000/latest');
        const data = await response.json();
        const { trajectory } = data;
        const parsed = parseTrajectory(trajectory);
        setTrajectories(parsed);
      } catch (err) {
        console.error('Failed to fetch trajectory:', err);
      }
    };
    fetchLatestTrajectory()

  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapWithCanvas>
        <CanvasLayer drawMethod={(info) => drawTrajectory(trajectories, info)} />
      </ MapWithCanvas>
    </div>
  );
}


export default App

import MapWithCanvas from './components/MapWithCanvas';

function App() {
  const trajectories = [
    {
      id: 'traj1',
      points: [
        { lat: 51.505, lng: -0.09 },
        { lat: 51.51, lng: -0.1 },
        { lat: 51.515, lng: -0.12 },
      ],
    }
  ]

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapWithCanvas trajectories={trajectories} />
    </div>
  );
}


export default App

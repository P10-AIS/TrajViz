
import Map3034 from './components/Map3034';
import { drawDepthImage, drawPolygons, drawTrajectories } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import SettingsPanel from './components/SettingsPanel';
import { useAppContext } from './contexts/AppContext';
import DataLoader from './components/DataLoader';
import TileLayer3034 from './components/TileLayer3034';
import Map4326 from './components/Map4326';
import TileLayer4326 from './components/TileLayer4326';

function App() {
  const ctx = useAppContext();

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <DataLoader >
        {ctx.showESPG3034 ? (
          <Map3034>
            <>
              {ctx.showMapTiles && <TileLayer3034 />}
              {ctx.showDepthImage && <CanvasLayer drawMethod={(info) => drawDepthImage(ctx.depthImage, ctx.depthImageOpacity, info)} />}
              {ctx.eecOutlineVisible && <CanvasLayer drawMethod={(info) => drawPolygons(ctx.polygons, info)} />}
              {ctx.trajectoriesVisible && <CanvasLayer drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
            </>
          </ Map3034>) : (
          <Map4326>
            <>
              {ctx.showMapTiles && <TileLayer4326 />}
              {ctx.showDepthImage && <CanvasLayer drawMethod={(info) => drawDepthImage(ctx.depthImage, ctx.depthImageOpacity, info)} />}
              {ctx.eecOutlineVisible && <CanvasLayer drawMethod={(info) => drawPolygons(ctx.polygons, info)} />}
              {ctx.trajectoriesVisible && <CanvasLayer drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
            </>
          </ Map4326>
        )}
      </DataLoader>
    </div>
  );
}


export default App

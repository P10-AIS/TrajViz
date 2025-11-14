
import { MapContainer, TileLayer } from "react-leaflet";
import type { Trajectory } from "../types/Trajectory";
import { drawTrajectory } from "../utils/draw";
import CanvasLayer from "./CanvasLayer";

interface props {
  trajectories: Trajectory[]
}

function MapWithCanvas({ trajectories }: props) {
  return (
    <MapContainer
      center={[56.15674, 10.21076]}
      attributionControl={true}
      zoomControl={false}
      zoom={8}
      minZoom={3}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        noWrap={true}
      />
      <CanvasLayer drawMethod={(info) => drawTrajectory(trajectories, info)} />
    </MapContainer>
  );
}

export default MapWithCanvas;
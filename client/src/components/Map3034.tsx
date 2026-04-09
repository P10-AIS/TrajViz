import { MapContainer, ZoomControl } from "react-leaflet";
import type { JSX } from "react";
import { CRS_3034 } from "../assets/crs";
import ZoomWatcher from "./ZoomWatcher";

function Map3034({ children }: { children: JSX.Element }) {
  return (
    <MapContainer
      crs={CRS_3034}
      center={[56.15674, 10.21076]}
      zoom={4}
      minZoom={1}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <ZoomWatcher/>
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  );
}

export default Map3034;

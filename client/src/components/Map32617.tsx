import { MapContainer, ZoomControl } from "react-leaflet";
import type { JSX } from "react";
import { CRS_32617 } from "../assets/crs";
import MapController from "./MapController";

function Map32617({ children }: { children: JSX.Element }) {
  return (
    <MapContainer
      crs={CRS_32617}
      center={[28.220523, -81.240814]}
      zoom={4}
      minZoom={1}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <MapController/>
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  );
}

export default Map32617;

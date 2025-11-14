import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export interface drawInfo {
  map: L.Map;
  canvas: HTMLCanvasElement;
}

interface CanvasLayerProps {
  drawMethod: (info: drawInfo) => void;
}

export default function CanvasLayer({ drawMethod }: CanvasLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = L.DomUtil.create("canvas", "leaflet-canvas-layer");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";

    const overlayPane = map.getPanes().overlayPane;
    overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    function resetAndRedraw() {
      if (!canvasRef.current) return;

      const size = map.getSize();
      canvasRef.current.width = size.x;
      canvasRef.current.height = size.y;

      const bounds = map.getBounds();
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      L.DomUtil.setPosition(canvasRef.current, topLeft);

      drawMethod({ map, canvas: canvasRef.current });
    }

    resetAndRedraw();

    map.on("move zoom resize viewreset zoomend moveend", resetAndRedraw);

    return () => {
      map.off("move zoom resize viewreset zoomend moveend", resetAndRedraw);
      if (canvasRef.current) {
        overlayPane.removeChild(canvasRef.current);
      }
    };
  }, [map, drawMethod]);

  return null;
}

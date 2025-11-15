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
    canvas.style.pointerEvents = "none"; // optional but nice

    const overlayPane = map.getPanes().overlayPane;
    overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    function redraw() {
      if (!canvasRef.current) return;
      drawMethod({ map, canvas: canvasRef.current });
    }

    redraw();
    map.on("move zoom resize zoomend moveend", redraw);

    return () => {
      map.off("move zoom resize zoomend moveend", redraw);
      if (canvasRef.current) overlayPane.removeChild(canvasRef.current);
    };
  }, [map, drawMethod]);

  return null;
}

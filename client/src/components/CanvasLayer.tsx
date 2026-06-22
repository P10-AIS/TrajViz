import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export interface DrawInfo {
  map: L.Map;
  canvas: HTMLCanvasElement;
}

interface CanvasLayerProps {
  drawMethod: (info: DrawInfo) => void;
  zIndex?: number;
}

function CanvasLayer({ drawMethod, zIndex = 0 }: CanvasLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Always call the latest drawMethod without making it an effect dependency.
  const drawMethodRef = useRef(drawMethod);
  useEffect(() => {
    drawMethodRef.current = drawMethod;
    // A new drawMethod means new data/closure (e.g. streaming flush, focus
    // toggle) — repaint immediately with it instead of waiting for the next
    // map "move" event.
    if (canvasRef.current) {
      drawMethodRef.current({ map, canvas: canvasRef.current });
    }
  }, [drawMethod, map]);

  // Canvas DOM node lifecycle: created once per mount, only torn down on
  // unmount or if zIndex actually changes. Never depends on drawMethod.
  useEffect(() => {
    const canvas = L.DomUtil.create("canvas", "leaflet-canvas-layer");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = `${1000 + zIndex}`;
    canvas.style.pointerEvents = "none";

    const mapContainer = map.getContainer();
    mapContainer.appendChild(canvas);
    canvasRef.current = canvas;

    const redraw = () => {
      if (!canvasRef.current) return;
      drawMethodRef.current({ map, canvas: canvasRef.current });
    };

    const resizeCanvas = () => {
      if (!canvasRef.current) return;
      const size = map.getSize();
      canvasRef.current.width = size.x;
      canvasRef.current.height = size.y;
      redraw();
    };

    map.on("move", redraw);
    map.on("resize", resizeCanvas);

    resizeCanvas();
    redraw();

    return () => {
      map.off("move", redraw);
      map.off("resize", resizeCanvas);
      mapContainer.removeChild(canvas);
      canvasRef.current = null;
    };
  }, [map, zIndex]);

  return null;
}

export default CanvasLayer;
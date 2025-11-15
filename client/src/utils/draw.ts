
import type { drawInfo as DrawInfo } from "../components/CanvasLayer";
import type { Bound } from "../types/Bound";
import type { TrajectoriesByZoom } from "../types/TrajectoriesByZoom";

export const drawTrajectory = (trajectories: TrajectoriesByZoom, info: DrawInfo) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (Object.keys(trajectories).length === 0) {
    return;
  }

  const bounds = map.getBounds();
  const viewBox = {
    minLat: bounds.getSouth(),
    minLng: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLng: bounds.getEast(),
  };

  const zoom = map.getZoom();

  trajectories[zoom].forEach((t) => {
    if (t.messages.length === 0) return;
    if (!isBoundingBoxInView(t.boundingBox, viewBox)) return;

    // Convert to screen points
    const pts = t.messages.map((p) => ({
      x: map.latLngToContainerPoint([p.lat, p.lng]).x,
      y: map.latLngToContainerPoint([p.lat, p.lng]).y,
    }));

    // Draw trajectory line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = "rgba(0,100,255,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw start/end markers
    const start = pts[0];
    const end = pts[pts.length - 1];

    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
};

function isBoundingBoxInView(bbox: Bound, view: Bound): boolean {
  return !(
    bbox.maxLat < view.minLat ||
    bbox.minLat > view.maxLat ||
    bbox.maxLng < view.minLng ||
    bbox.minLng > view.maxLng
  );
}
import type { drawInfo as DrawInfo } from "../components/CanvasLayer";
import type { Trajectory } from "../types/Trajectory";

export const drawTrajectory = (trajectories: Trajectory[], info: DrawInfo) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;

  // bg red
  
  const size = map.getSize();
  canvas.width = size.x;
  canvas.height = size.y;
  
  const origin = map.getPixelOrigin();
  console.log("Drawing with origin", origin);
  // ctx.setTransform(1, 0, 0, 1, origin.x, origin.y);
  
  ctx.fillStyle = "rgba(255,0,0,0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ctx.clearRect(origin.x, origin.y, canvas.width, canvas.height);

  trajectories.forEach((t) => {
    if (t.points.length === 0) return;

    // your old point conversion still works
    const pts = t.points.map(p => map.latLngToLayerPoint([p.lat, p.lng]));

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "rgba(0,100,255,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // markers
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


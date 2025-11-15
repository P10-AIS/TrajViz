import type { drawInfo as DrawInfo } from "../components/CanvasLayer";
import type { Trajectory } from "../types/Trajectory";

export const drawTrajectory = (trajectories: Trajectory[], info: DrawInfo) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  trajectories.forEach((t) => {
    if (t.points.length === 0) return;

    const pts = t.points.map((p) => map.latLngToContainerPoint([p.lat, p.lng]));

    // Draw trajectory line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
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

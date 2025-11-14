import type { drawInfo as DrawInfo } from "../components/CanvasLayer";
import type { Trajectory } from "../types/Trajectory";

export const drawTrajectory = (trajectories: Trajectory[], info: DrawInfo) => {
    const { map, canvas } = info;

    const ctx = canvas.getContext('2d')!;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trajectories.forEach((trajectory) => {
      trajectory.points.forEach(({ lat, lng }) => {
        const point = map.latLngToContainerPoint([lat, lng]);
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }
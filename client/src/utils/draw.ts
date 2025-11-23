import type { drawInfo as DrawInfo } from "../components/CanvasLayer";
import type { Bound } from "../types/Bound";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { Trajectory } from "../types/Trajectory";
import type { ZoomLevels } from "../types/ZoomLevels";

export const drawTrajectories = (
  trajectories: ZoomLevels<Trajectory[]>,
  maxTrajectories: number,
  fullTrajectoryFidelity: boolean,
  info: DrawInfo
) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = map.getBounds();
  const viewBox: Bound = {
    minLat: bounds.getSouth(),
    minLng: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLng: bounds.getEast(),
  };

  const zoom = map.getZoom();

  const trajZoom = fullTrajectoryFidelity ? 18 : zoom;

  trajectories[trajZoom]?.slice(0, maxTrajectories).forEach((t) => {
    if (t.messages.length === 0) return;
    if (!isBoundingBoxInView(t.boundingBox, viewBox)) return;

    const pts = t.messages.map((p) => {
      const pt = map.latLngToContainerPoint([p.point.lat, p.point.lng]);
      return { x: pt.x, y: pt.y };
    });

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = "rgba(0,100,255,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();


    const markerLength = 10;
    drawPerpendicular(ctx, pts[0], pts[1], "green", markerLength);
    drawPerpendicular(ctx, pts[pts.length - 1], pts[pts.length - 2], "red", markerLength);
  });
}

export function drawPolygons(
  polygons: ZoomLevels<Polygon[]>,
  info: DrawInfo
) {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = map.getBounds();
  const viewBox: Bound = {
    minLat: bounds.getSouth(),
    minLng: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLng: bounds.getEast(),
  };

  const zoom = map.getZoom();

  polygons[zoom]?.forEach((polygon) => {
    if (!isBoundingBoxInView(polygon.outline.boundingBox, viewBox)) return;

    if (polygon.outline.points.length > 0) {
      ctx.beginPath();
      const start = map.latLngToContainerPoint([polygon.outline.points[0].lat, polygon.outline.points[0].lng]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < polygon.outline.points.length; i++) {
        const pt = map.latLngToContainerPoint([polygon.outline.points[i].lat, polygon.outline.points[i].lng]);
        ctx.lineTo(pt.x, pt.y);
      }

      ctx.closePath();
      ctx.fillStyle = "rgba(255, 165, 0, 0.1)";
      // ctx.fill();
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (polygon.holes) {
      polygon.holes.forEach((hole) => {
        if (!isBoundingBoxInView(hole.boundingBox, viewBox)) return;

        if (hole.points.length === 0) return;
        ctx.beginPath();
        const start = map.latLngToContainerPoint([hole.points[0].lat, hole.points[0].lng]);
        ctx.moveTo(start.x, start.y);

        for (let i = 1; i < hole.points.length; i++) {
          const pt = map.latLngToContainerPoint([hole.points[i].lat, hole.points[i].lng]);
          ctx.lineTo(pt.x, pt.y);
        }

        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,1)";
        // ctx.fill();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  });
}

function isBoundingBoxInView(bbox: Bound, view: Bound): boolean {
  return !(
    bbox.maxLat < view.minLat ||
    bbox.minLat > view.maxLat ||
    bbox.maxLng < view.minLng ||
    bbox.minLng > view.maxLng
  );
}


export const drawGeoImage = (
  geoImage: GeoImage | null,
  opacity: number,
  info: DrawInfo
) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!geoImage) return;

  const { img, area } = geoImage;


  const topRight = map.latLngToContainerPoint([
    area.topRight.lat,
    area.topRight.lng
  ]);

  const bottomLeft = map.latLngToContainerPoint([
    area.bottomLeft.lat,
    area.bottomLeft.lng
  ]);

  const width = topRight.x - bottomLeft.x;
  const height = bottomLeft.y - topRight.y;

  // low opacity for better visibility of other layers
  ctx.globalAlpha = opacity;
  ctx.drawImage(
    img,
    bottomLeft.x,
    topRight.y,
    width,
    height
  );
};


// Draw a perpendicular line at a point given the direction of the segment
const drawPerpendicular = (ctx: CanvasRenderingContext2D, p1: { x: number, y: number }, p2: { x: number, y: number }, color: string, markerLength: number) => {
  // Direction vector of the segment
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Normalize
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const ndx = dx / len;
  const ndy = dy / len;

  // Perpendicular vector
  const px = -ndy;
  const py = ndx;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p1.x - px * markerLength / 2, p1.y - py * markerLength / 2);
  ctx.lineTo(p1.x + px * markerLength / 2, p1.y + py * markerLength / 2);
  ctx.stroke();
};

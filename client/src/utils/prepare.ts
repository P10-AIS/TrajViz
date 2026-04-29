import type { Polygon } from "../types/Polygon";
import { getBoundingBox } from "./bounds";
import type { Trajectory } from "../types/Prediction";
import type { ParsedPolygon, ParsedTrajectory } from "./parse";
import type { ZoomLevels } from "../types/ZoomLevels";
import type { TimePoint } from "../types/Point";
import type { Bound } from "../types/Bound";

export function prepareEezPolygons(parsedPolygons: ParsedPolygon[]): Polygon[] {
    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 20;

    const polygons = parsedPolygons.map((poly) => {

        const zooms = [];

        for (let zoom = 1; zoom <= 18; zoom++) {
            const step =
                maxStep -
                ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));


            const simplifiedHoles = poly.holes
                ? poly.holes.map((hole) => ({
                    points: simplify(hole.points, stepInt),
                    boundingBox: getBoundingBox(hole.points)
                }))
                : undefined;

            zooms.push({
                outline: {
                    points: poly.outline.points,
                    boundingBox: getBoundingBox(poly.outline.points)
                },
                holes: simplifiedHoles,
            });
        }

        return {
            level: zooms,
        };
    });

    return polygons;
}
export function preparePoints(parsedPoints: ParsedTrajectory[], numZoomLevels: number): Trajectory[] {
    // Define the maximum step as a percentage of the total points. 
    // e.g., 0.1 means the most simplified zoom level steps by 10% of the total points.
    const maxStepPercentage = 0.01; 
    const minStep = 1;

    const points = parsedPoints.map((traj) => {
        const zooms: ZoomLevels<{
            padding: boolean[];
            points: TimePoint[];
            boundingBox: Bound;
        }> = [];

        // Calculate maxStep dynamically for THIS specific trajectory
        const totalPoints = traj.points.length;
        const maxStep = Math.max(minStep, totalPoints * maxStepPercentage);

        for (let zoom = 0; zoom < numZoomLevels; zoom++) {
            // Guard against division by zero if numZoomLevels is 1
            const zoomRatio = numZoomLevels > 1 ? zoom / (numZoomLevels - 1) : 0;
            
            const step = maxStep - zoomRatio * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));

            const simplifiedPadding = simplify(traj.padding, stepInt);
            const simplifiedPreds = simplify(traj.points, stepInt);
            const bb = getBoundingBox(simplifiedPreds);

            zooms.push({
                padding: simplifiedPadding,
                points: simplifiedPreds,
                boundingBox: bb,
            });
        }
        
        return {
            historicHorizonM: traj.historicHorizonM,
            trajectoryId: traj.trajectoryId,
            level: zooms, // level 0 is the most simplified
            enabled: true,
        };
    });
    
    return points;
}



function simplify<T>(arr: T[], step: number): T[] {
    if (arr.length <= 2) return arr;

    const result = arr.slice(1, arr.length - 1).filter((_, i) => i % step === 0);

    const first = arr[0];
    const last = arr[arr.length - 1];

    return [first, ...result, last];
}
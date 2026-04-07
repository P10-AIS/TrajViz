import type { Polygon } from "../types/Polygon";
import { getBoundingBox } from "./bounds";
import type { Trajectory } from "../types/Prediction";
import type { ParsedPolygon, ParsedTrajectory } from "./parse";
import type { ZoomLevels } from "../types/ZoomLevels";
import type { Point } from "../types/Point";
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

export function preparePoints(parsedPoints: ParsedTrajectory[]): Trajectory[] {
    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 600;

    const points = parsedPoints.map((pred) => {
        const zooms: ZoomLevels<{
                padding: boolean[];
                points: Point[];
                boundingBox: Bound;
            }> = []

        for (let zoom = 1; zoom <= 18; zoom++) {
            const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));

            const simplifiedPadding = simplify(pred.padding, stepInt);
            const simplifiedPreds = simplify(pred.points, stepInt);
            const bb = getBoundingBox(simplifiedPreds);

            zooms.push({
                padding: simplifiedPadding,
                points: simplifiedPreds,
                boundingBox: bb,
            });
        }
        return {
            trajectoryId: pred.trajectoryId,
            level: zooms,
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
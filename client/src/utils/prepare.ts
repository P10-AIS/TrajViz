import type { Polygon } from "../types/Polygon";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";
import type { Prediction } from "../types/Prediction";
import type { ParsedPolygon, ParsedPrediction, ParsedTrajectory } from "./parse";

export function prepareTrajectories(parsedTrajectories: ParsedTrajectory[]): Trajectory[] {
    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 600;


    const trajectories = parsedTrajectories.map((traj) => {
        const zooms = [];

        for (let zoom = 1; zoom <= 18; zoom++) {
            const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));

            const messages = simplify(traj.messages, stepInt);
            const points = messages.map(msg => msg.point);
            const simplifiedTrajectory = {
                messages,
                boundingBox: getBoundingBox(points),
            };
            zooms.push(simplifiedTrajectory);
        };

        return {
            id: traj.id,
            level: zooms,
        }
    });

    return trajectories;
}


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

export function preparePredictions(parsedPredictions: ParsedPrediction[]): Prediction[] {
    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 600;

    const predictions = parsedPredictions.map((pred) => {
        const zooms = []

        for (let zoom = 1; zoom <= 18; zoom++) {
            const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));

            const simplifiedMasks = simplify(pred.masks, stepInt);
            const simplifiedPreds = simplify(pred.predictedPoints, stepInt);
            const simplifiedTruths = simplify(pred.truePoints, stepInt);
            const boundingBoxPredicted = getBoundingBox(simplifiedPreds);
            const boundingBoxTrue = getBoundingBox(simplifiedTruths);

            zooms.push({
                masks: simplifiedMasks,
                predictedPoints: simplifiedPreds,
                truePoints: simplifiedTruths,
                boundingBoxPredicted,
                boundingBoxTrue,
            });
        }
        return {
            trajectoryId: pred.trajectoryId,
            level: zooms,
            enabled: true,
        };
    });

    return predictions;
}



function simplify<T>(arr: T[], step: number): T[] {
    if (arr.length <= 2) return arr;

    const result = arr.slice(1, arr.length - 1).filter((_, i) => i % step === 0);

    const first = arr[0];
    const last = arr[arr.length - 1];

    return [first, ...result, last];
}
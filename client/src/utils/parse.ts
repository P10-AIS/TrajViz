import type { PredictionStep } from "../types/Prediction";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";

// type RawPoint = {
//     lat: number;
//     lng: number;
//     rot: number;
//     sog: number;
//     cog: number;
//     heading: number;
//     vessel_type: string;
//     draught: number;
// }

type RawPoint = Array<number>
type RawTrajectory = Array<RawPoint>
type RawPredictionStep = {
    step: number;
    predictions: number[][][];
};

export function parseTrajectory(data: RawTrajectory[]): Trajectory[] {
    return data.map((traj, idx) => {
        const messages = traj.map((pt) => ({
            point: { lat: pt[0], lng: pt[1] },
            heading: pt[5],
        }));

        const points = messages.map(msg => msg.point);

        return {
            id: idx,
            boundingBox: getBoundingBox(points),
            messages,
        };
    })
}

export function parsePredictionSteps(data: RawPredictionStep[]): PredictionStep[] {
    return data.map((predStep) => parsePredictionStep(predStep));
}

function parsePredictionStep(data: RawPredictionStep): PredictionStep {

    const step = data.step;

    const predictions = data.predictions.map((pred, idx) => {
        const predictedPoints = pred.map(pt => ({
            lat: pt[0],
            lng: pt[1],
        }));
        const truePoints = pred.map(pt => ({
            lat: pt[2],
            lng: pt[3],
        }));

        return {
            trajectoryId: idx,
            predictedPoints,
            truePoints,
            boundingBoxPredicted: getBoundingBox(predictedPoints),
            boundingBoxTrue: getBoundingBox(truePoints),
        };
    });

    return {
        step,
        predictions,
    };
}


import { getBoundingBox } from "./bounds";

type RawPoint = Array<number>
type RawTrajectory = Array<RawPoint>
type RawMultiPolygon = number[][][][];
type RawPredictions = {
    predictions: number[][][];
}

export type ParsedTrajectory = {
    id: number;
    messages: { point: { lat: number; lng: number }; }[];
    boundingBox: { minLat: number; minLng: number; maxLat: number; maxLng: number };
};

export type ParsedPolygon = {
    outline: {
        boundingBox: { minLat: number; minLng: number; maxLat: number; maxLng: number };
        points: { lat: number; lng: number }[];
    };
    holes?: {
        boundingBox: { minLat: number; minLng: number; maxLat: number; maxLng: number };
        points: { lat: number; lng: number }[];
    }[];
};

export type ParsedPrediction = {
    trajectoryId: number;
    masks: boolean[];
    predictedPoints: { lat: number; lng: number }[];
    truePoints: { lat: number; lng: number }[];
    boundingBoxPredicted: { minLat: number; minLng: number; maxLat: number; maxLng: number };
    boundingBoxTrue: { minLat: number; minLng: number; maxLat: number; maxLng: number };
}

export function parseTrajectories(data: RawTrajectory[]): ParsedTrajectory[] {
    return data.map((traj, idx) => {
        const messages = traj.map((pt) => ({
            point: { lat: pt[0], lng: pt[1] },
        }));

        const points = messages.map(msg => msg.point);

        return {
            id: idx,
            boundingBox: getBoundingBox(points),
            messages,
        };
    })
}

export function parseMultiPolygon(data: RawMultiPolygon): ParsedPolygon[] {
    return data.map((polygon) => {
        const outlineCoords = polygon[0].map((coord) => ({ lat: coord[1], lng: coord[0] }));
        const holesCoords = polygon.slice(1).map((ring) =>
            ring.map((coord) => ({ lat: coord[1], lng: coord[0] }))
        );

        return {
            outline: {
                boundingBox: getBoundingBox(outlineCoords),
                points: outlineCoords
            },
            holes: holesCoords.length > 0
                ? holesCoords.map((hole) => ({
                    boundingBox: getBoundingBox(hole),
                    points: hole
                }))
                : undefined,
            boundingBox: getBoundingBox(outlineCoords)
        };
    });
}

export function parsePredictions(data: RawPredictions): ParsedPrediction[] {
    const predictions = data.predictions.map((pred, idx) => {
        const masks = pred.map(pt => pt[0] === 1);

        const predictedPoints = pred.map(pt => ({
            lat: pt[1],
            lng: pt[2],
        }));
        const truePoints = pred.map(pt => ({
            lat: pt[3],
            lng: pt[4],
        }));

        return {
            trajectoryId: idx,
            masks,
            predictedPoints,
            truePoints,
            boundingBoxPredicted: getBoundingBox(predictedPoints),
            boundingBoxTrue: getBoundingBox(truePoints),
        };
    });

    return predictions;
}


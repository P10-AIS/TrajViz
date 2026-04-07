import { getBoundingBox } from "./bounds";

type RawMultiPolygon = number[][][][];
export type RawPoints = {
    points: number[][][];
}

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

export type ParsedTrajectory = {
    trajectoryId: number;
    padding: boolean[];
    points: { lat: number; lng: number }[];
    boundingBox: { minLat: number; minLng: number; maxLat: number; maxLng: number };
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

export function parsePoints(data: RawPoints): ParsedTrajectory[] {
    const predictions = data.points.map((pred, idx) => {
        const padding = pred.map(pt => (pt[0] === undefined || pt[0] === null));
        const points = pred.map(pt => ({
            lat: pt[0],
            lng: pt[1],
        }));

        return {
            trajectoryId: idx,
            padding,
            points,
            boundingBox: getBoundingBox(points),
        };
    });

    return predictions;
}


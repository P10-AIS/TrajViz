import type { Projection } from "./projection";

export type DrawConfig = {
    colors: {
        label: string;
        prediction: string;
        polygonStroke: string;
        start: string;
        end: string;
    };
    dotsZoom: number;
    radiusScale: number;
    lineWidthScale: number;
    dashPattern: number[];
    numZoomLevels: number;
    trajectorySimplificationThresholds: Record<Projection, number>
}
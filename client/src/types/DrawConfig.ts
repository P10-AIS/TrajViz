export type DrawConfig = {
    colors: {
        true: string;
        masked: string;
        truePoints: string;
        truePredictedLine: string;
        polygonStroke: string;
        start: string;
        end: string;
    };
    dotsZoom: number;
    radiusScale: number;
    lineWidthScale: number;
    dashPattern: number[];
}
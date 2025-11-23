import type { Bound } from "./Bound";
import type { Point } from "./Point";


export type Prediction = {
    trajectoryId: number;
    truePoints: Point[];
    predictedPoints: Point[];
    boundingBoxPredicted: Bound;
    boundingBoxTrue: Bound;
};

export type PredictionStep = {
    step: number;
    predictions: Prediction[];
};
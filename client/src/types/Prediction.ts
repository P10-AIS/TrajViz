import type { Bound } from "./Bound";
import type { Point } from "./Point";
import type { ZoomLevels } from "./ZoomLevels";


export type Prediction = {
    trajectoryId: number;
    level: ZoomLevels<{
        masks: boolean[];
        truePoints: Point[];
        predictedPoints: Point[];
        boundingBoxPredicted: Bound;
        boundingBoxTrue: Bound;
    }>;
    enabled: boolean;
};
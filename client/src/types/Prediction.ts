import type { Bound } from "./Bound";
import type { Point } from "./Point";
import type { ZoomLevels } from "./ZoomLevels";


export type Trajectory = {
    trajectoryId: number;
    level: ZoomLevels<{
        padding: boolean[];
        points: Point[];
        boundingBox: Bound;
    }>;
    enabled: boolean;
};
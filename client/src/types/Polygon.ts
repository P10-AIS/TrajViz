import type { Bound } from "./Bound";
import type { Point } from "./Point";
import type { ZoomLevels } from "./ZoomLevels";

export type Polygon = {
    level: ZoomLevels<{
        outline: {
            boundingBox: Bound;
            points: Point[]
        };
        holes?: {
            boundingBox: Bound;
            points: Point[]
        }[];
    }>;
};
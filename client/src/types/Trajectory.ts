import type { Bound } from "./Bound";
import type { AisMessage } from "./AisMessage";
import type { ZoomLevels } from "./ZoomLevels";

export type Trajectory = {
  id: number;
  level: ZoomLevels<{
    boundingBox: Bound
    messages: AisMessage[];
  }>
};
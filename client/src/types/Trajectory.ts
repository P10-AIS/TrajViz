import type { Bound } from "./Bound";
import type { AisMessage } from "./AisMessage";

export type Trajectory = {
  id: number;
  boundingBox: Bound
  messages: AisMessage[];
};
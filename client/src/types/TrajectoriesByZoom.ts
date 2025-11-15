import type { Trajectory } from "./Trajectory";

export type TrajectoriesByZoom = {
    [zoom: number]: Trajectory[];
};
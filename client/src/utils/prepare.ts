import type { TrajectoriesByZoom } from "../types/TrajectoriesByZoom";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";

export function prepareTrajectories(trajectories: Trajectory[]): TrajectoriesByZoom {

    const trajectoriesByZoom: TrajectoriesByZoom = {};

    const minZoom = 1;
    const maxZoom = 12;

    const minStep = 1;
    const maxStep = 200;


    for (let zoom = 1; zoom <= 21; zoom++) {
        const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
        const stepInt = Math.max(1, Math.round(step));

        trajectoriesByZoom[zoom] = trajectories.map((traj) => {
            const messages = traj.messages.filter((_, i) => i % stepInt === 0);
            const simplifiedTrajectory: Trajectory = {
                id: traj.id,
                messages,
                boundingBox: getBoundingBox(messages),
            };
            return simplifiedTrajectory;
        });
    }

    return trajectoriesByZoom;
}
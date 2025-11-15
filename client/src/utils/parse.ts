import type { Trajectory } from "../types/Trajectory";

// type RawPoint = {
//     lat: number;
//     lng: number;
//     rot: number;
//     sog: number;
//     cog: number;
//     heading: number;
//     vessel_type: string;
//     draught: number;
// }

type RawPoint = Array<number>
type RawTrajectory = Array<RawPoint>

export function parseTrajectory(data: RawTrajectory[]): Trajectory[] {
    return data.map((traj, idx) => ({
        id: idx,
        points: traj.map((pt) => ({
            lat: pt[0],
            lng: pt[1],
            heading: pt[7],
        })),
    }));
}
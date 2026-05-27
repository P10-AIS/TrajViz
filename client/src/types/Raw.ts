// [lat, lon, timestamp] — exactly what the backend streams
export type RawPoint = [number, number, number];
// A single trajectory is an array of points
export type RawTrajectory = RawPoint[];

export interface RawBeam {
    pts: number[][];
    score: number | null;  // null = pruned beam
}
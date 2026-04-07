import type { RawPoints } from "../utils/parse";

export type RawModelPredictions = {
    [modelName: string]: RawPoints;
};
import type { AppContextType } from "../contexts/AppContext";

type StorageKey =
    | "eezDKOutlineVisible"
    | "eezUSOutlineVisible"
    | "fullTrajectoryFidelity"
    | "fullEezFidelity"
    | "showMapTiles"
    | "showModelPredictions"
    | "showLabels"
    | "trajectoryDensity"
    | "fullPredictionFidelity"
    | "enableShipSizeGuide"
    | "showTrajectoryDots"
    | "showPredictionDots"
    | "drawConfig"
    | "imageOverlays"
    | "showImageOverlay"
    | "projection"
    | "zoom"
    | "center";

export type AppSnapshot = Pick<AppContextType, StorageKey>;

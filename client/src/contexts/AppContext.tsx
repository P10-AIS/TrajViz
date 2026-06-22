import { createContext, useCallback, useContext, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { GeoImage } from '../types/GeoImage';
import type { DrawConfig } from '../types/DrawConfig';
import { Projection } from '../types/projection';
import type { ImageOpacities } from '../types/Opacity';
import { useLocalStorageState } from '../hooks/LocalStorageState';
import type { RawTrajectory, RawPrediction } from '../types/Raw';

export interface AppContextType {
    polygonsDK: Polygon[];
    setPolygonsDK: (polygons: Polygon[]) => void;

    polygonsUS: Polygon[];
    setPolygonsUS: (polygons: Polygon[]) => void;

    eezDKOutlineVisible: boolean;
    setEezDKOutlineVisible: (visible: boolean) => void;

    eezUSOutlineVisible: boolean;
    setEezUSOutlineVisible: (visible: boolean) => void;

    fullFidelity: boolean;
    setFullFidelity: (fidelity: boolean) => void;

    showMapTiles: boolean;
    setShowMapTiles: (show: boolean) => void;

    showModelPredictions: Record<string, boolean>;
    setShowModelPredictions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    // Each prediction now carries its own historic/prediction cutoff
    // alongside its points, since thinning recomputes indices per
    // trajectory. There is no separate per-model cutoff map anymore.
    modelPredictions: Record<string, Map<number, RawPrediction>>;
    setModelPredictions: React.Dispatch<React.SetStateAction<Record<string, Map<number, RawPrediction>>>>;

    showLabels: Record<string, boolean>;
    setShowLabels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    labels: Record<string, Map<number, RawTrajectory>>;
    setLabels: React.Dispatch<React.SetStateAction<Record<string, Map<number, RawTrajectory>>>>;

    trajectoryDensity: number;
    setTrajectoryDensity: (density: number) => void;

    enableShipSizeGuide: boolean;
    setEnableShipSizeGuide: (enable: boolean) => void;

    shipSizeGuideImage: HTMLImageElement | null;
    setShipSizeGuideImage: (image: HTMLImageElement | null) => void;

    showTrajectoryDots: boolean;
    setShowTrajectoryDots: (show: boolean) => void;

    drawConfig: DrawConfig;
    setDrawConfig: (config: DrawConfig) => void;

    imageOverlays: Record<string, GeoImage>;
    setImageOverlays: React.Dispatch<React.SetStateAction<Record<string, GeoImage>>>;

    imageOpacities: ImageOpacities;
    setImageOpacities: React.Dispatch<React.SetStateAction<ImageOpacities>>;

    showImageOverlay: Record<string, boolean>;
    setShowImageOverlay: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    projection: Projection;
    setProjection: React.Dispatch<React.SetStateAction<Projection>>;

    zoom: number;
    setZoom: (zoom: number) => void;

    center: [number, number];
    setCenter: (latlng: [number, number]) => void;

    modelPredictionsInView: Record<string, Set<number>>;
    setModelPredictionsInView: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>>;

    labelsInView: Record<string, Set<number>>;
    setLabelsInView: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>>;

    // ── Pinned trajectories ─────────────────────────────────────────────
    // Single mechanism for trajectory visibility filtering. If a key has a
    // non-empty Set here, ONLY those indices are drawn for that key. If a
    // key has no pins (or an empty set), everything draws for that key.
    // Independent of viewport — panning/zooming/streaming never changes it.
    pinnedTrajectories: Record<string, Set<number>>;
    setPinnedTrajectories: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>>;
    togglePinnedTrajectory: (key: string, idx: number) => void;
    clearPinnedTrajectories: (key: string) => void;

    numBeams: Record<string, number>;
    setNumBeams: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [eezDKOutlineVisible, setDKEezOutlineVisible] = useLocalStorageState("DKK_eezOutlineVisible", false);
    const [eezUSOutlineVisible, setEezUSOutlineVisible] = useLocalStorageState("US_eezOutlineVisible", false);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useLocalStorageState("fullTrajectoryFidelity", false);
    const [showMapTiles, setShowMapTiles] = useLocalStorageState("showMapTiles", true);
    const [showModelPredictions, setShowModelPredictions] = useLocalStorageState("showModelPredictions", {});
    const [showLabels, setShowLabels] = useLocalStorageState("showLabels", {});
    const [enableShipSizeGuide, setEnableShipSizeGuide] = useLocalStorageState("enableShipSizeGuide", false);
    const [showTrajectoryDots, setShowTrajectoryDots] = useLocalStorageState("showTrajectoryDots", false);
    const [trajectoryDensity, setTrajectoryDensity] = useLocalStorageState("trajectoryDensity", 0.1);
    const [showImageOverlay, setShowImageOverlay] = useLocalStorageState("showImageOverlay", {});
    const [projection, setProjection] = useLocalStorageState<Projection>("projection", Projection.EPSG3034);
    const [zoom, setZoom] = useLocalStorageState("zoom", 5);
    const [center, setCenter] = useLocalStorageState<[number, number]>("center", [56.15674, 10.21076]);
    const [imageOpacities, setImageOpacities] = useLocalStorageState("imageOpacities", {});
    const [drawConfig, setDrawConfig] = useLocalStorageState<DrawConfig>("drawConfig", {
        colors: {
            label: "rgba(0,100,255)",
            prediction: "rgba(255,0,0)",
            polygonStroke: "orange",
            start: "green",
            end: "red",
        },
        dotsZoom: 1,
        radiusScale: 3,
        lineWidthScale: 2,
        dashPattern: [4, 4],
        numZoomLevels: 5,
        trajectorySimplificationThresholds: {
            [Projection.EPSG3034]: 7,
            [Projection.EPSG3857]: 11,
            [Projection.EPSG32617]: 10,
        }
    });

    const [polygonsDK, setPolygonsDK] = useState<Polygon[]>([]);
    const [polygonsUS, setPolygonsUS] = useState<Polygon[]>([]);
    const [modelPredictions, setModelPredictions] = useState<Record<string, Map<number, RawPrediction>>>({});
    const [numBeams, setNumBeams] = useState<Record<string, number>>({});
    const [labels, setLabels] = useState<Record<string, Map<number, RawTrajectory>>>({});
    const [shipSizeGuideImage, setShipSizeGuideImage] = useState<HTMLImageElement | null>(null);
    const [imageOverlays, setImageOverlays] = useState<Record<string, GeoImage>>({});
    const [modelPredictionsInView, setModelPredictionsInView] = useState<Record<string, Set<number>>>({});
    const [labelsInView, setLabelsInView] = useState<Record<string, Set<number>>>({});

    // In-memory only — pinning is a transient "what I'm looking at right
    // now" state, not something that should silently persist across reloads.
    const [pinnedTrajectories, setPinnedTrajectories] = useState<Record<string, Set<number>>>({});

    const togglePinnedTrajectory = useCallback((key: string, idx: number) => {
        setPinnedTrajectories(prev => {
            const current = new Set(prev[key] ?? []);
            if (current.has(idx)) current.delete(idx);
            else current.add(idx);
            return { ...prev, [key]: current };
        });
    }, []);

    const clearPinnedTrajectories = useCallback((key: string) => {
        setPinnedTrajectories(prev => {
            if (!prev[key] || prev[key].size === 0) return prev;
            const next = { ...prev };
            next[key] = new Set();
            return next;
        });
    }, []);

    const value: AppContextType = {
        polygonsDK, setPolygonsDK,
        polygonsUS, setPolygonsUS,
        eezDKOutlineVisible, setEezDKOutlineVisible: setDKEezOutlineVisible,
        eezUSOutlineVisible, setEezUSOutlineVisible,
        fullFidelity: fullTrajectoryFidelity, setFullFidelity: setFullTrajectoryFidelity,
        showMapTiles, setShowMapTiles,
        showModelPredictions, setShowModelPredictions,
        modelPredictions, setModelPredictions,
        showLabels, setShowLabels,
        labels, setLabels,
        trajectoryDensity, setTrajectoryDensity,
        enableShipSizeGuide, setEnableShipSizeGuide,
        shipSizeGuideImage, setShipSizeGuideImage,
        showTrajectoryDots, setShowTrajectoryDots,
        drawConfig, setDrawConfig,
        imageOverlays, setImageOverlays,
        imageOpacities, setImageOpacities,
        projection, setProjection,
        showImageOverlay, setShowImageOverlay,
        zoom, setZoom,
        center, setCenter,
        modelPredictionsInView, setModelPredictionsInView,
        labelsInView, setLabelsInView,
        pinnedTrajectories, setPinnedTrajectories, togglePinnedTrajectory, clearPinnedTrajectories,
        numBeams, setNumBeams,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
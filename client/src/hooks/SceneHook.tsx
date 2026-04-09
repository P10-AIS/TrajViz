import { useAppContext } from '../contexts/AppContext';
import { useInViewContext} from '../contexts/InViewContext';
import { useLocalStorageState } from '../contexts/LocalStorageState';
import type { AppSnapshot } from '../types/AppContextSceneState';

export interface Snapshot {
    id: string;
    timestamp: number;
    name: string;
    appData: AppSnapshot; 
    inViewData: Record<string, number[]>; // Stored as arrays for JSON serialization
}

export const useSnapshotManager = () => {
    const appContext = useAppContext();
    const inViewContext = useInViewContext();
    const [snapshots, setSnapshots] = useLocalStorageState<Snapshot[]>('app_snapshots', []);

    const takeSnapshot = (name: string) => {
        // 1. Explicitly pick the keys defined in AppSnapshot to avoid saving large objects/blobs
        const appData: AppSnapshot = {
            eezDKOutlineVisible: appContext.eezDKOutlineVisible,
            eezUSOutlineVisible: appContext.eezUSOutlineVisible,
            fullTrajectoryFidelity: appContext.fullTrajectoryFidelity,
            fullEezFidelity: appContext.fullEezFidelity,
            showMapTiles: appContext.showMapTiles,
            showModelPredictions: appContext.showModelPredictions,
            showLabels: appContext.showLabels,
            trajectoryDensity: appContext.trajectoryDensity,
            fullPredictionFidelity: appContext.fullPredictionFidelity,
            enableShipSizeGuide: appContext.enableShipSizeGuide,
            showTrajectoryDots: appContext.showTrajectoryDots,
            showPredictionDots: appContext.showPredictionDots,
            drawConfig: appContext.drawConfig,
            imageOverlays: appContext.imageOverlays,
            showImageOverlay: appContext.showImageOverlay,
            projection: appContext.projection,
            zoom: appContext.zoom,
            center: appContext.center,
        };

        const serializableInView: Record<string, number[]> = {};
        for (const [key, set] of Object.entries(inViewContext.modelPredictionsInView)) {
            serializableInView[key] = Array.from(set as Set<number>);
        }

        const newSnapshot: Snapshot = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            name,
            appData,
            inViewData: serializableInView
        };

        setSnapshots(prev => [...prev, newSnapshot]);
    };

    const restoreSnapshot = (snapshot: Snapshot) => {
        // 1. Restore AppContext via dynamic setter calls
        // Assumes your context provides setters named 'setShowLabels', etc.
        Object.entries(snapshot.appData).forEach(([key, value]) => {
            const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof appContext;
            const setter = appContext[setterName];
            
            if (typeof setter === 'function') {
                (setter as Function)(value);
            } else {
                console.warn(`Snapshot Manager: No setter found for property "${key}" (expected "${setterName}")`);
            }
        });

        // 2. Restore InViewContext (Convert Arrays back to Sets)
        const restoredInView: Record<string, Set<number>> = {};
        for (const [key, arr] of Object.entries(snapshot.inViewData)) {
            restoredInView[key] = new Set(arr);
        }
        inViewContext.setModelPredictionsInView(restoredInView);
    };

    const deleteSnapshot = (id: string) => {
        setSnapshots(prev => prev.filter(s => s.id !== id));
    };

    return { snapshots, takeSnapshot, restoreSnapshot, deleteSnapshot };
};
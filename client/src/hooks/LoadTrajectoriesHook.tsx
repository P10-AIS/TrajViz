import { useCallback, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { RawTrajectory } from "../utils/draw";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Viewport {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
    zoom: number;
}

// ---------------------------------------------------------------------------
// NDJSON streaming
// ---------------------------------------------------------------------------

async function streamTrajectories(
    url: string,
    onHeader: (source: string, total: number) => void,
    onTrajectory: (pts: RawTrajectory) => void,
    signal: AbortSignal,
): Promise<void> {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Stream request failed: ${response.status}`);
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const msg = JSON.parse(trimmed);
                if (msg.type === "header") onHeader(msg.source, msg.total);
                else if (msg.type === "traj") onTrajectory(msg.pts);
            } catch {
                console.warn("Failed to parse NDJSON line:", trimmed);
            }
        }
    }
}

function buildQuery(vp: Viewport, density: number, totalCount: number, fullFidelity: boolean): string {
    const limit = Math.max(1, Math.ceil(totalCount * density));
    return new URLSearchParams({
        lat_min: String(vp.latMin),
        lat_max: String(vp.latMax),
        lon_min: String(vp.lonMin),
        lon_max: String(vp.lonMax),
        zoom: fullFidelity ? "18" : String(vp.zoom),
        limit: String(limit),
    }).toString();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLoadTrajectories() {
    const {
        setModelPredictions,
        setLabels,
        showModelPredictions,
        showLabels,
        trajectoryDensity,
        fullTrajectoryFidelity,
    } = useAppContext();

    const abortRefs = useRef<Map<string, AbortController>>(new Map());

    return useCallback(async (viewport: Viewport) => {
        // Cancel all in-flight streams from the previous viewport
        for (const [, controller] of abortRefs.current) {
            controller.abort();
        }
        abortRefs.current.clear();

        // Fetch counts — needed to compute per-model limits
        // Names and toggles are already registered by DataLoader on mount
        let predRes: Record<string, { count: number }> = {};
        let labelRes: Record<string, { count: number }> = {};

        try {
            [predRes, labelRes] = await Promise.all([
                fetch("/api/predictions").then(r => r.json()),
                fetch("/api/labels").then(r => r.json()),
            ]);
        } catch (err) {
            console.error("Failed to fetch model/dataset names:", err);
            return;
        }

        // ── Predictions ────────────────────────────────────────────────────

        for (const modelName of Object.keys(predRes)) {
            if (!showModelPredictions[modelName]) continue;

            const controller = new AbortController();
            abortRefs.current.set(`pred:${modelName}`, controller);

            const query = buildQuery(viewport, trajectoryDensity, predRes[modelName].count, fullTrajectoryFidelity);

            streamTrajectories(
                `/api/predictions/${modelName}?${query}`,
                (_source, _total) => {
                    // Clear old data only when first byte arrives, not before —
                    // keeps the canvas populated during the network wait
                    setModelPredictions(prev => ({ ...prev, [modelName]: [] }));
                },
                (pts) => {
                    setModelPredictions(prev => ({
                        ...prev,
                        [modelName]: [...(prev[modelName] ?? []), pts],
                    }));
                },
                controller.signal,
            ).catch(err => {
                if (err.name !== "AbortError") {
                    console.error(`Failed streaming predictions '${modelName}':`, err);
                }
            });
        }

        // ── Labels ─────────────────────────────────────────────────────────

        for (const datasetName of Object.keys(labelRes)) {
            if (!showLabels[datasetName]) continue;

            const controller = new AbortController();
            abortRefs.current.set(`label:${datasetName}`, controller);

            const query = buildQuery(viewport, trajectoryDensity, labelRes[datasetName].count, fullTrajectoryFidelity);

            streamTrajectories(
                `/api/labels/${datasetName}?${query}`,
                (_source, _total) => {
                    setLabels(prev => ({ ...prev, [datasetName]: [] }));
                },
                (pts) => {
                    setLabels(prev => ({
                        ...prev,
                        [datasetName]: [...(prev[datasetName] ?? []), pts],
                    }));
                },
                controller.signal,
            ).catch(err => {
                if (err.name !== "AbortError") {
                    console.error(`Failed streaming labels '${datasetName}':`, err);
                }
            });
        }
    }, [
        setModelPredictions,
        setLabels,
        showModelPredictions,
        showLabels,
        trajectoryDensity,
        fullTrajectoryFidelity,
    ]);
}
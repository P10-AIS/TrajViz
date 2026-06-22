import { useState } from "react";
import { IoMdPin, IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useAppContext } from "../contexts/AppContext";

function PinPanel() {
    const appCtx = useAppContext();
    const [hidden, setHidden] = useState(true);

    function handleToggle(key: string, idx: number, _: boolean) {
        appCtx.togglePinnedTrajectory(key, idx);
    }

    function handlePinAll(key: string, ids: Set<number>) {
        appCtx.setPinnedTrajectories(prev => {
            const set = new Set(prev[key] ?? []);
            for (const id of ids) set.add(id);
            return { ...prev, [key]: set };
        });
    }

    function handleClearAll(key: string) {
        appCtx.clearPinnedTrajectories(key);
    }

    const hasPreds = Object.values(appCtx.modelPredictionsInView).some(s => s.size > 0);
    const hasLabels = Object.values(appCtx.labelsInView).some(s => s.size > 0);

    return (
        <div className="bg-white rounded p-4 shadow-lg overflow-auto text-slate-600 text-sm">
            {hidden && (
                <div className="flex">
                    <button onClick={() => setHidden(false)}><IoMdPin size={24} /></button>
                </div>
            )}

            {!hidden && (
                <div className="w-72 flex flex-col space-y-2 max-h-[80vh] overflow-y-auto">
                    <div className="flex flex-row items-center justify-between sticky top-0 bg-white pb-1">
                        <div className="font-bold">Pinned</div>
                        <button
                            className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600"
                            onClick={() => setHidden(true)}
                        >
                            <IoMdClose size={24} />
                        </button>
                    </div>

                    <hr className="border-slate-300" />

                    {/* Predictions */}
                    {hasPreds && (
                        <>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Predictions</div>
                            {Object.entries(appCtx.modelPredictionsInView).map(([modelName, ids]) => {
                                if (ids.size === 0) return null;
                                const pinned = appCtx.pinnedTrajectories[modelName] ?? new Set();

                                return (
                                    <div key={modelName} className="space-y-1">
                                        <div className="flex flex-row items-center justify-between">
                                            <div className="font-semibold text-xs text-slate-500 truncate">
                                                {modelName}
                                                {pinned.size > 0 && (
                                                    <span className="ml-1 text-blue-600 font-mono">({pinned.size})</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handlePinAll(modelName, ids)} title="Pin all in view">
                                                    <IoMdEye size={16} />
                                                </button>
                                                <button onClick={() => handleClearAll(modelName)} title="Clear pins">
                                                    <IoMdEyeOff size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pl-2 space-y-1 max-h-40 overflow-y-auto border-l border-slate-200 pr-2">
                                            {[...ids].sort((a, b) => a - b).map(id => (
                                                <div key={id} className="flex flex-row items-center justify-between">
                                                    <div className="text-xs truncate">ID {id}</div>
                                                    <input
                                                        type="checkbox"
                                                        checked={pinned.has(id)}
                                                        onChange={e => handleToggle(modelName, id, e.target.checked)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Labels */}
                    {hasLabels && (
                        <>
                            <hr className="border-slate-300" />
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Labels</div>
                            {Object.entries(appCtx.labelsInView).map(([datasetName, ids]) => {
                                if (ids.size === 0) return null;
                                const pinned = appCtx.pinnedTrajectories[datasetName] ?? new Set();

                                return (
                                    <div key={datasetName} className="space-y-1">
                                        <div className="flex flex-row items-center justify-between">
                                            <div className="font-semibold text-xs text-slate-500 truncate">
                                                {datasetName}
                                                {pinned.size > 0 && (
                                                    <span className="ml-1 text-blue-600 font-mono">({pinned.size})</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handlePinAll(datasetName, ids)} title="Pin all in view">
                                                    <IoMdEye size={16} />
                                                </button>
                                                <button onClick={() => handleClearAll(datasetName)} title="Clear pins">
                                                    <IoMdEyeOff size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pl-2 space-y-1 max-h-40 overflow-y-auto border-l border-slate-200 pr-2">
                                            {[...ids].sort((a, b) => a - b).map(id => (
                                                <div key={id} className="flex flex-row items-center justify-between">
                                                    <div className="text-xs truncate">ID {id}</div>
                                                    <input
                                                        type="checkbox"
                                                        checked={pinned.has(id)}
                                                        onChange={e => handleToggle(datasetName, id, e.target.checked)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {!hasPreds && !hasLabels && (
                        <div className="text-slate-400 italic text-center py-4">No trajectories in view.</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PinPanel;
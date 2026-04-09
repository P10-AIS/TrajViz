import { useState } from "react";
import { IoMdEye, IoMdClose, IoMdEyeOff } from "react-icons/io";
import { useInViewContext } from "../contexts/InViewContext";
import { useAppContext } from "../contexts/AppContext";

function InViewPanel() {
    const inViewCtx = useInViewContext();
    const appCtx = useAppContext();
    const [hidden, setHidden] = useState(true);

    function handleTogglePrediction(enabled: boolean, modelName: string, trajectoryId: number) {
        appCtx.setModelPredictions(prev => ({
            ...prev,
            [modelName]: prev[modelName].map(p =>
                p.trajectoryId === trajectoryId
                    ? { ...p, enabled }
                    : p
            )
        }));
    }

    function handleToggleAllPredictions(enabled: boolean, modelName: string) {
        appCtx.setModelPredictions(prev => ({
            ...prev,
            [modelName]: prev[modelName].map(p => ({ ...p, enabled }))
        }));
    }

    return (
        <div className="absolute top-5 right-5 bg-white rounded p-4 shadow-lg z-2000 overflow-auto text-slate-600 text-sm">
            {/* Collapsed */}
            {hidden && (
                <div className="flex">
                    <button
                        className="hover:scale-110 transition-transform hover:cursor-pointer"
                        onClick={() => setHidden(false)}
                        title="In-view predictions"
                    >
                        <IoMdEye size={24} />
                    </button>
                </div>
            )}

            {/* Expanded */}
            {!hidden && (
                <div className="w-72 flex flex-col space-y-2">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between">
                        <div className="font-bold">In View Predictions</div>
                        <button
                            className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600"
                            onClick={() => setHidden(true)}
                        >
                            <IoMdClose size={24} />
                        </button>
                    </div>

                    <hr className="border-slate-300" />

                    {Object.entries(inViewCtx.trajectoriesInView).map(
                        ([modelName, ids]) => {
                            const predictions = appCtx.modelPredictions[modelName];
                            if (!predictions || ids.size === 0) return null;

                            return (
                                <div key={modelName} className="space-y-1">
                                    {/* Model header */}
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="font-semibold text-xs text-slate-500">
                                            {modelName}
                                        </div>
                                        <div className="space-x-2">
                                            <button
                                                className="text-xs underline hover:cursor-pointer"
                                                onClick={() => handleToggleAllPredictions(true, modelName)}
                                            >
                                                <IoMdEye size={16} />
                                            </button>
                                            <button
                                                className="text-xs underline hover:cursor-pointer"
                                                onClick={() => handleToggleAllPredictions(false, modelName)}
                                            >
                                                <IoMdEyeOff size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Individual predictions */}
                                    <div className="pl-2 space-y-1 max-h-40 overflow-y-auto border-l border-slate-200 pr-2">
                                        {[...ids].map((id) => {
                                            const prediction =
                                                predictions.find(p => p.trajectoryId === id);

                                            if (!prediction) return null;

                                            return (
                                                <div
                                                    key={id}
                                                    className="flex flex-row items-center justify-between"
                                                >
                                                    <div className="text-xs truncate">
                                                        ID {id}
                                                    </div>

                                                    <input
                                                        type="checkbox"
                                                        checked={prediction.enabled}
                                                        onChange={(e) => handleTogglePrediction(e.target.checked, modelName, id)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}

export default InViewPanel;

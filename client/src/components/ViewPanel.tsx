import SceneManager from "./SceneManager";
import InViewPanel from "./InViewPanel";

export default function ViewPanel() {
    return (
        // The parent is absolute; children are now relative to this flow
        <div className="absolute top-5 right-5 z-2000 flex flex-row items-start gap-4 pointer-events-none">
            <div className="pointer-events-auto">
                <SceneManager />
            </div>
            <div className="pointer-events-auto">
                <InViewPanel />
            </div>
        </div>
    );
}
import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import { useAppContext } from "../contexts/AppContext";

export default function ZoomWatcher() {
    const ctx = useAppContext();

    const map = useMapEvents({
        zoomend: () => ctx.setZoom(map.getZoom()),
    });

    useEffect(() => {
        ctx.setZoom(map.getZoom());
    }, [map, ctx.zoom]);

    return null;
}
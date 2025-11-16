import L from "leaflet";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function TileLayer4326() {
    const map = useMap();

    useEffect(() => {
        const wmsOptions: L.WMSOptions = {
            noWrap: true,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        };

        const url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        const layer = L.tileLayer(url, wmsOptions);

        map.addLayer(layer);

        return () => {
            map.removeLayer(layer);
        };
    }, [map]);

    return null;
}

export default TileLayer4326;

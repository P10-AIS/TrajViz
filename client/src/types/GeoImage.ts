import type { Point } from "./Point";

export type GeoImage = {
    img: HTMLImageElement;
    area: {
        topRight: Point;
        bottomLeft: Point;
    }
}
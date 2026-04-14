
export const Projection = {
    EPSG3857: "EPSG:3857",
    EPSG3034: "EPSG:3034",
    EPSG32617: "EPSG:32617",
} as const;

export type Projection = typeof Projection[keyof typeof Projection];

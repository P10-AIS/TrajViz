export type Point = {
    lat: number;
    lng: number;
}

export type TimePoint = Point & {
    timestamp: number;
}
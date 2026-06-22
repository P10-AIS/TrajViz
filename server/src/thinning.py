import numpy as np

MIN_ZOOM = 1
MAX_ZOOM = 18
MAX_GAP_SECONDS = 3600  # at MIN_ZOOM, keep ~1 point per hour of trajectory
MIN_GAP_SECONDS = 0     # at MAX_ZOOM, keep every point


def zoom_to_gap_seconds(zoom: int) -> float:
    """
    Maps a zoom level to a minimum time gap (seconds) between kept points.
    zoom=1  -> large gap (very thinned)
    zoom=18 -> gap=0 (all points)
    """
    zoom = max(MIN_ZOOM, min(MAX_ZOOM, zoom))
    t = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)
    gap = MAX_GAP_SECONDS * ((1 - t) ** 2.5)
    return max(MIN_GAP_SECONDS, gap)


def thin_trajectory(points: np.ndarray, zoom: int) -> list[list]:
    """
    Thins a (seq_len, 3) trajectory array [lat, lon, ts] by a time-based
    gap derived from zoom, strips NaN-padded rows, and returns a plain
    list for JSON serialisation.

    Unlike index-based striding, this gives trajectories with the same
    real-world duration the same effective point density at a given zoom,
    regardless of their original sampling rate.
    """
    # Drop NaN-padded rows (any NaN in the row = padding)
    valid_mask = ~np.isnan(points).any(axis=1)
    valid_points = points[valid_mask]

    if len(valid_points) == 0:
        return []

    gap = zoom_to_gap_seconds(zoom)
    if gap <= 0:
        return valid_points.tolist()

    ts = valid_points[:, 2]
    keep_idx = [0]
    last_kept_ts = ts[0]
    for i in range(1, len(ts)):
        if ts[i] - last_kept_ts >= gap:
            keep_idx.append(i)
            last_kept_ts = ts[i]
    # Always keep the final point so the trajectory's end isn't cut short
    if keep_idx[-1] != len(ts) - 1:
        keep_idx.append(len(ts) - 1)

    return valid_points[keep_idx].tolist()

import numpy as np

MIN_ZOOM = 1
MAX_ZOOM = 18
MAX_GAP_SECONDS = 3600  # at MIN_ZOOM, keep ~1 point per hour of trajectory
MIN_GAP_SECONDS = 0     # at MAX_ZOOM, keep every point


def zoom_to_gap_seconds(zoom: int) -> float:
    zoom = max(MIN_ZOOM, min(MAX_ZOOM, zoom))
    t = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)
    gap = MAX_GAP_SECONDS * ((1 - t) ** 2.5)
    return max(MIN_GAP_SECONDS, gap)


def thin_trajectory(
    points: np.ndarray,
    zoom: int,
    num_historic_tokens: int | None = None,
) -> tuple[list[list], int | None]:
    """
    Thins a (seq_len, 3) trajectory array [lat, lon, ts] by a time-based gap
    derived from zoom, strips NaN-padded rows, and returns (thinned_points,
    thinned_num_historic_tokens).

    num_historic_tokens is re-derived after thinning so the
    historic/predicted split lands on the correct thinned point regardless
    of stride/gap or original sampling rate.
    """
    valid_mask = ~np.isnan(points).any(axis=1)
    valid_points = points[valid_mask]

    if len(valid_points) == 0:
        return [], None

    ts = valid_points[:, 2]

    # Capture the cutoff as a timestamp *before* thinning touches indices.
    cutoff_ts = None
    if num_historic_tokens is not None and 0 < num_historic_tokens <= len(valid_points):
        cutoff_ts = ts[num_historic_tokens - 1]

    gap = zoom_to_gap_seconds(zoom)
    if gap <= 0:
        thinned_points = valid_points
        thinned_ts = ts
    else:
        keep_idx = [0]
        last_kept_ts = ts[0]
        for i in range(1, len(ts)):
            if ts[i] - last_kept_ts >= gap:
                keep_idx.append(i)
                last_kept_ts = ts[i]
        if keep_idx[-1] != len(ts) - 1:
            keep_idx.append(len(ts) - 1)
        thinned_points = valid_points[keep_idx]
        thinned_ts = ts[keep_idx]

    new_cutoff = None
    if cutoff_ts is not None:
        # Index of the first thinned point whose ts >= cutoff_ts.
        # This is the count of historic points that survived thinning.
        new_cutoff = int(np.searchsorted(thinned_ts, cutoff_ts, side="right"))

    return thinned_points.tolist(), new_cutoff

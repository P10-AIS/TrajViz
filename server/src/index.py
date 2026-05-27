def trajectories_in_viewport(
    store,
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    limit: int | None = None,
) -> list[int]:
    result = []
    cap = limit if limit is not None else len(store.trajectories)

    for i, traj in enumerate(store.trajectories[:cap]):
        if (
            traj.bbox.lat_max >= lat_min
            and traj.bbox.lat_min <= lat_max
            and traj.bbox.lon_max >= lon_min
            and traj.bbox.lon_min <= lon_max
        ):
            result.append(i)
    return result

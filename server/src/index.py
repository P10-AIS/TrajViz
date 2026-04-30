from src.models import Trajectory, TrajectoryStore


def trajectories_in_viewport(
    store: TrajectoryStore,
    lat_min, lat_max, lon_min, lon_max, limit: int | None = None,
) -> list[tuple[Trajectory, int]]:
    result = []

    if limit is None:
        limit = len(store.trajectories)

    for i, traj in enumerate(store.trajectories[:limit]):
        if (
            traj.lat_max >= lat_min
            and traj.lat_min <= lat_max
            and traj.lon_max >= lon_min
            and traj.lon_min <= lon_max
        ):
            result.append((traj, i))
    return result

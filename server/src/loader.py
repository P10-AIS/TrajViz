import os
import pickle
import numpy as np
from src.models import Trajectory, BoundingBox, LabelStore, PredictionStore

MAX_FILE_SIZE_GB = float(os.getenv("MAX_FILE_SIZE_GB", "1.0"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 ** 3


def _bbox_from_points(points: np.ndarray) -> BoundingBox:
    lats = points[:, 0]
    lons = points[:, 1]
    valid_lats = lats[~np.isnan(lats)]
    valid_lons = lons[~np.isnan(lons)]
    if len(valid_lats) == 0:
        return BoundingBox(0.0, 0.0, 0.0, 0.0)
    return BoundingBox(
        lat_min=float(valid_lats.min()),
        lat_max=float(valid_lats.max()),
        lon_min=float(valid_lons.min()),
        lon_max=float(valid_lons.max()),
    )


def _make_trajectory(points: np.ndarray) -> Trajectory:
    return Trajectory(
        points=points.astype(np.float32),
        bbox=_bbox_from_points(points),
    )


# ---------------------------------------------------------------------------
# Standard predictions
# ---------------------------------------------------------------------------

def load_all_predictions(directory: str = "Predictions") -> dict[str, PredictionStore]:
    stores: dict[str, PredictionStore] = {}

    if not os.path.exists(directory):
        print(f"Predictions directory '{directory}' not found, skipping.")
        return stores

    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".npz"):
            continue

        path = os.path.join(directory, filename)
        model_name = os.path.splitext(filename)[0]

        file_size = os.path.getsize(path)
        if file_size > MAX_FILE_SIZE_BYTES:
            print(
                f"  Skipping {filename}: {file_size / 1024**3:.2f} GB exceeds limit")
            continue

        try:
            with np.load(path, allow_pickle=True) as data:
                lats = data.get("lats")
                lons = data.get("lons")
                timestamps = data.get("timestamps")

                if lats is None or lons is None or timestamps is None:
                    print(
                        f"  Skipping {filename}: missing lats/lons/timestamps")
                    continue

                if "num_historic_tokens" in data:
                    raw = data["num_historic_tokens"]
                    try:
                        num_historic_tokens = int(float(raw))
                    except (ValueError, TypeError):
                        num_historic_tokens = int(
                            float(pickle.loads(raw.item())))
                else:
                    num_historic_tokens = 0

                stacked = np.stack((lats, lons, timestamps), axis=2)
                store = PredictionStore(
                    name=model_name, num_historic_tokens=num_historic_tokens)

                for i in range(stacked.shape[0]):
                    store.trajectories.append(_make_trajectory(stacked[i]))

                stores[model_name] = store
                print(
                    f"  Loaded predictions '{model_name}': {len(store.trajectories)} trajectories")

        except Exception as e:
            print(f"  Error loading {filename}: {e}")

    return stores

# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------


def load_all_labels(data_dir: str = "Data") -> dict[str, LabelStore]:
    stores: dict[str, LabelStore] = {}

    if not os.path.exists(data_dir):
        print(f"Labels directory '{data_dir}' not found, skipping.")
        return stores

    for filename in sorted(os.listdir(data_dir)):
        if not (filename.endswith(".npz")):
            continue

        path = os.path.join(data_dir, filename)
        dataset_name = os.path.splitext(filename)[0]

        file_size = os.path.getsize(path)
        if file_size > MAX_FILE_SIZE_BYTES:
            print(
                f"  Skipping {filename}: {file_size / 1024**3:.2f} GB exceeds limit")
            continue

        try:
            with np.load(path, allow_pickle=True) as data:
                flat = data["trajectories"]
                trajectory_idxes: list[int] = pickle.loads(
                    data["trajectory_idxes"].item())

            store = LabelStore(name=dataset_name)
            split_indices = trajectory_idxes[1:]
            segments = np.split(flat, split_indices)

            for seg in segments:
                if len(seg) == 0:
                    continue
                points = seg[:, [1, 2, 0]].astype(np.float32)
                store.trajectories.append(_make_trajectory(points))

            stores[dataset_name] = store
            print(
                f"  Loaded labels '{dataset_name}': {len(store.trajectories)} trajectories")

        except Exception as e:
            print(f"  Error loading {filename}: {e}")

    return stores

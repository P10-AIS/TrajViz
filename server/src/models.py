from dataclasses import dataclass, field
import numpy as np


@dataclass
class BoundingBox:
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


@dataclass
class Trajectory:
    """A single trajectory with bounding box for fast filtering."""
    points: np.ndarray      # (seq_len, 3): [lat, lon, timestamp]
    bbox: BoundingBox


@dataclass
class LabelStore:
    """Ground truth trajectories — no predictions"""
    name: str
    trajectories: list[Trajectory] = field(default_factory=list)


@dataclass
class PredictionStore:
    """Standard model predictions."""
    name: str
    trajectories: list[Trajectory] = field(default_factory=list)
    num_historic_tokens: int = 0

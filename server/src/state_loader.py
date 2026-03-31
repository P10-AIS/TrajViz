import os
import numpy as np
import pickle

def load_predictions(predictions_cache: dict):
    if os.path.exists("Predictions"):
        for filename in os.listdir("Predictions"):
            path = os.path.join("Predictions", filename)
            with np.load(path, allow_pickle=True) as data:
                predictions: np.ndarray = data['predictions']
                predictions_cache[filename] = {
                    "predictions": predictions.tolist() # CONVERTED TO LIST
                }

    
def load_labels(labels_cache: dict):
    if os.path.exists("Data/DatasetTraj"):
        for filename in os.listdir("Data/DatasetTraj"):
            if filename.startswith("combined"):
                path = os.path.join("Data/DatasetTraj", filename)
                with np.load(path, allow_pickle=True) as data:
                    trajectories: np.ndarray = data['trajectories']
                    trajectory_idxes: list[int] = pickle.loads(data['trajectory_idxes'].item())
                    labels_cache[filename] = {
                        "trajectories": trajectories.tolist(), # CONVERTED TO LIST
                        "trajectory_idxes": trajectory_idxes
                    }
import os
import numpy as np
import pickle

def load_predictions(predictions_cache: dict):
    directory = "Predictions"
    
    if not os.path.exists(directory):
        return

    for filename in os.listdir(directory):
        if not filename.endswith('.npz'):
            continue
            
        path = os.path.join(directory, filename)
        
        try:
            with np.load(path, allow_pickle=True) as data:
                lats = data.get('lats')
                lons = data.get('lons')
                timestamps = data.get('timestamps')

                if lats is None or lons is None or timestamps is None:
                    continue

                # 1. Stack arrays horizontally to create [lat, lon, timestamp] rows
                # column_stack creates a 2D array: [[lat1, lon1, ts1], [lat2, lon2, ts2]]
                stacked = np.stack((lats, lons, timestamps), axis=2)
                
                # 2. Handle NaNs by converting to a list and replacing them
                # Converting to a list first makes it easier to replace NaNs with None 
                # for JSON-like structures.
                points = stacked.tolist()
                
                # Efficiently replace any NaN values with None (JSON null)
                # We use a list comprehension for a clean, Pythonic conversion
                clean_points = [
                    [None if (isinstance(val, float) and np.isnan(val)) else val for val in point]
                    for point in points
                ]

                predictions_cache[filename] = {"points": clean_points}
                
        except Exception as e:
            print(f"Error loading {filename}: {e}")

    
def load_labels(labels_cache: dict):
    data_dir = "Data/DatasetTraj"
    if os.path.exists(data_dir):
        for filename in os.listdir(data_dir):
            if filename.startswith("combined") and filename.endswith(".npz"):
                path = os.path.join(data_dir, filename)
                
                with np.load(path, allow_pickle=True) as data:
                    # 'trajectories' is [total_points, 6] -> (timestamp, lat, lon, cog, sog, vessel)
                    flat_trajectories = data['trajectories']
                    # 'trajectory_idxes' are the starting offsets for each trajectory
                    trajectory_idxes = pickle.loads(data['trajectory_idxes'].item())

                    # Transform to [trajectories, seq_len, 3] with None padding
                    formatted_data = parse_to_trajectories(flat_trajectories, trajectory_idxes)
                    labels_cache[filename] = {
                        "points": formatted_data.tolist()
                    }

def parse_to_trajectories(trajectories: np.ndarray, trajectory_idxes: list[int]) -> np.ndarray:
    """
    Converts flat points into a padded (N, Seq, 3) object array.
    The 3 columns are: Lat (1), Lon (2), Timestamp (0).
    """
    # 1. Split the flat array into a list of individual trajectory segments
    # We add the total length to the end of indices to capture the last segment
    split_indices = trajectory_idxes[1:] 
    segments = np.split(trajectories, split_indices)
    
    # 2. Extract only Lat, Lon, Timestamp (indices 1, 2, 0)
    # and find the maximum length for padding
    cleaned_segments = []
    max_len = 0
    for seg in segments:
        if len(seg) == 0: continue
        # Reorder to [Lat, Lon, Timestamp]
        cleaned = seg[:, [1, 2, 0]] 
        cleaned_segments.append(cleaned)
        max_len = max(max_len, len(cleaned))

    # 3. Initialize an object array filled with None
    num_trajs = len(cleaned_segments)
    result = np.full((num_trajs, max_len, 3), None, dtype=object)

    # 4. Fill the array
    for i, seg in enumerate(cleaned_segments):
        curr_len = len(seg)
        result[i, :curr_len, :] = seg

    return result
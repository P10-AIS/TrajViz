import os

from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager

from fastapi.responses import FileResponse
from .state_loader import load_predictions, load_labels

predictions_cache = {}
labels_cache = {}
HEATMAPS_FOLDER = "Outputs/Heatmaps"

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading predictions into memory...")
    
    # Load directly into the dictionaries
    load_predictions(predictions_cache)
    load_labels(labels_cache)

    print(f"Loaded predictions from {len(predictions_cache)} models into memory.")
    print(f"Loaded labels from {len(labels_cache)} files into memory.")
    
    yield
    
    print("Clearing memory...")
    predictions_cache.clear()
    labels_cache.clear()

app = FastAPI(lifespan=lifespan)

@app.get("/predictions")
async def get_predictions():
    return {"points": predictions_cache}

@app.get("/labels")
async def get_labels():
    return {"points": labels_cache}

@app.post("/update_predictions")
def update_predictions():
    global predictions_cache
    new_cache = {}
    load_predictions(new_cache)
    
    predictions_cache = new_cache 
    
    return {
        "message": "Predictions updated successfully."
    }

@app.post("/update_labels")
def update_labels():
    global labels_cache
    
    new_cache = {}
    load_labels(new_cache)
    
    labels_cache = new_cache 
    
    return {
        "message": "Labels updated successfully."
    }
    
@app.get("/heatmaps")
def get_heatmaps():
    heatmaps: list[str] = []
    for filename in os.listdir(HEATMAPS_FOLDER):
        heatmaps.append(filename)
    return {"heatmaps": heatmaps}

@app.get("/image/{filename}")
def get_heatmap(filename: str):
    path = os.path.join(HEATMAPS_FOLDER, filename)
    if os.path.exists(path) and os.path.isfile(path):
        return FileResponse(path, media_type="image/png")
    else:
        raise HTTPException(status_code=404, detail="Heatmap not found.")
from fastapi import FastAPI
from contextlib import asynccontextmanager
from .state_loader import load_predictions, load_labels

predictions_cache = {}
labels_cache = {}

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
    return {"predictions": predictions_cache}

@app.get("/labels")
async def get_labels():
    return {"labels": labels_cache}

@app.post("/update_predictions")
def update_predictions():
    global predictions_cache
    new_cache = {}
    load_predictions(new_cache)
    
    predictions_cache = new_cache 
    
    return {
        "message": "Predictions updated successfully.",
        "predictions": predictions_cache
    }

@app.post("/update_labels")
def update_labels():
    global labels_cache
    
    new_cache = {}
    load_labels(new_cache)
    
    labels_cache = new_cache 
    
    return {
        "message": "Labels updated successfully.",
        "labels": labels_cache
    }
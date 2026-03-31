from fastapi import FastAPI
from contextlib import asynccontextmanager
import os

model_data_cache = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading predictions into memory...")
    
    if os.path.exists("Predictions"):
        for filename in os.listdir("Predictions"):
            with open(os.path.join("Predictions", filename), "r") as f:
                model_data_cache[filename] = f.read()
    
    print(f"Loaded {len(model_data_cache)} files into memory.")
    
    yield  # The server is now running and accepting requests
    
    # --- SHUTDOWN LOGIC ---
    # This runs once when the server stops
    print("Clearing memory...")
    model_data_cache.clear()

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Hello World", "modelData": model_data_cache}
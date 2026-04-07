import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()
from .state_loader import load_predictions, load_labels

predictions_cache = {}
labels_cache = {}
HEATMAPS_FOLDER = "Outputs/Heatmaps"
http_client = httpx.AsyncClient()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading predictions into memory...")
    load_predictions(predictions_cache)
    load_labels(labels_cache)
    
    yield
    
    print("Clearing memory and closing client...")
    predictions_cache.clear()
    labels_cache.clear()
    await http_client.aclose() # Clean up the client

app = FastAPI(lifespan=lifespan)

@app.get("/omniscale/wms")
async def omniscale_proxy(request: Request):
    api_key = os.getenv("OMNISCALE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Omniscale API key")

    query_params = request.query_params
    url = f"https://maps.omniscale.net/v2/{api_key}/style.default/map"

    try:
        response = await http_client.get(url, params=query_params)
        
        if response.status_code != 200:
            return HTTPException(status_code=response.status_code, detail=response.text)

        return StreamingResponse(
            response.aiter_bytes(), 
            media_type=response.headers.get("content-type", "image/png"),
            headers={
                "Cache-Control": "public, max-age=86400"
            }
        )
    except Exception as e:
        print(f"Omniscale proxy error: {e}")
        raise HTTPException(status_code=500, detail="Proxy failed")

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
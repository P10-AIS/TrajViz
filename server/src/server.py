from fastapi.responses import FileResponse
import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import re
from .state_loader import load_predictions, load_labels
import base64
import mimetypes
import json

load_dotenv()
predictions_cache = {}
labels_cache = {}
http_client = httpx.AsyncClient()
IMAGES_FOLDER = "Data/Heatmaps"


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_predictions(predictions_cache)
    load_labels(labels_cache)
    print("trajectories loaded into memory")
    yield

    predictions_cache.clear()
    labels_cache.clear()
    await http_client.aclose()  # Clean up the client

app = FastAPI(lifespan=lifespan)


@app.get("/omniscale/wms")
async def omniscale_proxy(request: Request):
    api_key = os.getenv("OMNISCALE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="Missing Omniscale API key")

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
    predictions_cache.clear()
    load_predictions(predictions_cache)

    return {"message": "Predictions updated successfully."}


@app.post("/update_labels")
def update_labels():
    global labels_cache
    labels_cache.clear()
    load_labels(labels_cache)

    return {"message": "Labels updated successfully."}


@app.get("/images")
def get_images():
    """Returns a list of all heatmap filenames in the folder."""
    images: list[str] = []
    if os.path.exists(IMAGES_FOLDER):
        for filename in os.listdir(IMAGES_FOLDER):
            if os.path.isfile(os.path.join(IMAGES_FOLDER, filename)):
                images.append(filename)
    return {"images": images}


@app.get("/image/{filename}")
def get_heatmap(filename: str):
    path = os.path.join(IMAGES_FOLDER, filename)

    if not (os.path.exists(path) and os.path.isfile(path)):
        raise HTTPException(status_code=404, detail="Heatmap not found.")

    pattern = r"BL_(?P<bl_lat>[\d.-]+)_(?P<bl_lon>[\d.-]+)_TR_(?P<tr_lat>[\d.-]+)_(?P<tr_lon>[\d.-]+)_PROJ_(?P<proj_str>[\w.]+)"
    match = re.search(pattern, filename)

    if not match:
        raise HTTPException(status_code=400, detail="Invalid filename format.")

    coords = match.groupdict()

    # We store the metadata in a custom header so we can send the file as binary
    metadata = {
        "projection": coords["proj_str"].replace(".", ":"),
        "area": {
            "top_right": {"lat": float(coords["tr_lat"]), "lon": float(coords["tr_lon"])},
            "bottom_left": {"lat": float(coords["bl_lat"]), "lon": float(coords["bl_lon"])}
        }
    }

    # Return the file directly. This is MUCH faster and uses less RAM.
    return FileResponse(
        path,
        media_type="image/png",
        headers={"x-image-metadata": json.dumps(metadata)}
    )

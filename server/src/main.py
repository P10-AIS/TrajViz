import rasterio
import json
import os
import io
from contextlib import asynccontextmanager
from PIL import Image as PILImage
from fastapi.responses import Response
from pyproj import Transformer
import numpy as np

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv

from src.loader import load_all_predictions, load_all_labels
from src.index import trajectories_in_viewport
from src.thinning import thin_trajectory
from src.models import LabelStore, PredictionStore

load_dotenv()

# ---------------------------------------------------------------------------
# App state
# ---------------------------------------------------------------------------

label_stores: dict[str, LabelStore] = {}
prediction_stores: dict[str, PredictionStore] = {}
http_client: httpx.AsyncClient

IMAGES_FOLDER = "Images"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, label_stores, prediction_stores, prediction_stores_trait

    print("Loading labels...")
    label_stores = load_all_labels()

    print("Loading predictions...")
    prediction_stores = load_all_predictions()

    print("All data loaded.")

    http_client = httpx.AsyncClient()
    yield

    label_stores.clear()
    prediction_stores.clear()
    await http_client.aclose()


app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stream_label_trajectories(store: LabelStore, lat_min, lat_max, lon_min, lon_max, zoom, limit=None):
    indices = trajectories_in_viewport(
        store, lat_min, lat_max, lon_min, lon_max, limit)
    yield json.dumps({"type": "header", "source": store.name, "total": len(indices)}) + "\n"

    for store_idx in indices:
        traj = store.trajectories[store_idx]
        pts, _ = thin_trajectory(traj.points, zoom)
        if not pts:
            continue
        yield json.dumps({"type": "traj", "i": store_idx, "pts": pts}) + "\n"

    yield json.dumps({"type": "done"}) + "\n"


def _stream_prediction_trajectories(store: PredictionStore, lat_min, lat_max, lon_min, lon_max, zoom, limit=None):
    indices = trajectories_in_viewport(
        store, lat_min, lat_max, lon_min, lon_max, limit)
    yield json.dumps({"type": "header", "source": store.name, "total": len(indices)}) + "\n"

    for store_idx in indices:
        traj = store.trajectories[store_idx]
        pts, cutoff = thin_trajectory(
            traj.points, zoom, store.num_historic_tokens)
        if not pts:
            continue
        yield json.dumps({
            "type": "traj",
            "i": store_idx,
            "pts": pts,
            "num_historic_tokens": cutoff,
        }) + "\n"

    yield json.dumps({"type": "done"}) + "\n"


# ---------------------------------------------------------------------------
# Label endpoints
# ---------------------------------------------------------------------------

@app.get("/labels")
async def list_labels():
    return {
        name: {"count": len(store.trajectories)}
        for name, store in label_stores.items()
    }


@app.get("/labels/{dataset_name}")
async def get_labels(
    dataset_name: str,
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
    limit: int = Query(default=None, ge=1),
):
    store = label_stores.get(dataset_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Label dataset '{dataset_name}' not found.")

    return StreamingResponse(
        _stream_label_trajectories(
            store, lat_min, lat_max, lon_min, lon_max, zoom, limit),
        media_type="application/x-ndjson",
    )


# ---------------------------------------------------------------------------
# Prediction endpoints
# ---------------------------------------------------------------------------

@app.get("/predictions")
async def list_predictions():
    return {
        name: {
            "count": len(store.trajectories),
            "num_historic_tokens": store.num_historic_tokens,
        }
        for name, store in prediction_stores.items()
    }


@app.get("/predictions/{model_name}")
async def get_predictions(
    model_name: str,
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
    limit: int = Query(default=None, ge=1),
):
    store = prediction_stores.get(model_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Model '{model_name}' not found.")

    return StreamingResponse(
        _stream_prediction_trajectories(
            store, lat_min, lat_max, lon_min, lon_max, zoom, limit),
        media_type="application/x-ndjson",
    )

# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------


@app.get("/refresh")
async def refresh():
    global label_stores, prediction_stores
    label_stores = load_all_labels()
    prediction_stores = load_all_predictions()
    return {"status": "success", "message": "Backend data refreshed."}


# ---------------------------------------------------------------------------
# Image endpoints
# ---------------------------------------------------------------------------

@app.get("/omniscale/wms")
async def omniscale_proxy(request: Request):
    api_key = os.getenv("OMNISCALE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="Missing Omniscale API key")

    try:
        response = await http_client.get(
            f"https://maps.omniscale.net/v2/{api_key}/style.default/map",
            params=request.query_params,
        )
        return StreamingResponse(
            response.aiter_bytes(),
            media_type=response.headers.get("content-type", "image/png"),
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except Exception as e:
        print(f"Omniscale proxy error: {e}")
        raise HTTPException(status_code=500, detail="Proxy failed")


@app.get("/images")
def list_images():
    images = []
    if os.path.exists(IMAGES_FOLDER):
        for root, dirs, files in os.walk(IMAGES_FOLDER):
            for f in files:
                if f.lower().endswith((".tif", ".tiff")):
                    rel_path = os.path.relpath(
                        os.path.join(root, f), IMAGES_FOLDER)
                    images.append(rel_path)
    return {"images": images}


@app.get("/image/{filename:path}")
def get_image(filename: str):
    path = os.path.join(IMAGES_FOLDER, filename)
    if not (os.path.exists(path) and os.path.isfile(path)):
        raise HTTPException(status_code=404, detail="Image not found.")

    try:
        with rasterio.open(path) as src:
            crs_string = src.crs.to_string()
            transformer = Transformer.from_crs(
                src.crs, "EPSG:4326", always_xy=True)
            left, bottom, right, top = src.bounds
            lon_min, lat_min = transformer.transform(left, bottom)
            lon_max, lat_max = transformer.transform(right, top)
            metadata = {
                "projection": crs_string,
                "area": {
                    "top_right": {"lat": lat_max, "lon": lon_max},
                    "bottom_left": {"lat": lat_min, "lon": lon_min},
                },
            }
            data = src.read([1, 2, 3]).transpose(1, 2, 0)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to read GeoTIFF: {e}")

    img = PILImage.fromarray(data, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(
        content=buf.read(),
        media_type="image/png",
        headers={"x-image-metadata": json.dumps(metadata)},
    )

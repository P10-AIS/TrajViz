from rasterio.warp import transform_bounds
import rasterio
import json
import os
import re
import io
from contextlib import asynccontextmanager
from PIL import Image as PILImage
from rasterio.warp import transform_bounds
from fastapi.responses import Response
from pyproj import Transformer


import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv

from src.loader import load_all_predictions, load_all_labels
from src.index import trajectories_in_viewport
from src.thinning import thin_trajectory
from src.models import TrajectoryStore

load_dotenv()

# ---------------------------------------------------------------------------
# App state
# ---------------------------------------------------------------------------

prediction_stores: dict[str, TrajectoryStore] = {}
label_stores: dict[str, TrajectoryStore] = {}
http_client: httpx.AsyncClient

IMAGES_FOLDER = "Data/Images"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, prediction_stores, label_stores

    print("Loading predictions...")
    prediction_stores = load_all_predictions()

    print("Loading labels...")
    label_stores = load_all_labels()

    print("All data loaded.")

    http_client = httpx.AsyncClient()
    yield

    prediction_stores.clear()
    label_stores.clear()
    await http_client.aclose()


app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _viewport_params(
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
):
    """Shared dependency for viewport query params."""
    return {
        "lat_min": lat_min,
        "lat_max": lat_max,
        "lon_min": lon_min,
        "lon_max": lon_max,
        "zoom": zoom,
    }


def _stream_trajectories(store: TrajectoryStore, lat_min, lat_max, lon_min, lon_max, zoom, limit=None, already_have=None):
    """
    Generator that yields NDJSON lines, one trajectory per line.

    Each line is a JSON object:
      {"i": <traj_index>, "pts": [[lat, lon, ts], ...]}

    The stream opens with a header line:
      {"type": "header", "source": "<name>", "total": <n_in_viewport>}

    And closes with:
      {"type": "done"}

    This lets the frontend know upfront how many trajectories to expect,
    and detect clean stream completion vs a dropped connection.
    """
    matching = trajectories_in_viewport(
        store, lat_min, lat_max, lon_min, lon_max, limit)

    yield json.dumps({"type": "header", "source": store.name, "total": len(matching)}) + "\n"

    for traj, store_idx in matching:  # need (traj, original_index) pairs
        pts = thin_trajectory(traj.points, zoom)
        if not pts:
            continue
        yield json.dumps({"type": "traj", "i": store_idx, "pts": pts}) + "\n"

    yield json.dumps({"type": "done"}) + "\n"


# ---------------------------------------------------------------------------
# Trajectory endpoints
# ---------------------------------------------------------------------------

@app.get("/predictions/{model_name}")
async def get_predictions(
    model_name: str,
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
    limit: int = Query(default=None, ge=1),
    already_have: str = Query(default=""),
):
    """
    Stream trajectories for one model that intersect the given viewport.
    Response is NDJSON (Content-Type: application/x-ndjson).
    """
    have_set = set(int(i) for i in already_have.split(",") if i)
    store = prediction_stores.get(model_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Model '{model_name}' not found.")

    return StreamingResponse(
        _stream_trajectories(store, lat_min, lat_max,
                             lon_min, lon_max, zoom, limit, have_set),
        media_type="application/x-ndjson",
    )


@app.get("/labels/{dataset_name}")
async def get_labels(
    dataset_name: str,
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
    limit: int = Query(default=None, ge=1),
    already_have: str = Query(default=""),
):
    """
    Stream label trajectories for one dataset that intersect the given viewport.
    Response is NDJSON (Content-Type: application/x-ndjson).
    """
    have_set = set(int(i) for i in already_have.split(",") if i)
    store = label_stores.get(dataset_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Dataset '{dataset_name}' not found.")

    return StreamingResponse(
        _stream_trajectories(store, lat_min, lat_max,
                             lon_min, lon_max, zoom, limit, have_set),
        media_type="application/x-ndjson",
    )


@app.get("/predictions")
async def list_predictions():
    """Lists all available prediction model names and their trajectory counts."""
    return {
        name: {
            "count": len(store.trajectories),
            "historic_horizon_m": store.historic_horizon_m,
        }
        for name, store in prediction_stores.items()
    }


@app.get("/labels")
async def list_labels():
    """Lists all available label dataset names and their trajectory counts."""
    return {
        name: {"count": len(store.trajectories)}
        for name, store in label_stores.items()
    }


@app.get("/refresh")
async def refresh():
    global prediction_stores
    global label_stores

    prediction_stores = load_all_predictions()
    label_stores = load_all_labels()

    return {"status": "success", "message": "Backend data refreshed."}

# ---------------------------------------------------------------------------
# Image / heatmap endpoints (unchanged)
# ---------------------------------------------------------------------------


@app.get("/omniscale/wms")
async def omniscale_proxy(request: Request):
    api_key = os.getenv("OMNISCALE_API_KEY")
    print(f"Received Omniscale proxy request: {api_key}")
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


HEATMAP_PATTERN = re.compile(
    r"BL_(?P<bl_lat>[\d.-]+)_(?P<bl_lon>[\d.-]+)"
    r"_TR_(?P<tr_lat>[\d.-]+)_(?P<tr_lon>[\d.-]+)"
    r"_PROJ_(?P<proj_str>[\w.]+)"
)


@app.get("/images")
def list_images():
    images = []
    if os.path.exists(IMAGES_FOLDER):
        images = [
            f for f in os.listdir(IMAGES_FOLDER)
            if os.path.isfile(os.path.join(IMAGES_FOLDER, f))
            and f.lower().endswith((".tif", ".tiff"))
        ]
    return {"images": images}


@app.get("/image/{filename}")
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

            # Read RGB bands and convert to PNG in memory
            data = src.read([1, 2, 3]).transpose(1, 2, 0)  # (H, W, 3)

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

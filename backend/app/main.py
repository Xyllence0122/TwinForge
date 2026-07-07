"""TwinForge FastAPI service.

Run:  uvicorn app.main:app --reload --port 8000

Integration points (see README):
  * MQTT ingest  -> replace core/simulation.py with an aiomqtt subscriber
  * TimescaleDB  -> back telemetry endpoints with hypertable queries
  * LSTM model   -> swap routers/ai.py LSTMAutoencoderStub
The HTTP/WS contract consumed by the Next.js console stays fixed.
"""

import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .core.simulation import engine
from .routers import ai, alerts, analytics, machines

app = FastAPI(
    title="TwinForge API",
    version="1.0.0",
    description="Industrial digital-twin backend: assets, telemetry, alerts, KPIs and AI inference.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://twin-forge.vercel.app",
    ],
    # Also accept Vercel preview deployments (twin-forge-<hash>.vercel.app).
    allow_origin_regex=r"https://twin-forge.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(machines.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(ai.router)


@app.get("/api/health", tags=["system"])
def health() -> dict:
    """Liveness probe consumed by the console's data-source indicator."""
    return {"status": "ok", "version": app.version}


@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket) -> None:
    """Push the full fleet snapshot once per second.

    Matches the payload shape of the frontend's local simulation, so the
    console can subscribe here instead with zero component changes. An
    MQTT bridge would publish into this same socket.
    """
    await websocket.accept()
    try:
        while True:
            payload = [m.model_dump(by_alias=True) for m in engine.machines()]
            await websocket.send_json(payload)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        return

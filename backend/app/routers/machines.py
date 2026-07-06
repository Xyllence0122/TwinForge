"""Asset & telemetry endpoints."""

from fastapi import APIRouter, HTTPException, Query

from ..core.simulation import engine
from ..schemas import Machine

router = APIRouter(prefix="/api/machines", tags=["machines"])


@router.get("", response_model=list[Machine], response_model_by_alias=True)
def list_machines() -> list[Machine]:
    """All registered assets with live readings."""
    return engine.machines()


@router.get("/{machine_id}", response_model=Machine, response_model_by_alias=True)
def get_machine(machine_id: str) -> Machine:
    machine = engine.machine(machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    return machine


@router.get("/{machine_id}/telemetry")
def get_telemetry(
    machine_id: str,
    minutes: int = Query(default=15, ge=1, le=240),
) -> list[dict]:
    """Rolling telemetry window (TimescaleDB hypertable query in production)."""
    if engine.machine(machine_id) is None:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    return engine.telemetry(machine_id, minutes)

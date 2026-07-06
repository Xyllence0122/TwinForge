"""Production KPI endpoints."""

from fastapi import APIRouter

from ..core.simulation import engine
from ..schemas import KpiSnapshot

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/kpis", response_model=KpiSnapshot, response_model_by_alias=True)
def get_kpis() -> KpiSnapshot:
    """Fleet KPIs derived from the live simulation state."""
    machines = engine.machines()
    total = max(len(machines), 1)
    running = sum(1 for m in machines if m.status == "running")
    avg_health = sum(m.health.health_score for m in machines) / total / 100.0

    availability = min(0.995, 0.62 + (running / total) * 0.36)
    performance = max(0.2, min(0.99, 0.7 + avg_health * 0.28))
    quality = 0.975

    return KpiSnapshot(
        oee=availability * performance * quality,
        availability=availability,
        performance=performance,
        quality=quality,
        mtbfHours=182.0,
        mttrHours=2.4,
        energyKwhToday=1240.5,
        downtimeHoursToday=1.8,
        dailyProduction=1874,
        productionTarget=2000,
    )

"""Alert endpoints — mock event history shaped like the frontend contract."""

import time

from fastapi import APIRouter

from ..schemas import Alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

_NOW = int(time.time() * 1000)

_MOCK_ALERTS = [
    Alert(id="al-1001", timestamp=_NOW - 4 * 60_000, machineId="cnc-01", level="warning", code="temp-high"),
    Alert(id="al-1000", timestamp=_NOW - 11 * 60_000, machineId="ra-02", level="critical", code="bearing-failure"),
    Alert(id="al-0999", timestamp=_NOW - 26 * 60_000, machineId="cv-01", level="info", code="sim-started"),
]


@router.get("", response_model=list[Alert], response_model_by_alias=True)
def list_alerts() -> list[Alert]:
    """Recent alerts (PostgreSQL-backed in production)."""
    return _MOCK_ALERTS

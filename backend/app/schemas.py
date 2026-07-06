"""Pydantic schemas — mirror of frontend/lib/types.ts.

Field names use camelCase aliases so the JSON contract is byte-compatible
with the TypeScript domain types; the frontend can flip from local
simulation to this API without any mapping layer.
"""

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

MachineStatus = Literal["running", "idle", "maintenance", "offline"]
MachineType = Literal["robot-arm", "conveyor", "agv", "cnc", "storage"]
FaultType = Literal[
    "bearing-failure",
    "motor-overheating",
    "high-vibration",
    "sensor-failure",
    "power-spike",
    "conveyor-jam",
]
AlertLevel = Literal["info", "warning", "critical"]


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class SensorReadings(CamelModel):
    temperature: float
    current: float
    power: float
    rpm: float
    pressure: float
    humidity: float
    vibration: float


class MachineHealth(CamelModel):
    health_score: float = Field(alias="healthScore")
    fault_probability: float = Field(alias="faultProbability")
    rul_hours: float = Field(alias="rulHours")


class Machine(CamelModel):
    id: str
    name: str
    type: MachineType
    status: MachineStatus
    zone: str
    sensors: SensorReadings
    health: MachineHealth
    active_fault: Optional[FaultType] = Field(alias="activeFault", default=None)
    uptime_hours: float = Field(alias="uptimeHours")
    position: tuple[float, float, float]
    rotation_y: float = Field(alias="rotationY", default=0.0)


class Alert(CamelModel):
    id: str
    timestamp: int
    machine_id: str = Field(alias="machineId")
    level: AlertLevel
    code: str
    acknowledged: bool = False


class TelemetryPoint(CamelModel):
    t: int
    temperature: float
    current: float
    power: float
    vibration: float
    rpm: float


class KpiSnapshot(CamelModel):
    oee: float
    availability: float
    performance: float
    quality: float
    mtbf_hours: float = Field(alias="mtbfHours")
    mttr_hours: float = Field(alias="mttrHours")
    energy_kwh_today: float = Field(alias="energyKwhToday")
    downtime_hours_today: float = Field(alias="downtimeHoursToday")
    daily_production: int = Field(alias="dailyProduction")
    production_target: int = Field(alias="productionTarget")


class AnomalyRequest(CamelModel):
    machine_id: str = Field(alias="machine_id")


class AnomalyResult(CamelModel):
    machine_id: str = Field(alias="machineId")
    score: float
    threshold: float
    is_anomaly: bool = Field(alias="isAnomaly")
    top_contributors: list[str] = Field(alias="topContributors")


class RulForecast(CamelModel):
    machine_id: str = Field(alias="machineId")
    rul_hours: float = Field(alias="rulHours")
    confidence: float


class RootCause(CamelModel):
    code: str
    probability: float


class Recommendation(CamelModel):
    id: str
    machine_id: str = Field(alias="machineId")
    severity: AlertLevel
    code: str
    confidence: float

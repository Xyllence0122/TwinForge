"""Server-side factory simulation.

A lazily-stepped engine: state advances based on wall-clock elapsed time
whenever it is read, so the API stays stateless-cheap (no background
thread needed) while still producing continuous telemetry.

Production swap: replace this module with

  * an MQTT subscriber (paho-mqtt / aiomqtt) writing into TimescaleDB, and
  * repository functions reading the latest rows back out.

The router layer and response schemas stay identical.
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass, field

from ..schemas import Machine, MachineHealth, SensorReadings

BASELINES: dict[str, dict[str, float]] = {
    "robot-arm": dict(temperature=52, current=11, power=5.5, rpm=1800, pressure=5.6, humidity=42, vibration=1.8),
    "conveyor": dict(temperature=44, current=8, power=3.2, rpm=950, pressure=4.2, humidity=45, vibration=1.2),
    "agv": dict(temperature=38, current=14, power=2.4, rpm=620, pressure=3.1, humidity=40, vibration=0.9),
    "cnc": dict(temperature=61, current=22, power=12.5, rpm=8200, pressure=6.8, humidity=38, vibration=2.6),
    "storage": dict(temperature=35, current=6, power=1.8, rpm=420, pressure=2.8, humidity=48, vibration=0.6),
}

FLEET: list[dict] = [
    dict(id="ra-01", name="RA-01 · Kuka KR-210", type="robot-arm", zone="Line A", position=(-6, 0, -4), rotation_y=0.785),
    dict(id="ra-02", name="RA-02 · Kuka KR-210", type="robot-arm", zone="Line B", position=(-6, 0, 4), rotation_y=-0.785),
    dict(id="cv-01", name="CV-01 · Main Conveyor", type="conveyor", zone="Line A", position=(0, 0, 0), rotation_y=0.0),
    dict(id="cnc-01", name="CNC-01 · DMG Mori NLX", type="cnc", zone="Line A", position=(6, 0, -4), rotation_y=3.141),
    dict(id="cnc-02", name="CNC-02 · DMG Mori NLX", type="cnc", zone="Line B", position=(6, 0, 4), rotation_y=3.141),
    dict(id="agv-01", name="AGV-01 · MiR-600", type="agv", zone="Logistics", position=(-2, 0, 8), rotation_y=0.0),
    dict(id="agv-02", name="AGV-02 · MiR-600", type="agv", zone="Logistics", position=(3, 0, -8), rotation_y=1.57),
    dict(id="st-01", name="ST-01 · ASRS Crane", type="storage", zone="Warehouse", position=(12, 0, 0), rotation_y=0.0),
]


@dataclass
class _MachineState:
    spec: dict
    health_score: float = field(default_factory=lambda: 90 + random.random() * 8)
    fault_probability: float = 0.02
    rul_hours: float = field(default_factory=lambda: 1600 + random.random() * 800)
    uptime_hours: float = field(default_factory=lambda: 4000 + random.random() * 16000)
    status: str = "running"

    def readings(self, t: float) -> SensorReadings:
        """Continuous plausible telemetry from smooth periodic drift + noise."""
        base = BASELINES[self.spec["type"]]
        phase = hash(self.spec["id"]) % 100

        def channel(name: str, wobble: float) -> float:
            b = base[name]
            drift = math.sin(t / 47.0 + phase) * wobble * b
            noise = random.gauss(0, 0.01 * b)
            return max(0.0, b + drift + noise)

        return SensorReadings(
            temperature=channel("temperature", 0.04),
            current=channel("current", 0.08),
            power=channel("power", 0.08),
            rpm=channel("rpm", 0.03),
            pressure=channel("pressure", 0.04),
            humidity=channel("humidity", 0.03),
            vibration=channel("vibration", 0.15),
        )


class SimulationEngine:
    """Singleton simulation used by all routers."""

    def __init__(self) -> None:
        self._machines = {spec["id"]: _MachineState(spec) for spec in FLEET}
        self._t0 = time.time()

    # ------------------------------------------------------------------

    def machines(self) -> list[Machine]:
        t = time.time() - self._t0
        return [self._to_schema(state, t) for state in self._machines.values()]

    def machine(self, machine_id: str) -> Machine | None:
        state = self._machines.get(machine_id)
        if state is None:
            return None
        return self._to_schema(state, time.time() - self._t0)

    def telemetry(self, machine_id: str, minutes: int = 15) -> list[dict]:
        """Historical series — in production this is a TimescaleDB query."""
        state = self._machines.get(machine_id)
        if state is None:
            return []
        now_ms = int(time.time() * 1000)
        points = []
        for i in range(minutes * 12, 0, -1):  # one point / 5 s
            t = time.time() - self._t0 - i * 5
            r = state.readings(t)
            points.append(
                dict(
                    t=now_ms - i * 5000,
                    temperature=r.temperature,
                    current=r.current,
                    power=r.power,
                    vibration=r.vibration,
                    rpm=r.rpm,
                )
            )
        return points

    # ------------------------------------------------------------------

    def _to_schema(self, state: _MachineState, t: float) -> Machine:
        spec = state.spec
        return Machine(
            id=spec["id"],
            name=spec["name"],
            type=spec["type"],
            status=state.status,
            zone=spec["zone"],
            sensors=state.readings(t),
            health=MachineHealth(
                healthScore=state.health_score,
                faultProbability=state.fault_probability,
                rulHours=state.rul_hours,
            ),
            activeFault=None,
            uptimeHours=state.uptime_hours + t / 3600.0,
            position=spec["position"],
            rotationY=spec["rotation_y"],
        )


engine = SimulationEngine()

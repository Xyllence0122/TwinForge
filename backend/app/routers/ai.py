"""AI endpoints — production-shaped interfaces over mock inference.

`LSTMAutoencoderStub` defines exactly the surface a real model server
needs: load once at startup, `score(window) -> reconstruction error`.
Swap the stub for a TorchServe/ONNX-Runtime call (or an in-process
torch.nn.Module) and every endpoint keeps its contract.
"""

import random

from fastapi import APIRouter, HTTPException

from ..core.simulation import BASELINES, engine
from ..schemas import AnomalyRequest, AnomalyResult, Recommendation, RootCause, RulForecast

router = APIRouter(prefix="/api/ai", tags=["ai"])


class LSTMAutoencoderStub:
    """Stand-in for a trained LSTM Autoencoder.

    Real implementation outline:

        model = torch.load("models/lstm_ae.pt")
        def score(window: np.ndarray) -> float:
            recon = model(window)
            return float(((window - recon) ** 2).mean())
    """

    threshold = 0.35

    def score(self, machine_id: str) -> tuple[float, list[str]]:
        machine = engine.machine(machine_id)
        if machine is None:
            raise KeyError(machine_id)
        base = BASELINES[machine.type]
        channels = ["temperature", "current", "power", "rpm", "vibration"]
        errors = sorted(
            (
                (abs(getattr(machine.sensors, c) - base[c]) / max(base[c], 1e-6), c)
                for c in channels
            ),
            reverse=True,
        )
        raw = sum(e for e, _ in errors) / len(channels)
        return min(1.0, raw * 1.6), [c for _, c in errors[:3]]


model = LSTMAutoencoderStub()


@router.post("/anomaly", response_model=AnomalyResult, response_model_by_alias=True)
def detect_anomaly(request: AnomalyRequest) -> AnomalyResult:
    """Anomaly detection (LSTM Autoencoder reconstruction error)."""
    try:
        score, contributors = model.score(request.machine_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Machine '{request.machine_id}' not found")
    return AnomalyResult(
        machineId=request.machine_id,
        score=score,
        threshold=model.threshold,
        isAnomaly=score > model.threshold,
        topContributors=contributors,
    )


@router.get("/predictions/{machine_id}", response_model=RulForecast, response_model_by_alias=True)
def predict_rul(machine_id: str) -> RulForecast:
    """Predictive maintenance — Remaining Useful Life forecast."""
    machine = engine.machine(machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    return RulForecast(
        machineId=machine_id,
        rulHours=machine.health.rul_hours,
        confidence=round(0.72 + random.random() * 0.2, 2),
    )


@router.get("/root-cause/{machine_id}", response_model=list[RootCause])
def root_cause(machine_id: str) -> list[RootCause]:
    """Root-cause ranking for the machine's current condition."""
    machine = engine.machine(machine_id)
    if machine is None:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    causes = [
        ("lubrication-degradation", 0.31),
        ("mechanical-misalignment", 0.24),
        ("thermal-stress", 0.19),
        ("electrical-instability", 0.15),
        ("operator-overload", 0.11),
    ]
    return [RootCause(code=c, probability=p) for c, p in causes]


@router.get("/recommendations", response_model=list[Recommendation], response_model_by_alias=True)
def recommendations() -> list[Recommendation]:
    """Fleet-wide AI action recommendations."""
    machines = engine.machines()
    recs: list[Recommendation] = []
    for m in machines:
        if m.health.health_score < 70:
            recs.append(
                Recommendation(
                    id=f"rec-{m.id}-pm",
                    machineId=m.id,
                    severity="warning",
                    code="plan-maintenance",
                    confidence=0.76,
                )
            )
    return recs

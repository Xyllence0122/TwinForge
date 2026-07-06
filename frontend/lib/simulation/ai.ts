import type {
  AiRecommendation,
  AnomalyResult,
  Machine,
  RootCauseNode,
  SensorKey,
} from "@/lib/types";
import { BASELINES } from "./fleet";
import { clamp } from "@/lib/utils";

/**
 * AI layer — mock inference behind production-shaped interfaces.
 *
 * `AnomalyDetector` mimics an LSTM Autoencoder: the "reconstruction error"
 * is computed from normalised deviation of each channel against its learned
 * baseline. To use a real model, implement the same interface backed by
 * `POST /api/ai/anomaly` (FastAPI) — every consumer component only depends
 * on the `AnomalyResult` contract in lib/types.ts.
 */

export interface AnomalyDetector {
  detect(machine: Machine): AnomalyResult;
}

const CHANNELS: SensorKey[] = ["temperature", "current", "power", "rpm", "vibration"];

export const lstmAutoencoderMock: AnomalyDetector = {
  detect(m: Machine): AnomalyResult {
    const base = BASELINES[m.type];
    // Normalised absolute deviation per channel ≈ reconstruction error.
    const errors = CHANNELS.map((k) => ({
      key: k,
      err: Math.abs(m.sensors[k] - base[k]) / Math.max(base[k], 1e-6),
    })).sort((a, b) => b.err - a.err);

    const raw = errors.reduce((s, e) => s + e.err, 0) / CHANNELS.length;
    // Squash into 0–1; offline machines read near-zero power → ignore.
    const score = m.status === "offline" ? 0 : clamp(raw * 1.6, 0, 1);
    const threshold = 0.35;

    return {
      machineId: m.id,
      score,
      threshold,
      isAnomaly: score > threshold,
      topContributors: errors.slice(0, 3).map((e) => e.key),
    };
  },
};

/** Rule-based recommendation engine (stand-in for an LLM/ML ranker). */
export function getRecommendations(machines: Machine[]): AiRecommendation[] {
  const recs: AiRecommendation[] = [];
  for (const m of machines) {
    if (m.activeFault === "bearing-failure" || m.sensors.vibration > BASELINES[m.type].vibration * 2.5) {
      recs.push({ id: `rec-${m.id}-brg`, machineId: m.id, severity: "critical", code: "schedule-bearing", confidence: 0.93 });
      recs.push({ id: `rec-${m.id}-load`, machineId: m.id, severity: "warning", code: "reduce-load", confidence: 0.81 });
    }
    if (m.activeFault === "motor-overheating" || m.sensors.temperature > BASELINES[m.type].temperature + 20) {
      recs.push({ id: `rec-${m.id}-cool`, machineId: m.id, severity: "critical", code: "check-cooling", confidence: 0.9 });
    }
    if (m.activeFault === "sensor-failure") {
      recs.push({ id: `rec-${m.id}-cal`, machineId: m.id, severity: "warning", code: "recalibrate-sensor", confidence: 0.88 });
    }
    if (m.activeFault === "conveyor-jam") {
      recs.push({ id: `rec-${m.id}-belt`, machineId: m.id, severity: "critical", code: "inspect-belt", confidence: 0.95 });
    }
    if (!m.activeFault && m.health.healthScore < 70) {
      recs.push({ id: `rec-${m.id}-pm`, machineId: m.id, severity: "warning", code: "plan-maintenance", confidence: 0.76 });
    }
  }
  const order = { critical: 0, warning: 1, info: 2 } as const;
  return recs.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 8);
}

/** Bayesian-style root-cause ranking per machine, driven by live signals. */
export function getRootCauses(m: Machine): RootCauseNode[] {
  const base = BASELINES[m.type];
  const vibRatio = m.sensors.vibration / Math.max(base.vibration, 1e-6);
  const tempDelta = m.sensors.temperature - base.temperature;
  const powerRatio = m.sensors.power / Math.max(base.power, 1e-6);

  const scores: RootCauseNode[] = [
    { code: "lubrication-degradation", probability: clamp(0.12 + (vibRatio - 1) * 0.35, 0.02, 0.95) },
    { code: "mechanical-misalignment", probability: clamp(0.1 + (vibRatio - 1) * 0.28, 0.02, 0.9) },
    { code: "thermal-stress", probability: clamp(0.08 + tempDelta * 0.02, 0.02, 0.92) },
    { code: "electrical-instability", probability: clamp(0.06 + (powerRatio - 1) * 0.5, 0.02, 0.9) },
    { code: "operator-overload", probability: clamp(0.05 + (powerRatio - 1) * 0.2 + (m.uptimeHours > 15000 ? 0.1 : 0), 0.02, 0.85) },
  ];

  // Normalise to a proper distribution and sort.
  const total = scores.reduce((s, n) => s + n.probability, 0);
  return scores
    .map((n) => ({ ...n, probability: n.probability / total }))
    .sort((a, b) => b.probability - a.probability);
}

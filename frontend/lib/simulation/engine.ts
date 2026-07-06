import { clamp, gaussian } from "@/lib/utils";
import { BASELINES, IDLE_FACTOR } from "./fleet";
import type { FaultType, Machine, SensorKey, SensorReadings } from "@/lib/types";

/**
 * Pure telemetry-generation functions. The engine is deliberately free of
 * store / React concerns so the identical logic runs in unit tests, in a
 * WebWorker, or server-side. A real plant replaces this module with an
 * MQTT / WebSocket subscription that emits the same `SensorReadings`.
 */

/** Per-fault modifications applied on top of the nominal baseline. */
const FAULT_EFFECTS: Record<FaultType, Partial<Record<SensorKey, { mult?: number; add?: number }>>> = {
  "bearing-failure": { vibration: { mult: 3.4 }, temperature: { add: 9 }, current: { mult: 1.15 } },
  "motor-overheating": { temperature: { add: 38 }, current: { mult: 1.35 }, power: { mult: 1.3 } },
  "high-vibration": { vibration: { mult: 2.6 }, rpm: { mult: 0.92 } },
  "sensor-failure": {}, // handled specially: frozen / erratic channel
  "power-spike": { power: { mult: 1.9 }, current: { mult: 1.8 } },
  "conveyor-jam": { rpm: { mult: 0.05 }, current: { mult: 1.7 }, temperature: { add: 12 } },
};

/** Relative noise per sensor channel (fraction of baseline). */
const NOISE: Record<SensorKey, number> = {
  temperature: 0.008,
  current: 0.03,
  power: 0.03,
  rpm: 0.012,
  pressure: 0.015,
  humidity: 0.01,
  vibration: 0.06,
};

/** How fast readings converge to target per tick (0–1). */
const CONVERGENCE = 0.18;

export function targetReadings(m: Machine): SensorReadings {
  const base = BASELINES[m.type];
  const factor = m.status === "running" ? 1 : m.status === "maintenance" ? 0.45 : m.status === "idle" ? IDLE_FACTOR : 0;
  const target: SensorReadings = {
    temperature: 24 + (base.temperature - 24) * factor, // ambient floor
    current: base.current * factor,
    power: base.power * factor,
    rpm: base.rpm * factor,
    pressure: 1 + (base.pressure - 1) * factor,
    humidity: base.humidity, // ambient-driven, status independent
    vibration: base.vibration * factor,
  };

  if (m.activeFault && m.status !== "offline") {
    const fx = FAULT_EFFECTS[m.activeFault];
    (Object.keys(fx) as SensorKey[]).forEach((k) => {
      const e = fx[k];
      if (!e) return;
      if (e.mult) target[k] *= e.mult;
      if (e.add) target[k] += e.add;
    });
  }
  return target;
}

/** Advance one machine's sensor readings by one tick. */
export function nextReadings(m: Machine): SensorReadings {
  const target = targetReadings(m);
  const next = { ...m.sensors };

  (Object.keys(next) as SensorKey[]).forEach((k) => {
    if (m.activeFault === "sensor-failure" && (k === "temperature" || k === "pressure")) {
      // Faulty channel: frozen value with occasional implausible jumps.
      if (Math.random() < 0.12) next[k] = m.sensors[k] * (Math.random() < 0.5 ? 0 : 2.5);
      return;
    }
    const noise = gaussian(0, Math.max(0.01, Math.abs(target[k])) * NOISE[k]);
    next[k] = Math.max(0, next[k] + (target[k] - next[k]) * CONVERGENCE + noise);
  });

  return next;
}

/** Advance health indicators; returns a new health object. */
export function nextHealth(m: Machine, simHoursPerTick: number) {
  let { healthScore, faultProbability, rulHours } = m.health;

  if (m.activeFault) {
    // Degradation rate depends on fault severity.
    const severe = m.activeFault === "bearing-failure" || m.activeFault === "motor-overheating";
    healthScore -= (severe ? 0.55 : 0.3) * (0.8 + Math.random() * 0.4);
    faultProbability = clamp(faultProbability + 0.015, 0, 0.99);
    rulHours = Math.max(4, rulHours - simHoursPerTick * (severe ? 60 : 30));
  } else if (m.status === "maintenance") {
    // Maintenance restores condition.
    healthScore += 0.6;
    faultProbability = clamp(faultProbability - 0.01, 0.01, 1);
    rulHours = Math.min(2400, rulHours + simHoursPerTick * 80);
  } else if (m.status === "running") {
    // Slow natural wear + tiny recovery noise.
    healthScore += gaussian(-0.015, 0.05);
    faultProbability = clamp(faultProbability + gaussian(0.0002, 0.001), 0.005, 1);
    rulHours = Math.max(4, rulHours - simHoursPerTick);
  }

  return {
    healthScore: clamp(healthScore, 3, 100),
    faultProbability: clamp(faultProbability, 0.005, 0.99),
    rulHours,
  };
}

/** Warning / critical thresholds used by the alert evaluator. */
export const THRESHOLDS = {
  temperatureWarnDelta: 14, // °C above baseline
  vibrationWarnMult: 1.8, // × baseline
  healthCritical: 60, // %
};

export interface ThresholdBreach {
  code: "temp-high" | "vibration-high" | "health-low";
  level: "warning" | "critical";
}

/** Evaluate threshold breaches for one machine (fault alerts are raised separately at injection time). */
export function evaluateThresholds(m: Machine): ThresholdBreach[] {
  if (m.status === "offline") return [];
  const base = BASELINES[m.type];
  const out: ThresholdBreach[] = [];
  if (m.sensors.temperature > base.temperature + THRESHOLDS.temperatureWarnDelta) {
    out.push({ code: "temp-high", level: "warning" });
  }
  if (m.sensors.vibration > base.vibration * THRESHOLDS.vibrationWarnMult) {
    out.push({ code: "vibration-high", level: "warning" });
  }
  if (m.health.healthScore < THRESHOLDS.healthCritical) {
    out.push({ code: "health-low", level: "critical" });
  }
  return out;
}

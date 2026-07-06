/**
 * TwinForge — core domain types.
 *
 * These types are the single source of truth for the whole frontend and
 * intentionally mirror the FastAPI Pydantic schemas (backend/app/schemas.py)
 * so a real backend / MQTT feed can replace the local simulation without
 * touching any component code.
 */

export type MachineStatus = "running" | "idle" | "maintenance" | "offline";

export type MachineType = "robot-arm" | "conveyor" | "agv" | "cnc" | "storage";

export type FaultType =
  | "bearing-failure"
  | "motor-overheating"
  | "high-vibration"
  | "sensor-failure"
  | "power-spike"
  | "conveyor-jam";

export type AlertLevel = "info" | "warning" | "critical";

/** Simulation speed multiplier. */
export type SimSpeed = 1 | 5 | 10;

export type SensorKey =
  | "temperature"
  | "current"
  | "power"
  | "rpm"
  | "pressure"
  | "humidity"
  | "vibration";

export type SensorReadings = Record<SensorKey, number>;

export interface MachineHealth {
  /** 0–100 composite health score. */
  healthScore: number;
  /** 0–1 probability of imminent fault. */
  faultProbability: number;
  /** Remaining Useful Life estimate, in hours. */
  rulHours: number;
}

export interface Machine {
  id: string;
  /** i18n key suffix is not used for names — names are asset tags. */
  name: string;
  type: MachineType;
  status: MachineStatus;
  /** Line / zone label, e.g. "Line A". */
  zone: string;
  sensors: SensorReadings;
  health: MachineHealth;
  activeFault: FaultType | null;
  /** Total accumulated runtime, hours. */
  uptimeHours: number;
  /** 3D scene placement [x, y, z]. */
  position: [number, number, number];
  /** 3D yaw rotation in radians. */
  rotationY: number;
}

/**
 * Alerts carry a machine-readable `code`; the human strings (title,
 * description, recommendation) live in the i18n dictionaries so alerts
 * translate live when the user switches language.
 */
export type AlertCode =
  | FaultType
  | "temp-high"
  | "vibration-high"
  | "power-anomaly"
  | "health-low"
  | "sim-started"
  | "sim-stopped"
  | "emergency-stop"
  | "fault-cleared"
  | "maintenance-started"
  | "machine-recovered";

export interface Alert {
  id: string;
  /** Unix ms. */
  timestamp: number;
  machineId: string;
  level: AlertLevel;
  code: AlertCode;
  acknowledged: boolean;
}

export interface TimeSeriesPoint {
  /** Unix ms (simulation clock). */
  t: number;
  temperature: number;
  current: number;
  power: number;
  vibration: number;
  rpm: number;
}

export interface FactoryPoint {
  t: number;
  /** Total instantaneous power draw, kW. */
  power: number;
  /** Cumulative energy, kWh. */
  energy: number;
  /** Machines currently running. */
  running: number;
}

/** Aggregated production KPIs shown on the Analytics page. */
export interface KpiSnapshot {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  mtbfHours: number;
  mttrHours: number;
  energyKwhToday: number;
  downtimeHoursToday: number;
  dailyProduction: number;
  productionTarget: number;
}

/* ----------------------------- AI layer ----------------------------- */

/**
 * Contract for anomaly-detection models. The bundled implementation is a
 * statistical mock (lib/simulation/ai.ts); a real LSTM Autoencoder served
 * by FastAPI (/api/ai/*) satisfies the same interface.
 */
export interface AnomalyResult {
  machineId: string;
  /** 0–1 anomaly score (reconstruction error, normalised). */
  score: number;
  threshold: number;
  isAnomaly: boolean;
  /** Sensor channels contributing most to the score, sorted desc. */
  topContributors: SensorKey[];
}

export interface AiRecommendation {
  id: string;
  machineId: string;
  severity: AlertLevel;
  /** i18n key into dict.aiRecs */
  code:
    | "schedule-bearing"
    | "reduce-load"
    | "check-cooling"
    | "recalibrate-sensor"
    | "inspect-belt"
    | "plan-maintenance";
  confidence: number;
}

export interface RootCauseNode {
  /** i18n key into dict.rootCauses */
  code: string;
  probability: number;
}

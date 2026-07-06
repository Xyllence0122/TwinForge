import type { AlertLevel, FaultType, MachineStatus, MachineType, SensorKey } from "@/lib/types";

/** Brand palette (kept in sync with app/globals.css @theme tokens). */
export const COLORS = {
  primary: "#3B82F6",
  accent: "#22D3EE",
  bg: "#070B14",
  surface: "#0B1120",
  ink: "#E2E8F0",
  inkDim: "#94A3B8",
} as const;

export const STATUS_COLORS: Record<MachineStatus, string> = {
  running: "#10B981",
  idle: "#64748B",
  maintenance: "#F59E0B",
  offline: "#EF4444",
};

export const ALERT_COLORS: Record<AlertLevel, string> = {
  info: "#38BDF8",
  warning: "#F59E0B",
  critical: "#EF4444",
};

export const SENSOR_UNITS: Record<SensorKey, string> = {
  temperature: "°C",
  current: "A",
  power: "kW",
  rpm: "RPM",
  pressure: "bar",
  humidity: "%",
  vibration: "mm/s",
};

export const SENSOR_COLORS: Record<SensorKey, string> = {
  temperature: "#F97316",
  current: "#EAB308",
  power: "#3B82F6",
  rpm: "#A78BFA",
  pressure: "#22D3EE",
  humidity: "#34D399",
  vibration: "#F43F5E",
};

export const FAULT_TYPES: FaultType[] = [
  "bearing-failure",
  "motor-overheating",
  "high-vibration",
  "sensor-failure",
  "power-spike",
  "conveyor-jam",
];

export const MACHINE_TYPES: MachineType[] = [
  "robot-arm",
  "conveyor",
  "agv",
  "cnc",
  "storage",
];

/** History buffer length per machine (points). */
export const HISTORY_LENGTH = 90;

/** Base simulation tick in real milliseconds (divided by speed). */
export const BASE_TICK_MS = 1000;

/** How many simulated seconds pass per tick. */
export const SIM_SECONDS_PER_TICK = 5;

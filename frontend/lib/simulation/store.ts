"use client";

import { create } from "zustand";
import { FAULT_TYPES, HISTORY_LENGTH, SIM_SECONDS_PER_TICK } from "@/lib/constants";
import { uid } from "@/lib/utils";
import { createFleet } from "./fleet";
import { evaluateThresholds, nextHealth, nextReadings } from "./engine";
import type {
  Alert,
  AlertCode,
  AlertLevel,
  FactoryPoint,
  FaultType,
  Machine,
  SimSpeed,
  TimeSeriesPoint,
} from "@/lib/types";

/**
 * Global simulation store (Zustand).
 *
 * This is the single source of truth for machines, telemetry history and
 * alerts. Components subscribe with selectors, so a tick only re-renders
 * what actually changed. Replacing the local simulation with a live feed
 * means dispatching the same `applyTick`-style updates from a WebSocket
 * or MQTT handler — the component tree stays untouched.
 */

const MAX_ALERTS = 200;
/** Minimum sim-time between identical threshold alerts per machine (ms). */
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

interface SimulationState {
  running: boolean;
  emergency: boolean;
  speed: SimSpeed;
  /** Simulation clock, unix ms (advances SIM_SECONDS_PER_TICK per tick). */
  simTime: number;
  machines: Machine[];
  /** Per-machine rolling telemetry buffers. */
  history: Record<string, TimeSeriesPoint[]>;
  /** Factory-level power/energy series. */
  factoryHistory: FactoryPoint[];
  energyKwh: number;
  alerts: Alert[];
  selectedMachineId: string | null;
  /** Bumped on Reset so chart components can clear local state. */
  epoch: number;

  start: () => void;
  stop: () => void;
  emergencyStop: () => void;
  reset: () => void;
  setSpeed: (speed: SimSpeed) => void;
  injectFault: (machineId?: string, fault?: FaultType) => void;
  clearFault: (machineId: string) => void;
  selectMachine: (id: string | null) => void;
  acknowledgeAlert: (id: string) => void;
  acknowledgeAll: () => void;
  clearAlerts: () => void;
  tick: () => void;
}

function makeAlert(simTime: number, machineId: string, level: AlertLevel, code: AlertCode): Alert {
  return { id: uid("al"), timestamp: simTime, machineId, level, code, acknowledged: false };
}

function seedHistory(machines: Machine[], simTime: number): Record<string, TimeSeriesPoint[]> {
  // Pre-fill a short history so charts render immediately on first paint.
  const history: Record<string, TimeSeriesPoint[]> = {};
  for (const m of machines) {
    const points: TimeSeriesPoint[] = [];
    let cursor = { ...m };
    for (let i = 30; i > 0; i--) {
      cursor = { ...cursor, sensors: nextReadings(cursor) };
      points.push({
        t: simTime - i * SIM_SECONDS_PER_TICK * 1000,
        temperature: cursor.sensors.temperature,
        current: cursor.sensors.current,
        power: cursor.sensors.power,
        vibration: cursor.sensors.vibration,
        rpm: cursor.sensors.rpm,
      });
    }
    history[m.id] = points;
  }
  return history;
}

function initialState() {
  const machines = createFleet();
  const simTime = Date.now();
  return {
    running: true,
    emergency: false,
    speed: 1 as SimSpeed,
    simTime,
    machines,
    history: seedHistory(machines, simTime),
    factoryHistory: [] as FactoryPoint[],
    energyKwh: 128.4, // plausible mid-shift carry-over
    alerts: [makeAlert(simTime, "cv-01", "info", "sim-started")],
    selectedMachineId: null,
    epoch: 0,
  };
}

/** Tracks last emission time per machine+code to rate-limit threshold alerts. */
const alertCooldowns = new Map<string, number>();

export const useSimulation = create<SimulationState>((set, get) => ({
  ...initialState(),

  start: () =>
    set((s) => {
      if (s.emergency) return s;
      return {
        running: true,
        machines: s.machines.map((m) =>
          m.status === "idle" ? { ...m, status: "running" as const } : m,
        ),
        alerts: pushAlert(s.alerts, makeAlert(s.simTime, s.machines[0].id, "info", "sim-started")),
      };
    }),

  stop: () =>
    set((s) => ({
      running: false,
      machines: s.machines.map((m) =>
        m.status === "running" ? { ...m, status: "idle" as const } : m,
      ),
      alerts: pushAlert(s.alerts, makeAlert(s.simTime, s.machines[0].id, "info", "sim-stopped")),
    })),

  emergencyStop: () =>
    set((s) => ({
      running: false,
      emergency: true,
      machines: s.machines.map((m) => ({ ...m, status: "offline" as const })),
      alerts: pushAlert(s.alerts, makeAlert(s.simTime, s.machines[0].id, "critical", "emergency-stop")),
    })),

  reset: () => {
    alertCooldowns.clear();
    set((s) => ({ ...initialState(), epoch: s.epoch + 1, speed: s.speed }));
  },

  setSpeed: (speed) => set({ speed }),

  injectFault: (machineId, fault) =>
    set((s) => {
      // Pick a random healthy, non-offline machine when none specified.
      const candidates = s.machines.filter(
        (m) => (machineId ? m.id === machineId : true) && !m.activeFault && m.status !== "offline",
      );
      if (candidates.length === 0) return s;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const chosen = fault ?? FAULT_TYPES[Math.floor(Math.random() * FAULT_TYPES.length)];
      const level: AlertLevel =
        chosen === "sensor-failure" || chosen === "power-spike" ? "warning" : "critical";
      return {
        machines: s.machines.map((m) => (m.id === target.id ? { ...m, activeFault: chosen } : m)),
        alerts: pushAlert(s.alerts, makeAlert(s.simTime, target.id, level, chosen)),
      };
    }),

  clearFault: (machineId) =>
    set((s) => {
      const target = s.machines.find((m) => m.id === machineId);
      if (!target?.activeFault) return s;
      return {
        machines: s.machines.map((m) =>
          m.id === machineId
            ? {
                ...m,
                activeFault: null,
                health: { ...m.health, faultProbability: Math.min(m.health.faultProbability, 0.15) },
              }
            : m,
        ),
        alerts: pushAlert(s.alerts, makeAlert(s.simTime, machineId, "info", "fault-cleared")),
      };
    }),

  selectMachine: (id) => set({ selectedMachineId: id }),

  acknowledgeAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    })),

  acknowledgeAll: () =>
    set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, acknowledged: true })) })),

  clearAlerts: () => set({ alerts: [] }),

  /** One simulation step — called by useSimulationLoop at 1s / speed. */
  tick: () => {
    const s = get();
    const simTime = s.simTime + SIM_SECONDS_PER_TICK * 1000;
    const simHoursPerTick = SIM_SECONDS_PER_TICK / 3600;
    const newAlerts: Alert[] = [];

    const machines = s.machines.map((m) => {
      const sensors = nextReadings(m);
      const health = nextHealth(m, simHoursPerTick);
      const updated: Machine = {
        ...m,
        sensors,
        health,
        uptimeHours: m.uptimeHours + (m.status === "running" ? simHoursPerTick : 0),
      };

      // Threshold alerts (rate-limited per machine+code in sim time).
      for (const breach of evaluateThresholds(updated)) {
        const key = `${m.id}:${breach.code}`;
        const last = alertCooldowns.get(key) ?? 0;
        if (simTime - last > ALERT_COOLDOWN_MS) {
          alertCooldowns.set(key, simTime);
          newAlerts.push(makeAlert(simTime, m.id, breach.level, breach.code));
        }
      }
      return updated;
    });

    // Append telemetry history.
    const history: Record<string, TimeSeriesPoint[]> = {};
    for (const m of machines) {
      const prev = s.history[m.id] ?? [];
      const point: TimeSeriesPoint = {
        t: simTime,
        temperature: m.sensors.temperature,
        current: m.sensors.current,
        power: m.sensors.power,
        vibration: m.sensors.vibration,
        rpm: m.sensors.rpm,
      };
      history[m.id] = prev.length >= HISTORY_LENGTH ? [...prev.slice(1), point] : [...prev, point];
    }

    const totalPower = machines.reduce((sum, m) => sum + m.sensors.power, 0);
    const energyKwh = s.energyKwh + (totalPower * SIM_SECONDS_PER_TICK) / 3600;
    const running = machines.filter((m) => m.status === "running").length;
    const factoryPoint: FactoryPoint = { t: simTime, power: totalPower, energy: energyKwh, running };
    const factoryHistory =
      s.factoryHistory.length >= HISTORY_LENGTH
        ? [...s.factoryHistory.slice(1), factoryPoint]
        : [...s.factoryHistory, factoryPoint];

    set({
      simTime,
      machines,
      history,
      factoryHistory,
      energyKwh,
      alerts: newAlerts.length ? pushAlert(s.alerts, ...newAlerts) : s.alerts,
    });
  },
}));

/**
 * Optional physical alarm output (Grove Beginner Kit via hardware/bridge).
 * Set NEXT_PUBLIC_HARDWARE_BRIDGE_URL to enable; unset by default so the
 * console behaves identically for everyone else. See hardware/README.md.
 */
const HARDWARE_BRIDGE_URL = process.env.NEXT_PUBLIC_HARDWARE_BRIDGE_URL;

function notifyHardware(level: AlertLevel): void {
  if (!HARDWARE_BRIDGE_URL || (level !== "warning" && level !== "critical")) return;
  fetch(`${HARDWARE_BRIDGE_URL}/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level }),
  }).catch(() => {
    /* bridge not running — hardware notification is best-effort */
  });
}

function pushAlert(existing: Alert[], ...added: Alert[]): Alert[] {
  added.forEach((a) => notifyHardware(a.level));
  return [...added.reverse(), ...existing].slice(0, MAX_ALERTS);
}

/* ------------------------ convenience selectors ------------------------ */

export const selectMachine = (id: string) => (s: SimulationState) =>
  s.machines.find((m) => m.id === id);

export const selectUnackedCount = (s: SimulationState) =>
  s.alerts.filter((a) => !a.acknowledged).length;

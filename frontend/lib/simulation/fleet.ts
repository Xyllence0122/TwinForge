import type { Machine, MachineType, SensorReadings } from "@/lib/types";

/**
 * Static factory model — the asset registry for the simulated plant.
 * In production this would be loaded from the FastAPI asset service
 * (GET /api/machines); the shape is identical.
 */

/** Nominal operating baselines per machine type. */
export const BASELINES: Record<MachineType, SensorReadings> = {
  "robot-arm": { temperature: 52, current: 11, power: 5.5, rpm: 1800, pressure: 5.6, humidity: 42, vibration: 1.8 },
  conveyor: { temperature: 44, current: 8, power: 3.2, rpm: 950, pressure: 4.2, humidity: 45, vibration: 1.2 },
  agv: { temperature: 38, current: 14, power: 2.4, rpm: 620, pressure: 3.1, humidity: 40, vibration: 0.9 },
  cnc: { temperature: 61, current: 22, power: 12.5, rpm: 8200, pressure: 6.8, humidity: 38, vibration: 2.6 },
  storage: { temperature: 35, current: 6, power: 1.8, rpm: 420, pressure: 2.8, humidity: 48, vibration: 0.6 },
};

/** Idle baselines are a fraction of running values. */
export const IDLE_FACTOR = 0.25;

function machine(
  id: string,
  name: string,
  type: MachineType,
  zone: string,
  position: [number, number, number],
  rotationY = 0,
  uptimeHours = 0,
): Machine {
  const base = BASELINES[type];
  return {
    id,
    name,
    type,
    status: "running",
    zone,
    sensors: { ...base },
    health: { healthScore: 92 + Math.random() * 6, faultProbability: 0.02, rulHours: 1600 + Math.random() * 800 },
    activeFault: null,
    uptimeHours,
    position,
    rotationY,
  };
}

/** The demo plant: 8 assets across two lines plus logistics. */
export function createFleet(): Machine[] {
  return [
    machine("ra-01", "RA-01 · Kuka KR-210", "robot-arm", "Line A", [-6, 0, -4], Math.PI / 4, 11840),
    machine("ra-02", "RA-02 · Kuka KR-210", "robot-arm", "Line B", [-6, 0, 4], -Math.PI / 4, 9320),
    machine("cv-01", "CV-01 · Main Conveyor", "conveyor", "Line A", [0, 0, 0], 0, 15210),
    machine("cnc-01", "CNC-01 · DMG Mori NLX", "cnc", "Line A", [6, 0, -4], Math.PI, 13480),
    machine("cnc-02", "CNC-02 · DMG Mori NLX", "cnc", "Line B", [6, 0, 4], Math.PI, 7112),
    machine("agv-01", "AGV-01 · MiR-600", "agv", "Logistics", [-2, 0, 8], 0, 4210),
    machine("agv-02", "AGV-02 · MiR-600", "agv", "Logistics", [3, 0, -8], Math.PI / 2, 3980),
    machine("st-01", "ST-01 · ASRS Crane", "storage", "Warehouse", [12, 0, 0], 0, 20630),
  ];
}

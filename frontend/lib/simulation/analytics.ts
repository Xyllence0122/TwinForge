import type { KpiSnapshot, Machine } from "@/lib/types";
import { clamp } from "@/lib/utils";

/**
 * Derived production KPIs. Availability/performance react to the live
 * fleet state so KPI cards move with the simulation; historical series
 * (energy, production, downtime) are stable mock datasets shaped like a
 * TimescaleDB continuous-aggregate query result.
 */

export function computeKpis(machines: Machine[], energyKwh: number): KpiSnapshot {
  const total = machines.length || 1;
  const running = machines.filter((m) => m.status === "running").length;
  const faulted = machines.filter((m) => m.activeFault).length;

  const availability = clamp(0.62 + (running / total) * 0.36, 0, 0.995);
  const avgHealth = machines.reduce((s, m) => s + m.health.healthScore, 0) / total / 100;
  const performance = clamp(0.7 + avgHealth * 0.28 - faulted * 0.05, 0.2, 0.99);
  const quality = clamp(0.975 - faulted * 0.012, 0.85, 0.999);

  return {
    oee: availability * performance * quality,
    availability,
    performance,
    quality,
    mtbfHours: clamp(180 - faulted * 35 + avgHealth * 60, 40, 260),
    mttrHours: clamp(2.1 + faulted * 0.8, 1.2, 8),
    energyKwhToday: energyKwh,
    downtimeHoursToday: clamp((total - running) * 0.6 + faulted * 0.9, 0, 24),
    dailyProduction: Math.round(1180 + running * 96),
    productionTarget: 2000,
  };
}

export interface EnergyBucket {
  hour: string;
  kwh: number;
}

/** 24 hourly buckets shaped like a factory load curve (two shift peaks). */
export function energyByHour(): EnergyBucket[] {
  const out: EnergyBucket[] = [];
  for (let h = 0; h < 24; h++) {
    const shiftA = Math.exp(-((h - 10) ** 2) / 18) * 34;
    const shiftB = Math.exp(-((h - 20) ** 2) / 22) * 28;
    const kwh = 8 + shiftA + shiftB + ((h * 7919) % 13) * 0.35; // deterministic jitter
    out.push({ hour: `${String(h).padStart(2, "0")}:00`, kwh: Math.round(kwh * 10) / 10 });
  }
  return out;
}

export interface ProductionDay {
  day: string;
  actual: number;
  target: number;
}

/** Last 7 days of production vs target. */
export function productionByDay(): ProductionDay[] {
  const actuals = [1892, 1954, 1811, 2043, 1978, 1690, 1902];
  const now = new Date();
  return actuals.map((actual, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      actual,
      target: 2000,
    };
  });
}

export type DowntimeCause = "changeover" | "breakdown" | "material" | "quality" | "planned";

export interface DowntimeBucket {
  cause: DowntimeCause;
  hours: number;
}

/** Weekly downtime pareto by cause. */
export function downtimeByCause(): DowntimeBucket[] {
  return [
    { cause: "breakdown", hours: 6.4 },
    { cause: "changeover", hours: 4.8 },
    { cause: "material", hours: 3.1 },
    { cause: "planned", hours: 2.5 },
    { cause: "quality", hours: 1.2 },
  ];
}

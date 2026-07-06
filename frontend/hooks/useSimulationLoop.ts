"use client";

import { useEffect } from "react";
import { BASE_TICK_MS } from "@/lib/constants";
import { useSimulation } from "@/lib/simulation/store";

/**
 * Drives the simulation clock. Mounted once in the dashboard layout so the
 * factory keeps evolving while the user navigates between pages. The
 * interval shortens with the selected speed multiplier (×1 / ×5 / ×10).
 */
export function useSimulationLoop(): void {
  const speed = useSimulation((s) => s.speed);

  useEffect(() => {
    const interval = window.setInterval(() => {
      useSimulation.getState().tick();
    }, BASE_TICK_MS / speed);
    return () => window.clearInterval(interval);
  }, [speed]);
}

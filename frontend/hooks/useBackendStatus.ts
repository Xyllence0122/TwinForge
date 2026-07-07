"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

export type BackendState = "checking" | "connected" | "offline";

/**
 * Polls the FastAPI /api/health endpoint. Free-tier hosts (e.g. Render)
 * cold-start after idle, so the first probe may fail while later ones
 * succeed — we keep polling rather than deciding once.
 */
export function useBackendStatus(intervalMs = 30_000): BackendState {
  const [state, setState] = useState<BackendState>("checking");

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        await api.health();
        if (!cancelled) setState("connected");
      } catch {
        if (!cancelled) setState("offline");
      }
    };

    probe();
    const id = window.setInterval(probe, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}

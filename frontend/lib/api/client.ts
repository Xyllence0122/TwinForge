/**
 * Typed API client for the TwinForge FastAPI backend.
 *
 * The console runs fully on the local simulation by default; when
 * NEXT_PUBLIC_API_URL is set (or an endpoint is saved in Settings), the
 * same typed functions read from FastAPI instead. Components never call
 * fetch directly — they depend on this module, so switching data sources
 * is a configuration change, not a refactor.
 */

import type { Alert, AnomalyResult, KpiSnapshot, Machine } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const ENDPOINT_KEY = "twinforge.endpoints";

export interface Endpoints {
  api: string;
  ws: string;
  mqtt: string;
}

export const DEFAULT_ENDPOINTS: Endpoints = {
  api: process.env.NEXT_PUBLIC_API_URL ?? "https://twinforge.onrender.com",
  ws: process.env.NEXT_PUBLIC_WS_URL ?? "wss://twinforge.onrender.com/ws/telemetry",
  mqtt: "mqtt://broker.factory.local:1883",
};

export function loadEndpoints(): Endpoints {
  if (typeof window === "undefined") return DEFAULT_ENDPOINTS;
  try {
    const raw = window.localStorage.getItem(ENDPOINT_KEY);
    return raw ? { ...DEFAULT_ENDPOINTS, ...(JSON.parse(raw) as Partial<Endpoints>) } : DEFAULT_ENDPOINTS;
  } catch {
    return DEFAULT_ENDPOINTS;
  }
}

export function saveEndpoints(endpoints: Endpoints): void {
  window.localStorage.setItem(ENDPOINT_KEY, JSON.stringify(endpoints));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = loadEndpoints().api.replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: init?.signal ?? AbortSignal.timeout(5000),
    });
  } catch (err) {
    throw new ApiError(err instanceof Error ? err.message : "Network error");
  }
  if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);
  return (await res.json()) as T;
}

/* --------------------- REST endpoints (FastAPI) --------------------- */

export const api = {
  health: () => request<{ status: string; version: string }>("/api/health"),
  machines: () => request<Machine[]>("/api/machines"),
  machine: (id: string) => request<Machine>(`/api/machines/${id}`),
  alerts: () => request<Alert[]>("/api/alerts"),
  kpis: () => request<KpiSnapshot>("/api/analytics/kpis"),
  anomaly: (machineId: string) =>
    request<AnomalyResult>("/api/ai/anomaly", {
      method: "POST",
      body: JSON.stringify({ machine_id: machineId }),
    }),
};

/**
 * Live telemetry subscription. The production implementation connects to
 * FastAPI's WebSocket (or an MQTT-over-WS bridge); consumers receive the
 * same Machine[] payload the local simulation produces.
 */
export function subscribeTelemetry(
  onMessage: (machines: Machine[]) => void,
  onError?: (err: Event) => void,
): () => void {
  const ws = new WebSocket(loadEndpoints().ws);
  ws.onmessage = (ev) => {
    try {
      onMessage(JSON.parse(ev.data as string) as Machine[]);
    } catch {
      /* malformed frame — ignore */
    }
  };
  if (onError) ws.onerror = onError;
  return () => ws.close();
}

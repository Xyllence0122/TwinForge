import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Format a number with fixed decimals and tabular-friendly output. */
export function fmt(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a unix-ms timestamp as HH:MM:SS (24h). */
export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

/** Format a unix-ms timestamp as a full locale date-time. */
export function fmtDateTime(ts: number, locale: string): string {
  return new Date(ts).toLocaleString(locale === "zh-TW" ? "zh-TW" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Relative "x min ago" formatter, i18n-aware via provided suffixes. */
export function timeAgo(ts: number, now: number, suffixes: { s: string; m: string; h: string }) {
  const diff = Math.max(0, now - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}${suffixes.s}`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}${suffixes.m}`;
  return `${Math.floor(m / 60)}${suffixes.h}`;
}

/** Hours → "123 h" or "5.2 d" style compact duration. */
export function fmtHours(hours: number): string {
  if (hours >= 48) return `${fmt(hours / 24, 1)} d`;
  return `${fmt(hours, 0)} h`;
}

let idCounter = 0;
/** Monotonic unique id (sufficient for client-side entities). */
export function uid(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/** Deterministic-ish gaussian noise via Box–Muller. */
export function gaussian(mean = 0, std = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

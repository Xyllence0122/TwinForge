"use client";

import { clamp } from "@/lib/utils";

interface RadialGaugeProps {
  /** 0–100 */
  value: number;
  label: string;
  /** Text inside the ring; defaults to `${value}%`. */
  display?: string;
  color?: string;
  size?: number;
}

/**
 * SVG radial gauge (270° arc) for health / OEE style metrics.
 * Pure SVG — no chart library — so it stays crisp at any size.
 */
export function RadialGauge({ value, label, display, color = "#3B82F6", size = 128 }: RadialGaugeProps) {
  const pct = clamp(value, 0, 100) / 100;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270°
  const dashFull = c * arc;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-[135deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.12)"
            strokeWidth={stroke}
            strokeDasharray={`${dashFull} ${c}`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dashFull * pct} ${c}`}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 6px ${color}88)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-xl font-semibold text-ink">
            {display ?? `${Math.round(value)}%`}
          </span>
        </div>
      </div>
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">{label}</span>
    </div>
  );
}

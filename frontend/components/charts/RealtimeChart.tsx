"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, fmtTime } from "@/lib/utils";

interface RealtimeChartProps<T extends { t: number }> {
  data: T[];
  dataKey: Extract<keyof T, string>;
  color: string;
  unit?: string;
  height?: number;
  /** Fix the y-domain lower bound to zero (default true). */
  zeroBased?: boolean;
}

/**
 * Streaming single-series area chart. Animation is disabled so points can
 * append every tick without re-triggering entrance transitions — the
 * standard approach for live telemetry.
 */
export function RealtimeChart<T extends { t: number }>({
  data,
  dataKey,
  color,
  unit = "",
  height = 180,
  zeroBased = true,
}: RealtimeChartProps<T>) {
  const gradientId = useId();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
        <XAxis
          dataKey="t"
          tickFormatter={(t: number) => fmtTime(t)}
          tick={{ fill: "#64748B", fontSize: 10 }}
          axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          domain={zeroBased ? [0, "auto"] : ["auto", "auto"]}
          tick={{ fill: "#64748B", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) => fmt(v, 0)}
        />
        <Tooltip
          isAnimationActive={false}
          contentStyle={{
            background: "rgba(11,17,32,0.92)",
            border: "1px solid rgba(148,163,184,0.18)",
            borderRadius: 12,
            fontSize: 12,
            color: "#E2E8F0",
          }}
          labelStyle={{ color: "#94A3B8", fontSize: 11 }}
          labelFormatter={(t) => fmtTime(Number(t))}
          formatter={(value) => [`${fmt(Number(value))} ${unit}`, ""]}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

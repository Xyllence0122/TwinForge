"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
  accent?: string;
  /** Small trailing context, e.g. "of 8". */
  hint?: string;
  className?: string;
}

/** KPI stat tile with animated entrance and tabular numerals. */
export function Stat({ label, value, unit, icon: Icon, accent = "#3B82F6", hint, className }: StatProps) {
  return (
    <GlassCard className={cn("relative overflow-hidden p-4", className)}>
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-2 flex items-baseline gap-1.5"
      >
        <span className="tabular text-2xl font-semibold text-ink">{value}</span>
        {unit && <span className="text-xs text-ink-dim">{unit}</span>}
        {hint && <span className="ml-auto text-[11px] text-ink-faint">{hint}</span>}
      </motion.div>
    </GlassCard>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Forklift, Layers, Truck, Wrench, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { SENSOR_COLORS, SENSOR_UNITS } from "@/lib/constants";
import { fmt, fmtHours } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/Badge";
import { ProgressBar, healthColor } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/charts/Sparkline";
import type { Machine, MachineType } from "@/lib/types";

const TYPE_ICONS: Record<MachineType, LucideIcon> = {
  "robot-arm": Bot,
  conveyor: Forklift,
  agv: Truck,
  cnc: Wrench,
  storage: Layers,
};

/** Fleet card — live status, health bar, temperature sparkline. */
export function MachineCard({ machine, index = 0 }: { machine: Machine; index?: number }) {
  const { dict } = useI18n();
  const history = useSimulation((s) => s.history[machine.id]);
  const Icon = TYPE_ICONS[machine.type];
  const tempSeries = (history ?? []).slice(-30).map((p) => p.temperature);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/dashboard/machines/${machine.id}`} className="block">
        <GlassCard interactive className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.03]">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{machine.name}</div>
                <div className="text-[11px] text-ink-faint">
                  {dict.machineTypes[machine.type]} · {machine.zone}
                </div>
              </div>
            </div>
            <StatusBadge status={machine.status} label={dict.status[machine.status]} />
          </div>

          {/* Health */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-ink-faint">{dict.sensors.healthScore}</span>
              <span className="tabular font-semibold" style={{ color: healthColor(machine.health.healthScore) }}>
                {fmt(machine.health.healthScore, 0)}%
              </span>
            </div>
            <ProgressBar value={machine.health.healthScore} color={healthColor(machine.health.healthScore)} />
          </div>

          {/* Live temperature + sparkline */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-faint">
                {dict.sensors.temperature}
              </div>
              <div className="tabular mt-0.5 text-lg font-semibold text-ink">
                {fmt(machine.sensors.temperature)}
                <span className="ml-1 text-xs font-normal text-ink-faint">{SENSOR_UNITS.temperature}</span>
              </div>
            </div>
            <Sparkline values={tempSeries} color={SENSOR_COLORS.temperature} />
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px]">
            <span className="text-ink-faint">
              {dict.machines.uptime}: <span className="text-ink-dim">{fmtHours(machine.uptimeHours)}</span>
            </span>
            {machine.activeFault ? (
              <span className="font-medium text-[#FCA5A5]">{dict.faults[machine.activeFault]}</span>
            ) : (
              <span className="text-ink-faint">{dict.machines.noFault}</span>
            )}
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

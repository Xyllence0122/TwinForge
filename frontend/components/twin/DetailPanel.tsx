"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Wrench, X, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { SENSOR_UNITS, STATUS_COLORS } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar, healthColor } from "@/components/ui/ProgressBar";
import type { SensorKey } from "@/lib/types";

const KEY_SENSORS: SensorKey[] = ["temperature", "current", "power", "rpm", "vibration"];

/** Slide-in inspector shown when a machine is selected in the 3D scene. */
export function DetailPanel() {
  const { dict } = useI18n();
  const selectedId = useSimulation((s) => s.selectedMachineId);
  const machine = useSimulation((s) => s.machines.find((m) => m.id === s.selectedMachineId));
  const selectMachine = useSimulation((s) => s.selectMachine);
  const injectFault = useSimulation((s) => s.injectFault);
  const clearFault = useSimulation((s) => s.clearFault);

  return (
    <AnimatePresence>
      {selectedId && machine && (
        <motion.aside
          key={selectedId}
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="glass-strong absolute right-4 top-4 bottom-4 z-20 flex w-[320px] flex-col overflow-hidden rounded-2xl"
        >
          {/* Header */}
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-ink-faint">
                  {dict.twin.detailPanelTitle}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-ink">{machine.name}</h3>
                <div className="mt-0.5 text-[11px] text-ink-faint">
                  {dict.machineTypes[machine.type]} · {machine.zone}
                </div>
              </div>
              <button
                onClick={() => selectMachine(null)}
                aria-label={dict.twin.deselect}
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-white/5 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={machine.status} label={dict.status[machine.status]} />
              {machine.activeFault && (
                <span className="rounded-full border border-critical/40 bg-critical/10 px-2.5 py-0.5 text-[11px] font-medium text-[#FCA5A5]">
                  {dict.faults[machine.activeFault]}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* Health */}
            <section>
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="uppercase tracking-wider text-ink-faint">{dict.twin.health}</span>
                <span className="tabular font-semibold" style={{ color: healthColor(machine.health.healthScore) }}>
                  {fmt(machine.health.healthScore, 0)}%
                </span>
              </div>
              <ProgressBar value={machine.health.healthScore} color={healthColor(machine.health.healthScore)} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-line bg-white/[0.02] p-2.5">
                  <div className="text-ink-faint">{dict.sensors.faultProbability}</div>
                  <div className="tabular mt-1 text-sm font-semibold text-ink">
                    {fmt(machine.health.faultProbability * 100, 1)}%
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-white/[0.02] p-2.5">
                  <div className="text-ink-faint">{dict.sensors.rul}</div>
                  <div className="tabular mt-1 text-sm font-semibold text-ink">
                    {fmt(machine.health.rulHours, 0)} h
                  </div>
                </div>
              </div>
            </section>

            {/* Key sensors */}
            <section>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-ink-faint">
                {dict.twin.keySensors}
              </div>
              <div className="space-y-1.5">
                {KEY_SENSORS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-line bg-white/[0.02] px-3 py-2"
                  >
                    <span className="text-xs text-ink-dim">{dict.sensors[key]}</span>
                    <span className="tabular text-xs font-semibold text-ink">
                      {fmt(machine.sensors[key], key === "rpm" ? 0 : 1)}{" "}
                      <span className="font-normal text-ink-faint">{SENSOR_UNITS[key]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer actions */}
          <div className="space-y-2 border-t border-line px-5 py-4">
            {machine.activeFault ? (
              <Button variant="success" size="sm" className="w-full" onClick={() => clearFault(machine.id)}>
                <Wrench className="h-3.5 w-3.5" /> {dict.machineDetail.clearFault}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => injectFault(machine.id)}
                disabled={machine.status === "offline"}
              >
                <Zap className="h-3.5 w-3.5 text-warning" /> {dict.machineDetail.injectFault}
              </Button>
            )}
            <Link href={`/dashboard/machines/${machine.id}`} className="block">
              <Button variant="primary" size="sm" className="w-full">
                {dict.twin.openDetail} <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Small floating legend for the twin scene. */
export function StatusLegend() {
  const { dict } = useI18n();
  return (
    <div className="glass-strong absolute left-4 top-4 z-10 rounded-xl px-4 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
        {dict.twin.legend}
      </div>
      <div className="space-y-1.5">
        {(Object.keys(STATUS_COLORS) as Array<keyof typeof STATUS_COLORS>).map((status) => (
          <div key={status} className="flex items-center gap-2 text-[11px] text-ink-dim">
            <span
              className="dot-glow h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status], color: STATUS_COLORS[status] }}
            />
            {dict.status[status]}
          </div>
        ))}
      </div>
    </div>
  );
}

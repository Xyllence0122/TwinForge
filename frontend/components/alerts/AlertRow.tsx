"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Lightbulb } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { ALERT_COLORS } from "@/lib/constants";
import { cn, fmtDateTime } from "@/lib/utils";
import { LevelBadge } from "@/components/ui/Badge";
import type { Alert } from "@/lib/types";

/** One alert entry: severity, timestamp, machine, description, recommendation. */
export function AlertRow({ alert, showRecommendation = true }: { alert: Alert; showRecommendation?: boolean }) {
  const { dict, locale } = useI18n();
  const machine = useSimulation((s) => s.machines.find((m) => m.id === alert.machineId));
  const acknowledge = useSimulation((s) => s.acknowledgeAlert);
  const content = dict.alertContent[alert.code];
  const machineName = machine?.name ?? alert.machineId;
  const levelLabel =
    alert.level === "critical"
      ? dict.alerts.levelCritical
      : alert.level === "warning"
        ? dict.alerts.levelWarning
        : dict.alerts.levelInfo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-2xl p-4 transition-opacity",
        alert.acknowledged && "opacity-55",
      )}
      style={{ borderLeft: `2px solid ${ALERT_COLORS[alert.level]}` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={alert.level} label={levelLabel} />
        <Link
          href={`/dashboard/machines/${alert.machineId}`}
          className="text-xs font-medium text-accent transition-opacity hover:opacity-75"
        >
          {machineName}
        </Link>
        <span className="tabular ml-auto text-[11px] text-ink-faint">
          {fmtDateTime(alert.timestamp, locale)}
        </span>
      </div>

      <h4 className="mt-2.5 text-sm font-semibold text-ink">{content.title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-ink-dim">
        {content.description.replace("{machine}", machineName)}
      </p>

      {showRecommendation && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.5} />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {dict.alerts.recommendation}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">
              {content.recommendation.replace("{machine}", machineName)}
            </p>
          </div>
        </div>
      )}

      {!alert.acknowledged && (
        <button
          onClick={() => acknowledge(alert.id)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-ink-dim transition-colors hover:border-primary/40 hover:text-ink"
        >
          <Check className="h-3 w-3" /> {dict.alerts.acknowledge}
        </button>
      )}
    </motion.div>
  );
}

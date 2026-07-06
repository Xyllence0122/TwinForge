"use client";

import { BrainCircuit, GitBranch, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { lstmAutoencoderMock, getRecommendations, getRootCauses } from "@/lib/simulation/ai";
import { ALERT_COLORS } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { GlassCard, CardHeader } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import type { Machine } from "@/lib/types";

/**
 * Per-machine AI panel: anomaly detection (mock LSTM autoencoder),
 * root-cause ranking and recommendations. Swapping in real inference
 * means replacing lib/simulation/ai.ts with calls to /api/ai/* —
 * this component only consumes the typed results.
 */
export function AiInsights({ machine }: { machine: Machine }) {
  const { dict } = useI18n();
  const anomaly = lstmAutoencoderMock.detect(machine);
  const rootCauses = getRootCauses(machine).slice(0, 4);
  const recs = getRecommendations([machine]).slice(0, 3);

  const scoreColor = anomaly.isAnomaly ? "#EF4444" : "#10B981";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Anomaly detection */}
      <GlassCard>
        <CardHeader
          title={dict.ai.anomalyTitle}
          subtitle={dict.ai.anomalySub}
          action={<Badge color="#A78BFA" dot={false}>{dict.ai.modelBadge}</Badge>}
        />
        <div className="px-5 pb-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-faint">{dict.ai.score}</span>
            <span className="tabular text-2xl font-semibold" style={{ color: scoreColor }}>
              {fmt(anomaly.score, 2)}
            </span>
          </div>
          <div className="relative mt-2">
            <ProgressBar value={anomaly.score * 100} color={scoreColor} />
            {/* Threshold marker */}
            <div
              className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink-dim"
              style={{ left: `${anomaly.threshold * 100}%` }}
              title={`${dict.ai.threshold}: ${anomaly.threshold}`}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-ink-faint">
            <span>
              {dict.ai.threshold}: {anomaly.threshold}
            </span>
            <span
              className="font-semibold"
              style={{ color: scoreColor }}
            >
              {anomaly.isAnomaly ? dict.ai.anomalous : dict.ai.normal}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              {dict.ai.contributors}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {anomaly.topContributors.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink-dim"
                >
                  {dict.sensors[c]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Root cause analysis */}
      <GlassCard>
        <CardHeader
          title={dict.ai.rootCauseTitle}
          subtitle={dict.ai.rootCauseSub}
          action={<GitBranch className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
        />
        <div className="space-y-3 px-5 pb-5">
          {rootCauses.map((rc) => (
            <div key={rc.code}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-ink-dim">
                  {dict.rootCauses[rc.code as keyof typeof dict.rootCauses] ?? rc.code}
                </span>
                <span className="tabular font-semibold text-ink">{fmt(rc.probability * 100, 0)}%</span>
              </div>
              <ProgressBar value={rc.probability * 100} color="#22D3EE" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recommendations */}
      <GlassCard>
        <CardHeader
          title={dict.ai.recsTitle}
          subtitle={dict.ai.recsSub}
          action={<Sparkles className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
        />
        <div className="space-y-2 px-5 pb-5">
          {recs.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white/[0.02] px-3 py-3">
              <BrainCircuit className="h-4 w-4 shrink-0 text-status-running" strokeWidth={1.5} />
              <p className="text-xs leading-relaxed text-ink-dim">{dict.ai.noRecs}</p>
            </div>
          ) : (
            recs.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="dot-glow h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ALERT_COLORS[rec.severity], color: ALERT_COLORS[rec.severity] }}
                  />
                  <span className="text-[10px] tabular text-ink-faint">
                    {fmt(rec.confidence * 100, 0)}% {dict.ai.confidence}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">{dict.aiRecs[rec.code]}</p>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}

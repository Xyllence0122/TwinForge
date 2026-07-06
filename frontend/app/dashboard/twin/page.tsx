"use client";

import { useI18n } from "@/lib/i18n";
import { TwinCanvas } from "@/components/twin/TwinCanvas";
import { DetailPanel, StatusLegend } from "@/components/twin/DetailPanel";
import { ControlPanel } from "@/components/simulation/ControlPanel";
import { GlassCard } from "@/components/ui/GlassCard";

/** Digital Twin — the interactive 3D factory (core feature). */
export default function TwinPage() {
  const { dict } = useI18n();

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[540px] flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{dict.twin.title}</h1>
          <p className="mt-0.5 text-xs text-ink-faint">{dict.twin.subtitle}</p>
        </div>
        <span className="hidden text-[11px] text-ink-faint md:block">{dict.twin.hint}</span>
      </div>

      {/* 3D viewport */}
      <GlassCard className="grid-bg relative flex-1 overflow-hidden">
        <TwinCanvas />
        <StatusLegend />
        <DetailPanel />
      </GlassCard>

      {/* Control deck */}
      <GlassCard className="px-4 py-3">
        <ControlPanel compact />
      </GlassCard>
    </div>
  );
}

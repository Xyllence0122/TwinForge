"use client";

import { AlertOctagon, Play, RotateCcw, Square, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation/store";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { SimSpeed } from "@/lib/types";

const SPEEDS: SimSpeed[] = [1, 5, 10];

/**
 * Factory simulation control panel — start/stop, e-stop, fault injection,
 * reset and speed multipliers. Used on both Overview and Digital Twin.
 */
export function ControlPanel({ compact = false }: { compact?: boolean }) {
  const { dict } = useI18n();
  const running = useSimulation((s) => s.running);
  const emergency = useSimulation((s) => s.emergency);
  const speed = useSimulation((s) => s.speed);
  const { start, stop, emergencyStop, injectFault, reset, setSpeed } = useSimulation();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "" : "gap-3")}>
      {running ? (
        <Button variant="secondary" size={compact ? "sm" : "md"} onClick={stop}>
          <Square className="h-3.5 w-3.5" /> {dict.control.stop}
        </Button>
      ) : (
        <Button
          variant="success"
          size={compact ? "sm" : "md"}
          onClick={start}
          disabled={emergency}
          title={emergency ? dict.control.emergencyHint : undefined}
        >
          <Play className="h-3.5 w-3.5" /> {dict.control.start}
        </Button>
      )}

      <Button
        variant="danger"
        size={compact ? "sm" : "md"}
        onClick={emergencyStop}
        disabled={emergency}
        className={cn(emergency && "animate-pulse")}
      >
        <AlertOctagon className="h-3.5 w-3.5" />
        {emergency ? dict.control.emergencyActive : dict.control.emergency}
      </Button>

      <Button
        variant="secondary"
        size={compact ? "sm" : "md"}
        onClick={() => injectFault()}
        disabled={emergency}
      >
        <Zap className="h-3.5 w-3.5 text-warning" /> {dict.control.injectFault}
      </Button>

      <Button variant="ghost" size={compact ? "sm" : "md"} onClick={reset}>
        <RotateCcw className="h-3.5 w-3.5" /> {dict.control.reset}
      </Button>

      {/* Speed selector */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="mr-1 text-[11px] uppercase tracking-wider text-ink-faint">
          {dict.control.speed}
        </span>
        <div className="flex overflow-hidden rounded-xl border border-line">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-colors",
                speed === s
                  ? "bg-primary/25 text-accent"
                  : "text-ink-faint hover:bg-white/5 hover:text-ink",
              )}
            >
              ×{s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

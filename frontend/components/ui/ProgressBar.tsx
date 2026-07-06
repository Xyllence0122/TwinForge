import { cn, clamp } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  color?: string;
  className?: string;
}

/** Thin horizontal meter used for health, probability, confidence. */
export function ProgressBar({ value, color = "#3B82F6", className }: ProgressBarProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
      />
    </div>
  );
}

/** Health score → semantic color. */
export function healthColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

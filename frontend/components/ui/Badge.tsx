import { cn } from "@/lib/utils";
import { ALERT_COLORS, STATUS_COLORS } from "@/lib/constants";
import type { AlertLevel, MachineStatus } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  /** Show the glowing status dot. */
  dot?: boolean;
}

/** Pill badge with optional glowing status dot. */
export function Badge({ children, color = "#64748B", dot = true, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        className,
      )}
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      {dot && (
        <span className="dot-glow h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color, color }} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: MachineStatus; label: string }) {
  return <Badge color={STATUS_COLORS[status]}>{label}</Badge>;
}

export function LevelBadge({ level, label }: { level: AlertLevel; label: string }) {
  return <Badge color={ALERT_COLORS[level]}>{label}</Badge>;
}

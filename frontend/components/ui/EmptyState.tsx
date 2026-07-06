import type { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}

/** Consistent empty state for lists, filters and missing resources. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <GlassCard className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white/[0.03]">
        <Icon className="h-6 w-6 text-ink-faint" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-faint">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </GlassCard>
  );
}

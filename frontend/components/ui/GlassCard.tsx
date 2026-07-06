import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation + border glow (for clickable cards). */
  interactive?: boolean;
}

/** Rounded glassmorphism surface — the base container of the design system. */
export function GlassCard({ className, interactive, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl",
        interactive &&
          "cursor-pointer transition-all duration-300 hover:border-[rgba(59,130,246,0.35)] hover:shadow-[0_0_28px_rgba(59,130,246,0.10)]",
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 pb-3", className)}>
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

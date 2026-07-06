import { cn } from "@/lib/utils";

/** TwinForge mark — twin hexagons, forge-blue gradient. Pure SVG. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("h-8 w-8", className)} aria-label="TwinForge">
      <defs>
        <linearGradient id="tf-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <path
        d="M14 6 L24 6 L29 14.5 L24 23 L14 23 L9 14.5 Z"
        stroke="url(#tf-grad)"
        strokeWidth="2.2"
        fill="rgba(59,130,246,0.10)"
      />
      <path
        d="M16 17 L26 17 L31 25.5 L26 34 L16 34 L11 25.5 Z"
        stroke="url(#tf-grad)"
        strokeWidth="2.2"
        fill="rgba(34,211,238,0.08)"
      />
    </svg>
  );
}

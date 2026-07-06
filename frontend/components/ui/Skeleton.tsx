import { cn } from "@/lib/utils";

/** Shimmering placeholder used for all loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/[0.06]", className)}
      aria-hidden="true"
    />
  );
}

/** Full-card skeleton block (header + body lines). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-3 w-48" />
      <Skeleton className="mt-6 h-24 w-full" />
    </div>
  );
}

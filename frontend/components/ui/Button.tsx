"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dim shadow-[0_0_20px_rgba(59,130,246,0.25)] disabled:shadow-none",
  secondary:
    "glass text-ink hover:border-[rgba(59,130,246,0.4)] hover:text-white",
  ghost: "text-ink-dim hover:text-ink hover:bg-white/5",
  danger:
    "bg-critical/15 text-[#FCA5A5] border border-critical/40 hover:bg-critical/25",
  success:
    "bg-status-running/15 text-[#6EE7B7] border border-status-running/40 hover:bg-status-running/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/** Standard button with brand variants; all buttons in the app use this. */
export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-wide",
        "transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

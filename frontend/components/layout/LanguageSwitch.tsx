"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { LOCALES, useI18n, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Globe dropdown — switches the entire console language instantly. */
export function LanguageSwitch() {
  const { locale, setLocale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.common.language}
        className="flex h-9 items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 text-xs font-medium text-ink-dim transition-colors hover:border-primary/40 hover:text-ink"
      >
        <Globe className="h-4 w-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">{LOCALES[locale].flag} {LOCALES[locale].label}</span>
        <span className="sm:hidden">{LOCALES[locale].flag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl p-1"
          >
            {(Object.keys(LOCALES) as Locale[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setLocale(key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors",
                  key === locale ? "bg-primary/15 text-ink" : "text-ink-dim hover:bg-white/5 hover:text-ink",
                )}
              >
                <span>
                  {LOCALES[key].flag} {LOCALES[key].label}
                </span>
                {key === locale && <Check className="h-3.5 w-3.5 text-accent" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

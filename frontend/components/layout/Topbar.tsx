"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation, selectUnackedCount } from "@/lib/simulation/store";
import { useMounted } from "@/hooks/useMounted";
import { ALERT_COLORS, STATUS_COLORS } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import { LanguageSwitch } from "./LanguageSwitch";
import { Badge } from "@/components/ui/Badge";

/** Top navigation: factory status · search · notifications · avatar · language. */
export function Topbar() {
  const { dict } = useI18n();
  const mounted = useMounted();
  const running = useSimulation((s) => s.running);
  const emergency = useSimulation((s) => s.emergency);

  const statusColor = emergency ? "#EF4444" : running ? STATUS_COLORS.running : STATUS_COLORS.idle;
  const statusLabel = emergency
    ? dict.topbar.stateEmergency
    : running
      ? dict.topbar.stateRunning
      : dict.topbar.stateStopped;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/70 px-4 backdrop-blur-xl lg:px-6">
      {/* Factory status */}
      <div className="flex items-center gap-2.5">
        <span className="hidden text-[11px] uppercase tracking-wider text-ink-faint md:inline">
          {dict.topbar.factoryStatus}
        </span>
        {mounted ? (
          <Badge color={statusColor} className={cn(emergency && "animate-pulse")}>
            {statusLabel}
          </Badge>
        ) : (
          <Badge color={STATUS_COLORS.idle}>—</Badge>
        )}
      </div>

      <div className="flex-1" />

      <MachineSearch />
      <NotificationBell />
      <LanguageSwitch />

      {/* User avatar */}
      <div
        title={`${dict.topbar.operator} · L. Hsuan`}
        className="flex h-9 w-9 select-none items-center justify-center rounded-xl border border-line bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-semibold text-ink"
      >
        LH
      </div>
    </header>
  );
}

/* ----------------------------- Search ----------------------------- */

function MachineSearch() {
  const { dict } = useI18n();
  const router = useRouter();
  const machines = useSimulation((s) => s.machines);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? machines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.zone.toLowerCase().includes(q) ||
          dict.machineTypes[m.type].toLowerCase().includes(q),
      )
    : [];

  return (
    <div ref={ref} className="relative hidden sm:block">
      <div className="flex h-9 w-44 items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-3 transition-all focus-within:w-64 focus-within:border-primary/40 lg:w-56">
        <Search className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={dict.topbar.searchPlaceholder}
          className="w-full bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      <AnimatePresence>
        {focused && q && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl p-1"
          >
            {results.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-ink-faint">{dict.topbar.noResults}</div>
            ) : (
              results.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    router.push(`/dashboard/machines/${m.id}`);
                    setQuery("");
                    setFocused(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <div>
                    <div className="text-xs font-medium text-ink">{m.name}</div>
                    <div className="text-[10px] text-ink-faint">
                      {dict.machineTypes[m.type]} · {m.zone}
                    </div>
                  </div>
                  <span
                    className="dot-glow h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[m.status], color: STATUS_COLORS[m.status] }}
                  />
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------- Notifications -------------------------- */

function NotificationBell() {
  const { dict } = useI18n();
  const mounted = useMounted();
  const alerts = useSimulation((s) => s.alerts);
  const simTime = useSimulation((s) => s.simTime);
  const unacked = useSimulation(selectUnackedCount);
  const acknowledgeAll = useSimulation((s) => s.acknowledgeAll);
  const machines = useSimulation((s) => s.machines);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const recent = alerts.slice(0, 6);
  const suffixes = { s: dict.common.agoS, m: dict.common.agoM, h: dict.common.agoH };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.topbar.notifications}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-ink-dim transition-colors hover:border-primary/40 hover:text-ink"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {mounted && unacked > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            {unacked > 9 ? "9+" : unacked}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-xs font-semibold text-ink">{dict.topbar.notifications}</span>
              <button
                onClick={acknowledgeAll}
                className="text-[11px] text-accent transition-opacity hover:opacity-75"
              >
                {dict.topbar.markAllRead}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {recent.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-ink-faint">
                  {dict.topbar.noNotifications}
                </div>
              ) : (
                recent.map((a) => {
                  const machine = machines.find((m) => m.id === a.machineId);
                  const content = dict.alertContent[a.code];
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]",
                        !a.acknowledged && "bg-white/[0.02]",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="dot-glow h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: ALERT_COLORS[a.level], color: ALERT_COLORS[a.level] }}
                        />
                        <span className="truncate text-xs font-medium text-ink">{content.title}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-ink-faint">
                          {timeAgo(a.timestamp, simTime, suffixes)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 pl-3.5 text-[11px] leading-relaxed text-ink-dim">
                        {content.description.replace("{machine}", machine?.name ?? a.machineId)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            <Link
              href="/dashboard/alerts"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-[11px] font-medium text-accent transition-colors hover:bg-white/[0.03]"
            >
              {dict.topbar.openAlertCenter}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

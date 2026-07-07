"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Boxes,
  Cpu,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation, selectUnackedCount } from "@/lib/simulation/store";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

interface NavItem {
  href: string;
  labelKey: "overview" | "machines" | "analytics" | "alerts" | "digitalTwin" | "settings";
  icon: LucideIcon;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/machines", labelKey: "machines", icon: Boxes },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: Activity },
  { href: "/dashboard/alerts", labelKey: "alerts", icon: Bell },
  { href: "/dashboard/twin", labelKey: "digitalTwin", icon: Cpu },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

/** Fixed left navigation rail. Collapses to icons on small screens. */
export function Sidebar() {
  const pathname = usePathname();
  const { dict } = useI18n();
  const unacked = useSimulation(selectUnackedCount);
  const mounted = useMounted();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-line bg-surface/70 backdrop-blur-xl lg:w-60">
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-line px-4 lg:px-5">
        <Logo className="h-8 w-8 shrink-0" />
        <div className="hidden lg:block">
          <div className="text-sm font-semibold tracking-wide text-ink">{dict.common.appName}</div>
          <div className="text-[10px] text-ink-faint">{dict.common.tagline}</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-2 py-4 lg:px-3">
        <div className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-faint lg:block">
          {dict.nav.platform}
        </div>
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={dict.nav[item.labelKey]}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                active
                  ? "bg-primary/12 text-ink"
                  : "text-ink-dim hover:bg-white/[0.04] hover:text-ink",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_#22D3EE]" />
              )}
              <Icon
                className={cn("h-[18px] w-[18px] shrink-0", active ? "text-accent" : "text-ink-faint group-hover:text-ink-dim")}
                strokeWidth={1.6}
              />
              <span className="hidden lg:inline">{dict.nav[item.labelKey]}</span>
              {item.labelKey === "alerts" && mounted && unacked > 0 && (
                <span className="ml-auto hidden min-w-5 rounded-full bg-critical/20 px-1.5 py-0.5 text-center text-[10px] font-semibold text-[#FCA5A5] lg:inline">
                  {unacked > 99 ? "99+" : unacked}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <div className="hidden text-[10px] text-ink-faint/60 lg:block">TwinForge v1.0.0</div>
      </div>
    </aside>
  );
}

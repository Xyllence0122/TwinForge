"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Bell, Gauge, HeartPulse, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSimulation, selectUnackedCount } from "@/lib/simulation/store";
import { computeKpis } from "@/lib/simulation/analytics";
import { useMounted } from "@/hooks/useMounted";
import { fmt } from "@/lib/utils";
import { Stat } from "@/components/ui/Stat";
import { GlassCard, CardHeader } from "@/components/ui/GlassCard";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { MachineCard } from "@/components/machines/MachineCard";
import { AlertRow } from "@/components/alerts/AlertRow";
import { RealtimeChart } from "@/components/charts/RealtimeChart";
import { ControlPanel } from "@/components/simulation/ControlPanel";
import { Button } from "@/components/ui/Button";

/** Overview — the factory landing view inside the console. */
export default function OverviewPage() {
  const { dict } = useI18n();
  const mounted = useMounted();
  const machines = useSimulation((s) => s.machines);
  const factoryHistory = useSimulation((s) => s.factoryHistory);
  const energyKwh = useSimulation((s) => s.energyKwh);
  const alerts = useSimulation((s) => s.alerts);
  const unacked = useSimulation(selectUnackedCount);

  // Loading state: until the client store hydrates, show skeletons.
  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton className="lg:col-span-2" />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const running = machines.filter((m) => m.status === "running").length;
  const avgHealth = machines.reduce((s, m) => s + m.health.healthScore, 0) / machines.length;
  const totalPower = machines.reduce((s, m) => s + m.sensors.power, 0);
  const kpis = computeKpis(machines, energyKwh);
  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{dict.overview.title}</h1>
          <p className="mt-0.5 text-xs text-ink-faint">{dict.overview.subtitle}</p>
        </div>
        <Link href="/dashboard/twin">
          <Button variant="primary" size="sm">
            {dict.overview.twinShortcut} <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat
          label={dict.overview.kpiActiveMachines}
          value={`${running}`}
          hint={`/ ${machines.length}`}
          icon={Activity}
          accent="#10B981"
        />
        <Stat
          label={dict.overview.kpiAvgHealth}
          value={fmt(avgHealth, 0)}
          unit="%"
          icon={HeartPulse}
          accent={avgHealth >= 80 ? "#10B981" : avgHealth >= 60 ? "#F59E0B" : "#EF4444"}
        />
        <Stat
          label={dict.overview.kpiOpenAlerts}
          value={`${unacked}`}
          icon={Bell}
          accent={unacked > 0 ? "#EF4444" : "#64748B"}
        />
        <Stat label={dict.overview.kpiPower} value={fmt(totalPower)} unit="kW" icon={Zap} accent="#3B82F6" />
        <Stat
          label={dict.overview.kpiEnergyToday}
          value={fmt(energyKwh, 0)}
          unit="kWh"
          icon={Zap}
          accent="#22D3EE"
        />
        <Stat label={dict.overview.kpiOee} value={fmt(kpis.oee * 100, 1)} unit="%" icon={Gauge} accent="#A78BFA" />
      </div>

      {/* Power chart + control + alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader title={dict.overview.powerTitle} subtitle={dict.overview.powerSubtitle} />
          <div className="px-3 pb-4">
            <RealtimeChart data={factoryHistory} dataKey="power" color="#3B82F6" unit="kW" height={220} />
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4">
          <GlassCard>
            <CardHeader title={dict.overview.controlTitle} />
            <div className="px-5 pb-5">
              <ControlPanel compact />
            </div>
          </GlassCard>

          <GlassCard className="flex-1">
            <CardHeader
              title={dict.overview.alertsTitle}
              action={
                <Link href="/dashboard/alerts" className="text-[11px] font-medium text-accent hover:opacity-75">
                  {dict.common.viewAll}
                </Link>
              }
            />
            <div className="space-y-2 px-4 pb-4">
              {recentAlerts.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-faint">{dict.topbar.noNotifications}</p>
              ) : (
                recentAlerts.map((a) => <AlertRow key={a.id} alert={a} showRecommendation={false} />)
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Fleet grid */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">{dict.overview.fleetTitle}</h2>
            <p className="text-[11px] text-ink-faint">{dict.overview.fleetSubtitle}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {machines.map((m, i) => (
            <MachineCard key={m.id} machine={m} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

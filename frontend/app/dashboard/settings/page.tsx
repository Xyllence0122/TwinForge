"use client";

import { useEffect, useState } from "react";
import { Check, Database, Globe, Radio, SlidersHorizontal, Info } from "lucide-react";
import { LOCALES, useI18n, type Locale } from "@/lib/i18n";
import { loadEndpoints, saveEndpoints, type Endpoints } from "@/lib/api/client";
import { BASE_TICK_MS, HISTORY_LENGTH } from "@/lib/constants";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";
import { GlassCard, CardHeader } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

/** Settings — language, simulation info, integration endpoints, about. */
export default function SettingsPage() {
  const { dict, locale, setLocale } = useI18n();
  const mounted = useMounted();
  const [endpoints, setEndpoints] = useState<Endpoints>({ api: "", ws: "", mqtt: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEndpoints(loadEndpoints());
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    );
  }

  const handleSave = () => {
    saveEndpoints(endpoints);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{dict.settings.title}</h1>
        <p className="mt-0.5 text-xs text-ink-faint">{dict.settings.subtitle}</p>
      </div>

      {/* Language */}
      <GlassCard>
        <CardHeader
          title={dict.settings.languageTitle}
          subtitle={dict.settings.languageSub}
          action={<Globe className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
        />
        <div className="flex gap-3 px-5 pb-5">
          {(Object.keys(LOCALES) as Locale[]).map((key) => (
            <button
              key={key}
              onClick={() => setLocale(key)}
              className={cn(
                "flex flex-1 items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all",
                key === locale
                  ? "border-primary/50 bg-primary/12 text-ink"
                  : "border-line text-ink-dim hover:border-primary/30 hover:text-ink",
              )}
            >
              <span>
                {LOCALES[key].flag} {LOCALES[key].label}
              </span>
              {key === locale && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Simulation parameters (read-only build constants) */}
      <GlassCard>
        <CardHeader
          title={dict.settings.simTitle}
          subtitle={dict.settings.simSub}
          action={<SlidersHorizontal className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
        />
        <div className="grid grid-cols-2 gap-3 px-5 pb-5 text-xs">
          <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
            <div className="text-ink-faint">{dict.settings.tickRate}</div>
            <div className="tabular mt-1 text-base font-semibold text-ink">
              {BASE_TICK_MS} ms <span className="text-xs font-normal text-ink-faint">÷ speed</span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
            <div className="text-ink-faint">{dict.settings.historyLen}</div>
            <div className="tabular mt-1 text-base font-semibold text-ink">
              {HISTORY_LENGTH} <span className="text-xs font-normal text-ink-faint">{dict.settings.points}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Integrations */}
      <GlassCard>
        <CardHeader
          title={dict.settings.integrationsTitle}
          subtitle={dict.settings.integrationsSub}
          action={<Radio className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
        />
        <div className="space-y-3 px-5 pb-5">
          {(
            [
              ["mqtt", dict.settings.mqttBroker],
              ["ws", dict.settings.wsEndpoint],
              ["api", dict.settings.apiEndpoint],
            ] as Array<[keyof Endpoints, string]>
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                {label}
              </span>
              <input
                value={endpoints[key]}
                onChange={(e) => setEndpoints((prev) => ({ ...prev, [key]: e.target.value }))}
                spellCheck={false}
                className="w-full rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-primary/40"
              />
            </label>
          ))}
          <div className="flex items-start gap-2 rounded-xl border border-line bg-white/[0.02] px-3.5 py-3">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={1.5} />
            <p className="text-[11px] leading-relaxed text-ink-faint">{dict.settings.dbNote}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleSave}>
              {dict.settings.saveEndpoints}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-status-running">
                <Check className="h-3.5 w-3.5" /> {dict.settings.savedToast}
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* About */}
      <GlassCard>
        <CardHeader
          title={dict.settings.aboutTitle}
          subtitle={dict.settings.aboutSub}
          action={<Info className="h-4 w-4 text-ink-faint" strokeWidth={1.5} />}
        />
        <div className="space-y-2.5 px-5 pb-5 text-xs">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-ink-faint">{dict.settings.version}</span>
            <span className="font-medium text-ink">TwinForge 1.0.0</span>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-ink-faint">{dict.settings.stack}</span>
            <span className="font-medium text-ink">Next.js · React Three Fiber · FastAPI</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">{dict.settings.dataMode}</span>
            <Badge color="#22D3EE">{dict.settings.dataModeValue}</Badge>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

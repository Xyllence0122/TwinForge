"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  BrainCircuit,
  Cpu,
  Radio,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { FactoryBackdrop } from "@/components/landing/FactoryBackdrop";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55 },
} as const;

/** Public landing page. */
export default function LandingPage() {
  const { dict } = useI18n();

  const features: Array<{ icon: LucideIcon; title: string; body: string }> = [
    { icon: Cpu, title: dict.landing.feat1Title, body: dict.landing.feat1Body },
    { icon: Activity, title: dict.landing.feat2Title, body: dict.landing.feat2Body },
    { icon: BrainCircuit, title: dict.landing.feat3Title, body: dict.landing.feat3Body },
    { icon: Bell, title: dict.landing.feat4Title, body: dict.landing.feat4Body },
    { icon: Zap, title: dict.landing.feat5Title, body: dict.landing.feat5Body },
    { icon: Radio, title: dict.landing.feat6Title, body: dict.landing.feat6Body },
  ];

  const archLayers = [
    { name: dict.landing.archEdge, body: dict.landing.archEdgeBody },
    { name: dict.landing.archIngest, body: dict.landing.archIngestBody },
    { name: dict.landing.archStore, body: dict.landing.archStoreBody },
    { name: dict.landing.archAi, body: dict.landing.archAiBody },
    { name: dict.landing.archApp, body: dict.landing.archAppBody },
  ];

  const stats = [
    { value: "8", label: dict.landing.statsMachines },
    { value: "3,360+", label: dict.landing.statsSignals },
    { value: "99.5%", label: dict.landing.statsUptime },
    { value: "<1s", label: dict.landing.statsLatency },
  ];

  const showcases = [dict.landing.showcase1, dict.landing.showcase2, dict.landing.showcase3];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold tracking-wide text-ink">{dict.common.appName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                {dict.landing.ctaPrimary} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16">
        <FactoryBackdrop />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-accent"
          >
            <span className="dot-glow h-1.5 w-1.5 rounded-full bg-accent text-accent" />
            {dict.landing.heroBadge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl"
          >
            {dict.landing.heroTitle1}{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {dict.landing.heroTitle2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-ink-dim sm:text-base"
          >
            {dict.landing.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                {dict.landing.ctaPrimary} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/twin">
              <Button variant="secondary" size="lg">
                {dict.landing.ctaSecondary}
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <GlassCard key={s.label} className="px-4 py-5">
                <div className="tabular text-2xl font-semibold text-ink">{s.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-faint">{s.label}</div>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {dict.landing.featuresTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-dim">{dict.landing.featuresSubtitle}</p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.06 }}>
              <GlassCard interactive className="h-full p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <f.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-dim">{f.body}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="border-y border-line bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {dict.landing.archTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">{dict.landing.archSubtitle}</p>
          </motion.div>

          <div className="mt-12 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            {archLayers.map((layer, i) => (
              <motion.div
                key={layer.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex flex-1 items-center gap-2"
              >
                <GlassCard className="w-full p-5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-ink">{layer.name}</div>
                  <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{layer.body}</p>
                </GlassCard>
                {i < archLayers.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-faint lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {dict.landing.showcaseTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-dim">{dict.landing.showcaseSubtitle}</p>
        </motion.div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {showcases.map((caption, i) => (
            <motion.div key={caption} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <GlassCard interactive className="overflow-hidden">
                {/* Stylised console preview */}
                <div className="grid-bg relative h-44 border-b border-line bg-surface/70 p-4">
                  <div className="flex gap-1.5">
                    {["#EF4444", "#F59E0B", "#10B981"].map((c) => (
                      <span key={c} className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  {i === 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[64, 82, 47, 91, 73, 58].map((v, j) => (
                        <div key={j} className="rounded-lg border border-line bg-white/[0.03] p-2">
                          <div className="h-1 w-8 rounded bg-white/10" />
                          <div className="tabular mt-1.5 text-sm font-semibold text-ink">{v}%</div>
                          <div className="mt-1.5 h-1 rounded-full bg-white/[0.06]">
                            <div className="h-1 rounded-full bg-primary" style={{ width: `${v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 1 && (
                    <svg viewBox="0 0 260 110" className="mt-3 w-full">
                      {/* isometric-ish twin blocks */}
                      {[
                        [30, 62, "#10B981"],
                        [95, 48, "#10B981"],
                        [160, 62, "#F59E0B"],
                        [220, 50, "#EF4444"],
                      ].map(([x, y, c], j) => (
                        <g key={j}>
                          <rect x={Number(x)} y={Number(y)} width="36" height="26" rx="4" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.5)" />
                          <circle cx={Number(x) + 18} cy={Number(y) - 8} r="3" fill={String(c)} />
                        </g>
                      ))}
                      <line x1="10" y1="100" x2="250" y2="100" stroke="rgba(148,163,184,0.25)" />
                    </svg>
                  )}
                  {i === 2 && (
                    <svg viewBox="0 0 260 110" className="mt-3 w-full">
                      <polyline
                        points="0,80 30,72 60,76 90,58 120,62 150,44 180,50 210,32 240,38 260,26"
                        fill="none"
                        stroke="#22D3EE"
                        strokeWidth="2"
                      />
                      <polyline
                        points="0,95 30,90 60,92 90,84 120,86 150,76 180,80 210,68 240,72 260,64"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        opacity="0.7"
                      />
                      {[40, 100, 160, 220].map((x) => (
                        <rect key={x} x={x} y={98 - (x % 34)} width="8" height={(x % 34) + 6} rx="2" fill="rgba(148,163,184,0.3)" />
                      ))}
                    </svg>
                  )}
                </div>
                <p className="p-4 text-xs leading-relaxed text-ink-dim">{caption}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-line py-24">
        <div className="absolute left-1/2 top-1/2 h-72 w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <motion.div {...fadeUp} className="relative mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {dict.landing.ctaTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-dim">{dict.landing.ctaBody}</p>
          <Link href="/dashboard" className="mt-8 inline-block">
            <Button variant="primary" size="lg">
              {dict.landing.ctaButton} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-[11px] text-ink-faint sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <span>
              {dict.common.appName} — {dict.common.tagline}
            </span>
          </div>
          <span>{dict.landing.footerRights}</span>
        </div>
      </footer>
    </div>
  );
}

# TwinForge

**Industrial Digital Twin Platform — 工業數位分身平台**

TwinForge mirrors every machine on a factory floor into an interactive 3D digital twin with real-time telemetry, health analytics, an alert center, production KPIs and an AI-ready predictive-maintenance layer. Built as a production-grade reference platform in the style of a modern industrial SaaS (Siemens Xcelerator / Linear / Vercel aesthetic).

![Stack](https://img.shields.io/badge/Next.js%2015-App%20Router-black) ![React](https://img.shields.io/badge/React%2019-TypeScript-blue) ![R3F](https://img.shields.io/badge/React%20Three%20Fiber-3D%20Twin-8b5cf6) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)

---

## ✨ Features

| Area | What it does |
|---|---|
| **Landing page** | Animated factory hero, feature cards, architecture diagram, stats, showcase, CTA |
| **Digital Twin (core)** | Interactive React Three Fiber factory — robot arms, conveyor, AGVs, CNC machines, ASRS storage crane. Live status colors (Running / Idle / Maintenance / Offline), per-machine animation, click-to-inspect detail panel |
| **Real-time telemetry** | Temperature, current, power, RPM, pressure, humidity, vibration — streaming charts per machine + factory power/energy |
| **Machine detail** | Health Score, Fault Probability, Remaining Useful Life gauges, 7-channel live sensor grid, 4 trend charts, AI insights |
| **Simulation control** | Start / Stop / Emergency Stop / Inject Fault / Reset, speed ×1 ×5 ×10 |
| **Fault injection** | Bearing failure, motor overheating, high vibration, sensor failure, power spike, conveyor jam — each with realistic sensor signatures |
| **Alert Center** | Info / Warning / Critical alerts with timestamp, machine, description and recommendation; acknowledge workflow, filters, live notification bell |
| **Analytics** | OEE (A×P×Q), MTBF, MTTR, energy consumption, downtime pareto, daily production vs target |
| **AI layer** | Anomaly detection (LSTM-Autoencoder-shaped interface), root-cause ranking, RUL forecast, AI recommendations — mock inference behind production contracts |
| **i18n** | 🇺🇸 English + 🇹🇼 繁體中文, instant switch everywhere, type-safe dictionaries, add a locale in one file |
| **Dark mode** | Dark-first glassmorphism design system, primary `#3B82F6`, cyan accent |

## 🚀 Quick start

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### Backend (FastAPI — optional; the console runs standalone on its local simulation)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# OpenAPI docs: http://localhost:8000/docs
```

## 🗂 Project structure

```
twinforge/
├── frontend/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout (fonts, i18n provider)
│   │   ├── error.tsx / not-found.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx          # Console shell (sidebar/topbar/sim loop)
│   │       ├── page.tsx            # Overview
│   │       ├── machines/           # Fleet + [id] detail
│   │       ├── analytics/          # KPI dashboard
│   │       ├── alerts/             # Alert Center
│   │       ├── twin/               # 3D Digital Twin
│   │       └── settings/           # Language, integrations, about
│   ├── components/
│   │   ├── ui/                     # GlassCard, Button, Badge, Gauge, Skeleton…
│   │   ├── layout/                 # Sidebar, Topbar, LanguageSwitch, Logo
│   │   ├── charts/                 # RealtimeChart, Sparkline
│   │   ├── twin/                   # FactoryScene, 3D machines, DetailPanel
│   │   ├── machines/               # MachineCard, AiInsights
│   │   ├── alerts/                 # AlertRow
│   │   ├── simulation/             # ControlPanel
│   │   └── landing/                # FactoryBackdrop
│   ├── hooks/                      # useSimulationLoop, useMounted
│   └── lib/
│       ├── types.ts                # Domain types (mirror of backend schemas)
│       ├── constants.ts            # Colors, units, thresholds
│       ├── i18n/                   # en.ts, zh-TW.ts, provider
│       ├── api/client.ts           # Typed FastAPI client + WS subscription
│       └── simulation/             # fleet, engine, store, ai, analytics
└── backend/
    └── app/
        ├── main.py                 # FastAPI app + WebSocket /ws/telemetry
        ├── schemas.py              # Pydantic models (camelCase JSON contract)
        ├── core/simulation.py      # Server-side telemetry engine
        └── routers/                # machines, alerts, analytics, ai
```

## 🧠 Architecture

```
┌─────────────┐   MQTT    ┌──────────────┐   SQL    ┌────────────────┐
│  Edge nodes │ ────────▶ │   FastAPI    │ ───────▶ │  PostgreSQL +  │
│ ESP32 / RPi │           │   gateway    │          │  TimescaleDB   │
└─────────────┘           │  /ws + REST  │          └────────────────┘
                          └──────┬───────┘                 ▲
                                 │ WebSocket / REST        │ hypertable queries
                          ┌──────▼────────────────────────────────┐
                          │      Next.js console (this app)       │
                          │  Zustand telemetry store ◀─ contract  │
                          └───────────────────────────────────────┘
```

**Swap-in points (no redesign needed):**

- **Data source** — components only read from the Zustand store (`lib/simulation/store.ts`). A WebSocket/MQTT handler dispatching the same state updates replaces the local engine; `lib/api/client.ts#subscribeTelemetry` is already wired for FastAPI's `/ws/telemetry`, which pushes the identical `Machine[]` payload.
- **AI models** — every AI consumer depends on the typed contracts in `lib/types.ts` (`AnomalyResult`, `AiRecommendation`, `RootCauseNode`). Replace `lib/simulation/ai.ts` with calls to `/api/ai/*`; on the backend, swap `LSTMAutoencoderStub` in `routers/ai.py` for a real model.
- **Persistence** — backend telemetry endpoints are shaped like TimescaleDB continuous-aggregate queries; `core/simulation.py` documents the repository swap.
- **New language** — add `lib/i18n/<locale>.ts` satisfying `Dictionary` and register it in `LOCALES`. Missing keys are compile-time errors.
- **New machine** — add one entry to `createFleet()`; the 3D scene, fleet grid, search and analytics pick it up automatically.

## 🔩 Tech stack

**Frontend** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · React Three Fiber + three.js · Recharts · Zustand · lucide-react

**Backend** FastAPI · Pydantic v2 · Uvicorn (WebSocket streaming)

## 📝 Notes

- The console defaults to the **local simulation** so the whole product runs with `npm run dev` alone — no backend required. The FastAPI service exposes the same contract for production integration.
- Simulation tick: 1 s ÷ speed; each tick advances 5 s of simulated plant time.
- Alert thresholds and fault sensor-signatures live in `lib/simulation/engine.ts`.

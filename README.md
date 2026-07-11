# TwinForge

工業數位分身平台。把工廠裡的機台做成可互動的 3D digital twin，配上即時遙測、警報中心、產線 KPI，以及一層預留給預測性維護模型的 AI 介面。

前端是 Next.js 15 + React Three Fiber，後端是 FastAPI（選用，前端有內建模擬器可以單獨跑）。

## 跑起來

前端：

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

後端（選用，前端預設用本地模擬，不接後端也能完整運作）：

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API 文件在 http://localhost:8000/docs
```

## 有什麼

- 3D 工廠場景：機械手臂、輸送帶、AGV、CNC、ASRS 天車。機台狀態會反映在顏色上（Running / Idle / Maintenance / Offline），點機台可以看細節
- 即時遙測：溫度、電流、功率、轉速、壓力、濕度、振動，每台機器有自己的串流圖表
- 機台詳細頁：健康分數、故障機率、剩餘壽命（RUL），加上趨勢圖和 AI 建議
- 模擬控制：啟動 / 停止 / 緊急停止 / 注入故障 / 重置，速度可調 x1 x5 x10
- 故障注入：軸承損壞、馬達過熱、振動異常、感測器失效、電源突波、輸送帶卡料，每種都有對應的感測器特徵
- 警報中心：Info / Warning / Critical 三級，有時間戳、機台、描述、處理建議，可 acknowledge
- 分析頁：OEE、MTBF、MTTR、能耗、停機柏拉圖、日產量 vs 目標
- AI 層目前是 mock，但介面照正式的合約設計（異常偵測、根因排序、RUL 預測），之後可以直接換成真模型
- i18n：英文 + 繁體中文，字典是 type-safe 的，缺 key 會在編譯期報錯
- 深色 glassmorphism 風格

## 目錄結構

```
twinforge/
├── frontend/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout（字型、i18n provider）
│   │   └── dashboard/
│   │       ├── layout.tsx          # 主控台外框（sidebar / topbar / sim loop）
│   │       ├── page.tsx            # 總覽
│   │       ├── machines/           # 機台列表 + [id] 詳細頁
│   │       ├── analytics/          # KPI
│   │       ├── alerts/             # 警報中心
│   │       ├── twin/               # 3D 場景
│   │       └── settings/
│   ├── components/                 # ui / layout / charts / twin / machines / alerts ...
│   ├── hooks/                      # useSimulationLoop, useMounted
│   └── lib/
│       ├── types.ts                # Domain types（跟後端 schema 對齊）
│       ├── i18n/                   # en.ts, zh-TW.ts
│       ├── api/client.ts           # FastAPI client + WebSocket 訂閱
│       └── simulation/             # fleet, engine, store, ai, analytics
└── backend/
    └── app/
        ├── main.py                 # FastAPI app + /ws/telemetry
        ├── schemas.py              # Pydantic models（JSON 用 camelCase）
        ├── core/simulation.py      # 伺服器端遙測引擎
        └── routers/                # machines, alerts, analytics, ai
```

## 要接真實資料的話

設計上幾個地方是可以直接抽換的：

- **資料來源**：所有元件只讀 Zustand store（`lib/simulation/store.ts`），要接真機台就用 WebSocket/MQTT handler 餵一樣的 state。`lib/api/client.ts` 的 `subscribeTelemetry` 已經接好 FastAPI 的 `/ws/telemetry`，payload 格式跟本地模擬相同。
- **AI 模型**：AI 相關元件都只依賴 `lib/types.ts` 的型別（`AnomalyResult`、`AiRecommendation`、`RootCauseNode`）。把 `lib/simulation/ai.ts` 換成呼叫 `/api/ai/*`，後端再把 `routers/ai.py` 裡的 stub 換成真模型就好。
- **資料庫**：後端 telemetry endpoint 的查詢形狀是照 TimescaleDB continuous aggregate 設計的，`core/simulation.py` 裡有寫要怎麼換成 repository。
- **加語言**：新增 `lib/i18n/<locale>.ts` 滿足 `Dictionary` 型別，註冊到 `LOCALES`。
- **加機台**：在 `createFleet()` 加一筆，3D 場景、列表、搜尋、分析都會自動吃到。

## 技術

Next.js 15 (App Router) / React 19 / TypeScript / Tailwind v4 / React Three Fiber / Recharts / Zustand / Framer Motion。後端 FastAPI + Pydantic v2。

## 其他

- 模擬 tick 是 1 秒除以速度倍率，每個 tick 推進 5 秒的廠內時間
- 警報門檻和故障的感測器特徵定義在 `lib/simulation/engine.ts`

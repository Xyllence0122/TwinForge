# TwinForge hardware alert notifier

Wires a physical alarm (LED + buzzer) to a real TwinForge alert using a
Seeed **Grove Beginner Kit for Arduino**. When the console generates a
`warning` or `critical` alert (manual "Inject Fault", a threshold breach,
or Emergency Stop), the board blinks and/or beeps.

```
frontend (store.ts alert) --fetch--> bridge (Node, USB serial) --> Arduino board
```

## 1. Flash the Arduino

Open `arduino/grove_alert_notifier/grove_alert_notifier.ino` in the Arduino
IDE, select your board (Arduino Uno, since the Beginner Kit's MCU board is
Uno-compatible) and the correct COM port, then upload.

Onboard pins used: **LED = D4, Buzzer = D5** (per the kit's fixed wiring).
If your revision differs, check the printed board poster and edit the two
`#define`-style constants at the top of the sketch.

Quick sanity check without any PC code: open the Arduino IDE's Serial
Monitor (9600 baud), send `T` — you should get one beep + one LED flash and
a `ok:test` reply.

## 2. Run the bridge

```bash
cd hardware/bridge
npm install
npm run list-ports          # find which COM port the board is on
ARDUINO_PORT=COM5 npm start # replace COM5 with your port
```

Leave this running. It listens on `http://localhost:5055`.

Test it end-to-end without the frontend:

```bash
curl -X POST http://localhost:5055/alert -H "Content-Type: application/json" -d "{\"level\":\"critical\"}"
```

## 3. Point the frontend at the bridge

Create `frontend/.env.local`:

```
NEXT_PUBLIC_HARDWARE_BRIDGE_URL=http://localhost:5055
```

Restart `npm run dev`. This flag is off by default — with it unset the
console behaves exactly as before, no network calls to the bridge are made.

## 4. Trigger a real alert

With the dev server, the bridge, and the Arduino all running: open the
console's dashboard, go to the Simulation control panel and click
**Inject Fault** (or wait for a threshold breach, or hit **Emergency Stop**).
The board should react within ~1 second:

- `warning` alert → LED blinks slowly x3
- `critical` alert → LED blinks fast + buzzer beeps x3

## Notes

- The hook lives in `frontend/lib/simulation/store.ts`'s `pushAlert()` —
  every code path that raises an alert (start/stop, fault injection,
  threshold breaches, emergency stop) already funnels through it, so no
  other frontend code needed to change.
- This only wires the frontend's local simulation. If you run the
  `backend/` FastAPI service too, its `/api/alerts` is currently a static
  mock and isn't wired to this — ask if you want that connected as well.

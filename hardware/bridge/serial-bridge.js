// TwinForge hardware bridge.
//
// Small local HTTP server that forwards alert events from the TwinForge
// console (browser) to the Grove Beginner Kit over USB serial.
//
//   frontend (store.ts) --fetch--> this server --serial--> Arduino
//
// Usage:
//   npm install
//   npm run list-ports        # find your board's COM port
//   ARDUINO_PORT=COM5 npm start
//
import http from "node:http";
import { SerialPort } from "serialport";

const PORT = process.env.BRIDGE_PORT ?? 5055;
const ARDUINO_PORT = process.env.ARDUINO_PORT;
const BAUD_RATE = Number(process.env.ARDUINO_BAUD ?? 9600);

if (!ARDUINO_PORT) {
  console.error("Set ARDUINO_PORT to your board's serial port, e.g.:");
  console.error("  Windows:      ARDUINO_PORT=COM5 npm start");
  console.error("Run `npm run list-ports` to see available ports.");
  process.exit(1);
}

const serial = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE }, (err) => {
  if (err) {
    console.error(`Failed to open ${ARDUINO_PORT}: ${err.message}`);
    process.exit(1);
  }
});

serial.on("data", (data) => {
  process.stdout.write(`[arduino] ${data.toString().trim()}\n`);
});

const LEVEL_TO_COMMAND = { warning: "W", critical: "C", test: "T" };

function sendCommand(level) {
  const cmd = LEVEL_TO_COMMAND[level];
  if (!cmd) return false;
  serial.write(cmd);
  return true;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", port: ARDUINO_PORT }));
    return;
  }

  if (req.method === "POST" && req.url === "/alert") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { level } = JSON.parse(body || "{}");
        const sent = sendCommand(level);
        res.writeHead(sent ? 200 : 400, { "Content-Type": "application/json" });
        res.end(JSON.stringify(sent ? { ok: true, level } : { ok: false, error: "unknown level" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`TwinForge hardware bridge listening on http://localhost:${PORT}`);
  console.log(`Forwarding to ${ARDUINO_PORT} @ ${BAUD_RATE} baud`);
});

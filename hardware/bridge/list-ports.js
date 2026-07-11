// Helper: prints available serial ports so you can find the Arduino's COM port.
import { SerialPort } from "serialport";

const ports = await SerialPort.list();
if (ports.length === 0) {
  console.log("No serial ports found. Is the board plugged in?");
} else {
  for (const p of ports) {
    console.log(`${p.path}  ${p.manufacturer ?? ""}  ${p.vendorId ?? ""}:${p.productId ?? ""}`);
  }
}

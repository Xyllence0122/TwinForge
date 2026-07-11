/*
 * TwinForge hardware alert notifier — Seeed Grove Beginner Kit for Arduino.
 *
 * Listens on Serial (9600 baud) for single-character commands sent by the
 * PC-side bridge (hardware/bridge/serial-bridge.js) and drives the
 * kit's onboard LED + buzzer as a physical alarm indicator:
 *
 *   'W'  -> warning event  : LED blinks slowly x3, no buzzer
 *   'C'  -> critical event : LED blinks fast x6 + buzzer beeps x3
 *   'T'  -> self-test      : one short beep + one LED flash (wiring check)
 *
 * Pin mapping is the Grove Beginner Kit's fixed onboard wiring (Seeed
 * silkscreen / wiki). If your revision differs, check the printed board
 * poster and adjust LED_PIN / BUZZER_PIN below.
 */

const int LED_PIN = 4;
const int BUZZER_PIN = 5;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  noTone(BUZZER_PIN);
  Serial.begin(9600);
}

void blinkLed(int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(onMs);
    digitalWrite(LED_PIN, LOW);
    if (i < times - 1) delay(offMs);
  }
}

void warningPattern() {
  blinkLed(3, 300, 300);
}

void criticalPattern() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 2000, 150);
    delay(150);
    digitalWrite(LED_PIN, LOW);
    delay(120);
  }
  noTone(BUZZER_PIN);
}

void selfTest() {
  digitalWrite(LED_PIN, HIGH);
  tone(BUZZER_PIN, 1500, 200);
  delay(200);
  digitalWrite(LED_PIN, LOW);
  noTone(BUZZER_PIN);
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    switch (cmd) {
      case 'W':
        warningPattern();
        Serial.println("ok:warning");
        break;
      case 'C':
        criticalPattern();
        Serial.println("ok:critical");
        break;
      case 'T':
        selfTest();
        Serial.println("ok:test");
        break;
      default:
        // ignore newline / unknown bytes
        break;
    }
  }
}

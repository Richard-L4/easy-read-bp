export type Zone = "green" | "amber" | "red";

export interface Reading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: number;
}

export function getZone(systolic: number, diastolic: number): Zone {
  // Colors only change when readings EXCEED the previous thresholds.
  // Amber: sys > 136 or dia > 86  (i.e. ≥ 137 / ≥ 87)
  // Red:   sys > 150 or dia > 95  (i.e. ≥ 151 / ≥ 96)
  if (systolic > 150 || diastolic > 95) return "red";
  if (systolic > 136 || diastolic > 86) return "amber";
  return "green";
}

export function zoneLabel(z: Zone): string {
  return z === "green" ? "Normal" : z === "amber" ? "Stage 1" : "Stage 2";
}

const KEY = "bp-logbook-readings-v1";
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

export function loadReadings(): Reading[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: Reading[] = JSON.parse(raw);
    const cutoff = Date.now() - FOURTEEN_DAYS;
    return parsed
      .filter((r) => r.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function saveReadings(readings: Reading[]) {
  const cutoff = Date.now() - FOURTEEN_DAYS;
  const trimmed = readings.filter((r) => r.timestamp >= cutoff);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildShareText(readings: Reading[]): string {
  if (readings.length === 0) {
    return "Blood Pressure Log — no readings in the last 14 days.";
  }
  const lines = readings.map((r) => {
    const d = new Date(r.timestamp);
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const zone = getZone(r.systolic, r.diastolic).toUpperCase();
    return `${date} ${time}  ${r.systolic}/${r.diastolic}  Pulse ${r.pulse}  [${zone}]`;
  });
  return [
    "Blood Pressure Log — Last 14 Days",
    "".padEnd(34, "-"),
    ...lines,
    "".padEnd(34, "-"),
    "Zones use UK NICE home monitoring thresholds.",
  ].join("\n");
}

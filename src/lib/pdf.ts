import { jsPDF } from "jspdf";
import { type Reading, getZone, zoneLabel } from "./bp";

export function buildPdf(readings: Reading[]): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Blood Pressure Log", marginX, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text("Last 14 days — UK NICE home monitoring zones", marginX, y);
  y += 24;

  // Header row
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const cols = [
    { label: "Date", x: marginX },
    { label: "Time", x: marginX + 110 },
    { label: "BP (Sys/Dia)", x: marginX + 170 },
    { label: "Pulse", x: marginX + 290 },
    { label: "Zone", x: marginX + 350 },
  ];
  cols.forEach((c) => doc.text(c.label, c.x, y));
  y += 6;
  doc.setDrawColor(200);
  doc.line(marginX, y, pageW - marginX, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (readings.length === 0) {
    doc.setTextColor(120);
    doc.text("No readings recorded in the last 14 days.", marginX, y);
  } else {
    for (const r of readings) {
      if (y > 780) {
        doc.addPage();
        y = 56;
      }
      const d = new Date(r.timestamp);
      const date = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const z = getZone(r.systolic, r.diastolic);
      doc.setTextColor(20);
      doc.text(date, cols[0].x, y);
      doc.text(time, cols[1].x, y);
      doc.text(`${r.systolic}/${r.diastolic}`, cols[2].x, y);
      doc.text(String(r.pulse), cols[3].x, y);
      const zoneColor: [number, number, number] =
        z === "green" ? [30, 130, 70] : z === "amber" ? [190, 120, 20] : [190, 40, 40];
      doc.setTextColor(...zoneColor);
      doc.text(zoneLabel(z), cols[4].x, y);
      y += 18;
    }
  }

  y = Math.max(y, 760);
  doc.setTextColor(130);
  doc.setFontSize(9);
  doc.text(
    "Zones: Green <135/85 · Amber 135–149/85–94 · Red 150+/95+. Home monitoring thresholds (UK NICE).",
    marginX,
    810,
  );

  return doc.output("blob");
}

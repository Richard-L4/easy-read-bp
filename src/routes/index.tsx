import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  type Reading,
  type Zone,
  buildShareText,
  formatDateTime,
  getZone,
  loadReadings,
  saveReadings,
  zoneLabel,
} from "@/lib/bp";
import { buildPdf } from "@/lib/pdf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blood Pressure Logbook — Simple Home BP Tracker" },
      {
        name: "description",
        content:
          "A clean, large-text blood pressure logbook. Log systolic, diastolic and pulse readings with UK NICE traffic-light zones and share your 14-day history.",
      },
      { property: "og:title", content: "Blood Pressure Logbook" },
      {
        property: "og:description",
        content: "Simple 14-day home BP tracker with UK traffic-light zones.",
      },
    ],
  }),
  component: Index,
});

type ExportMode = null | "menu" | "sms" | "email" | "confirm";

function Index() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [open, setOpen] = useState(false);
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pul, setPul] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [exportMode, setExportMode] = useState<ExportMode>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("Sent successfully");

  useEffect(() => {
    setReadings(loadReadings());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const scheduleUndoClear = (id: string) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoId(id);
    undoTimer.current = setTimeout(() => setUndoId((cur) => (cur === id ? null : cur)), 8000);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(sys, 10);
    const d = parseInt(dia, 10);
    const p = parseInt(pul, 10);
    if (!s || !d || !p || s < 50 || s > 260 || d < 30 || d > 200 || p < 20 || p > 240) {
      showToast("Please enter valid numbers");
      return;
    }
    const id = crypto.randomUUID();
    const next: Reading[] = [
      { id, systolic: s, diastolic: d, pulse: p, timestamp: Date.now() },
      ...readings,
    ];
    saveReadings(next);
    setReadings(loadReadings());
    setSys("");
    setDia("");
    setPul("");
    setOpen(false);
    scheduleUndoClear(id);
  };

  const remove = (id: string) => {
    const next = readings.filter((r) => r.id !== id);
    saveReadings(next);
    setReadings(next);
    if (undoId === id) setUndoId(null);
  };

  const undoLast = () => {
    const target = readings[0];
    if (!target) return;
    const next = readings.slice(1);
    saveReadings(next);
    setReadings(next);
    setUndoId(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setSys(String(target.systolic));
    setDia(String(target.diastolic));
    setPul(String(target.pulse));
    setOpen(true);
  };

  const finishWithConfirm = (msg = "Sent successfully") => {
    setConfirmMsg(msg);
    setExportMode("confirm");
    setTimeout(() => setExportMode(null), 1600);
  };

  const doPdf = async () => {
    try {
      const blob = buildPdf(readings);
      const fileName = `bp-log-${new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      const nav = navigator as Navigator & {
        share?: (data: { title?: string; text?: string; files?: File[] }) => Promise<void>;
        canShare?: (data: { files?: File[] }) => boolean;
      };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ title: "Blood Pressure Log", files: [file] });
        finishWithConfirm("Shared successfully");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      finishWithConfirm("PDF downloaded");
    } catch {
      showToast("Unable to export PDF");
    }
  };

  const doSms = () => {
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (!cleaned) {
      showToast("Enter a phone number");
      return;
    }
    const body = encodeURIComponent(buildShareText(readings));
    const ua = navigator.userAgent || "";
    const sep = /iPhone|iPad|iPod|Macintosh/.test(ua) ? "&" : "?";
    window.location.href = `sms:${cleaned}${sep}body=${body}`;
    setPhone("");
    finishWithConfirm("Opening messages…");
  };

  const doEmail = () => {
    const trimmed = email.trim();
    if (!trimmed || !/.+@.+\..+/.test(trimmed)) {
      showToast("Enter a valid email");
      return;
    }
    const subject = encodeURIComponent("Blood Pressure Log — Last 14 Days");
    const body = encodeURIComponent(buildShareText(readings));
    window.location.href = `mailto:${trimmed}?subject=${subject}&body=${body}`;
    setEmail("");
    finishWithConfirm("Opening email…");
  };

  const latest = readings[0];
  const latestZone: Zone | null = latest ? getZone(latest.systolic, latest.diastolic) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-md px-5 pt-8 pb-40">
        <header className="mb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Blood Pressure
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Logbook</h1>
        </header>

        {latest && latestZone ? (
          <section
            className="mb-4 rounded-2xl border p-6"
            style={{
              backgroundColor: `var(--zone-${latestZone}-bg)`,
              borderColor: `var(--zone-${latestZone})`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground/70">Latest reading</p>
              <ZonePill zone={latestZone} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-7xl font-bold leading-none tabular-nums">
                {latest.systolic}
              </span>
              <span className="text-4xl font-light text-foreground/50">/</span>
              <span className="text-5xl font-semibold leading-none tabular-nums text-foreground/80">
                {latest.diastolic}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base">
              <span className="text-foreground/70">
                Pulse <span className="font-semibold text-foreground">{latest.pulse}</span> bpm
              </span>
              <span className="text-foreground/60">{formatDateTime(latest.timestamp)}</span>
            </div>
          </section>
        ) : (
          <section className="mb-6 rounded-2xl border border-dashed p-8 text-center">
            <p className="text-lg font-medium text-foreground/80">No readings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the button below to add your first reading.
            </p>
          </section>
        )}

        {latest && (
          <div className="mb-6 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <div className="text-sm">
              <p className="font-semibold text-foreground">Made a mistake?</p>
              <p className="text-muted-foreground">Reset the latest reading and re-enter it.</p>
            </div>
            <button
              onClick={undoLast}
              className="rounded-lg border-2 border-primary/30 px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Reset
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <span className="text-sm text-muted-foreground">
            Last 14 days · {readings.length}
          </span>
        </div>

        <ul className="space-y-3">
          {readings.slice(1).map((r) => {
            const z = getZone(r.systolic, r.diastolic);
            return (
              <li
                key={r.id}
                className="flex items-center gap-4 rounded-xl border bg-card p-4"
              >
                <span
                  className="h-12 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--zone-${z})` }}
                  aria-label={zoneLabel(z)}
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tabular-nums">{r.systolic}</span>
                    <span className="text-xl text-foreground/40">/</span>
                    <span className="text-2xl font-semibold tabular-nums text-foreground/80">
                      {r.diastolic}
                    </span>
                    <span className="ml-2 text-base text-foreground/60">
                      · {r.pulse} bpm
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDateTime(r.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                  aria-label="Delete reading"
                >
                  Delete
                </button>
              </li>
            );
          })}
          {readings.length <= 1 && latest && (
            <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Older readings will appear here.
            </li>
          )}
        </ul>

        <section className="mt-8 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">UK NICE Zones</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <Dot zone="green" /> Normal — up to 136/86
            </li>
            <li className="flex items-center gap-2">
              <Dot zone="amber" /> Stage 1 — 137–150 or 87–95
            </li>
            <li className="flex items-center gap-2">
              <Dot zone="red" /> Stage 2 — above 150 or 95
            </li>
          </ul>
        </section>
      </main>

      {/* Fixed bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3 px-5 py-4">
          <button
            onClick={() => setExportMode("menu")}
            className="flex-1 rounded-xl border-2 border-primary/20 bg-card px-4 py-4 text-base font-semibold text-foreground hover:bg-accent"
          >
            Export
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground hover:opacity-90"
          >
            + Add Reading
          </button>
        </div>
      </div>

      {/* Add reading modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-background p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
            <h2 className="text-2xl font-bold">New Reading</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your latest measurement.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <NumField label="Systolic" sublabel="Top number" value={sys} onChange={setSys} autoFocus />
              <NumField label="Diastolic" sublabel="Bottom number" value={dia} onChange={setDia} />
              <NumField label="Pulse" sublabel="Heart rate (bpm)" value={pul} onChange={setPul} />

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border-2 px-4 py-4 text-base font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export sheet */}
      {exportMode && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => exportMode !== "confirm" && setExportMode(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-background p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

            {exportMode === "menu" && (
              <>
                <h2 className="text-2xl font-bold">Export 14-Day History</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose how you'd like to share your readings.
                </p>
                <div className="mt-6 space-y-3">
                  <ExportOption
                    title="Export as PDF"
                    subtitle="Save or share via the device share sheet"
                    onClick={doPdf}
                  />
                  <ExportOption
                    title="Send via SMS"
                    subtitle="Open Messages with a text summary"
                    onClick={() => setExportMode("sms")}
                  />
                  <ExportOption
                    title="Send via Email"
                    subtitle="Open your email app with a text summary"
                    onClick={() => setExportMode("email")}
                  />
                </div>
                <button
                  onClick={() => setExportMode(null)}
                  className="mt-6 w-full rounded-xl border-2 px-4 py-4 text-base font-semibold hover:bg-accent"
                >
                  Cancel
                </button>
              </>
            )}

            {exportMode === "sms" && (
              <>
                <h2 className="text-2xl font-bold">Send via SMS</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the phone number to text your 14-day summary to.
                </p>
                <label className="mt-6 block">
                  <span className="mb-1.5 block text-base font-semibold">Phone number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 07123 456789"
                    autoFocus
                    className="w-full rounded-xl border-2 border-input bg-card px-4 py-4 text-2xl font-semibold tabular-nums outline-none focus:border-primary"
                  />
                </label>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExportMode("menu")}
                    className="flex-1 rounded-xl border-2 px-4 py-4 text-base font-semibold hover:bg-accent"
                  >
                    Back
                  </button>
                  <button
                    onClick={doSms}
                    className="flex-1 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {exportMode === "email" && (
              <>
                <h2 className="text-2xl font-bold">Send via Email</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the email address to send your 14-day summary to.
                </p>
                <label className="mt-6 block">
                  <span className="mb-1.5 block text-base font-semibold">Email address</span>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoFocus
                    className="w-full rounded-xl border-2 border-input bg-card px-4 py-4 text-xl font-semibold outline-none focus:border-primary"
                  />
                </label>
                <p className="mt-3 text-xs text-muted-foreground">
                  Want the PDF attached? Use “Export as PDF” and pick email from the share sheet.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setExportMode("menu")}
                    className="flex-1 rounded-xl border-2 px-4 py-4 text-base font-semibold hover:bg-accent"
                  >
                    Back
                  </button>
                  <button
                    onClick={doEmail}
                    className="flex-1 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {exportMode === "confirm" && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: `var(--zone-green-bg)` }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--zone-green)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="mt-4 text-xl font-bold">{confirmMsg}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function NumField({
  label,
  sublabel,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  sublabel: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-base font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      </div>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        autoFocus={autoFocus}
        className="w-full rounded-xl border-2 border-input bg-card px-4 py-4 text-center text-4xl font-bold tabular-nums outline-none focus:border-primary"
        placeholder="—"
      />
    </label>
  );
}

function ExportOption({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border-2 border-input bg-card px-4 py-4 text-left hover:border-primary hover:bg-accent"
    >
      <span>
        <span className="block text-base font-bold text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <span className="text-2xl text-foreground/40">›</span>
    </button>
  );
}

function ZonePill({ zone }: { zone: Zone }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
      style={{ backgroundColor: `var(--zone-${zone})` }}
    >
      {zoneLabel(zone)}
    </span>
  );
}

function Dot({ zone }: { zone: Zone }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{ backgroundColor: `var(--zone-${zone})` }}
    />
  );
}

import { useEffect, useState } from "react";
import {
  getDeviceKind,
  hasSeenHomeScreenPrompt,
  markHomeScreenPromptSeen,
  type DeviceKind,
} from "@/lib/homeScreenPrompt";

function Instructions({ kind }: { kind: DeviceKind }) {
  if (kind === "ios") {
    return (
      <div className="mt-5 rounded-xl border bg-card p-4">
        <p className="font-semibold text-foreground">On iPhone or iPad</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-foreground/80">
          <li>Open Easy Read BP in Safari</li>
          <li>
            Tap the <span aria-hidden="true">⎋</span> Share button
          </li>
          <li>Tap Add to Home Screen</li>
          <li>Tap Add</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Where supported, it will open as a web app.
        </p>
      </div>
    );
  }
  if (kind === "android") {
    return (
      <div className="mt-5 rounded-xl border bg-card p-4">
        <p className="font-semibold text-foreground">On Android</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-foreground/80">
          <li>Open Easy Read BP in Chrome</li>
          <li>Tap the ⋮ menu</li>
          <li>Tap Install app or Add to Home Screen</li>
          <li>Follow the instructions to add it to your Home Screen</li>
        </ol>
      </div>
    );
  }
  return (
    <div className="mt-5 rounded-xl border bg-card p-4 text-foreground/80">
      <p className="font-semibold text-foreground">Use Easy Read BP on your phone?</p>
      <p className="mt-2">
        You can add it to your phone's Home Screen for quick access.
      </p>
    </div>
  );
}

export function HomeScreenPrompt() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DeviceKind>("other");

  useEffect(() => {
    setKind(getDeviceKind());
    if (!hasSeenHomeScreenPrompt()) setOpen(true);
  }, []);

  const close = () => {
    markHomeScreenPromptSeen();
    setOpen(false);
  };

  return (
    <>
      {/* Discreet permanent reminder */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          📱 Add to Home Screen
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-background p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add Easy Read BP to your Home Screen"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
            <h2 className="text-2xl font-bold">Keep Easy Read BP handy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add it to your Home Screen for quick access whenever you want to record or check
              your readings.
            </p>

            <Instructions kind={kind} />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-xl border-2 px-4 py-4 text-base font-semibold hover:bg-accent"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

## Features to add

### 1. Undo last reading
- After saving a new reading, show an inline "Undo last reading" banner directly under the "Latest reading" card for ~8 seconds (dismissable).
- Tapping Undo removes that reading from storage and reopens the Add Reading modal pre-filled with its systolic/diastolic/pulse so the user can correct and re-save.
- Implementation: track `lastAddedId` + a timeout in `Index`. Banner styled to match existing rounded-2xl card language, using muted background with a primary-colored "Undo" action.

### 2. Export flow (PDF / SMS / Email)
Replace the current "Share 14-Day History" bottom button with an "Export" button that opens an export sheet (bottom modal, same visual style as the Add Reading modal) with three large options:

**a. Export as PDF**
- Generate a client-side PDF of the last 14 days using `jspdf` (small, works in browser, no native deps).
- Columns: Date, Time, Systolic/Diastolic, Pulse, Zone. Title header + NICE thresholds footnote.
- Convert to a `File` and call `navigator.share({ files: [pdf] })` when supported; otherwise trigger a download as fallback.
- On success (share resolves or download starts) show the green-check "Sent successfully" confirmation state, then return to main screen.

**b. Send via SMS**
- Opens an in-app screen (modal view) with a phone number input + Continue button.
- Continue builds `sms:<number>?body=<encoded plain-text 14-day summary>` (using `&body=` on Android UA, `?&body=` fallback per iOS quirk) and navigates via `window.location.href`.
- On return (visibilitychange back to visible after nav), show the green-check confirmation, then close.

**c. Send via Email**
- Opens an in-app screen with an email input + Continue button.
- Continue builds `mailto:<email>?subject=Blood%20Pressure%20Log%20—%20Last%2014%20Days&body=<encoded summary>` and navigates.
- Includes a small note: "For a PDF attachment, use Export as PDF and pick email from the share sheet."
- Same green-check confirmation on return.

### 3. Confirmation state
- Shared `<SentConfirmation />` component: centered green check icon (using `--zone-green`), "Sent successfully" text, auto-dismisses after 1.6s and returns to the main screen.

## Technical details

- **New dep:** `jspdf` (added via `bun add jspdf`).
- **New file:** `src/lib/pdf.ts` — `buildPdf(readings: Reading[]): Blob` using jspdf + `autoTable`-free manual layout (keep deps minimal, just `jspdf`).
- **Edit:** `src/routes/index.tsx`
  - Add state: `undoInfo`, `exportSheetOpen`, `exportMode` (`null | "menu" | "sms" | "email" | "confirm"`), `phone`, `email`.
  - Replace bottom "Share 14-Day History" button with "Export".
  - Add undo banner rendering under latest card.
  - Add ExportSheet modal (mirrors Add Reading modal styling) with three-step flow: menu → sms/email input → confirm.
  - Keep existing `buildShareText` for SMS/email bodies.
- **No changes** to `bp.ts` traffic-light logic, storage rules, or `__root.tsx`.

## Files touched
- `package.json` (add jspdf)
- `src/lib/pdf.ts` (new)
- `src/routes/index.tsx` (undo banner + export sheet + confirmation state)

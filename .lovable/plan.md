# Add WhatsApp as an Export/Share Option

## Goal
Add a WhatsApp export option to the existing Export Data sheet in Easy Read BP, without changing any current export behaviour, data, storage, zones, styling, or other functionality.

## Current state
- Export is handled entirely in `src/routes/index.tsx`.
- Existing options (lines 420–449):
  1. **Export as PDF** — generates a PDF blob via `src/lib/pdf.ts`; uses the Web Share API with a file if supported, otherwise downloads the PDF.
  2. **Send via SMS** — opens an SMS sub-sheet, then launches `sms:<number>?body=` (iOS uses `&`) with `buildShareText(readings)`.
  3. **Send via Email** — opens an email sub-sheet, then launches `mailto:` with subject and `buildShareText(readings)` body.
- All text exports reuse `buildShareText(readings)` from `src/lib/bp.ts`, so formatting is preserved and centralised.

## Proposed change
1. Add a new `doWhatsApp()` helper in `src/routes/index.tsx` next to the other export handlers.
2. In the Export menu (`exportMode === "menu"`), add a fourth `<ExportOption>`:
   - Title: "Send via WhatsApp"
   - Subtitle: "Share your summary through WhatsApp or your device's share sheet"
3. `doWhatsApp()` behaviour:
   - Build the same `buildShareText(readings)` string used by SMS and email.
   - First, try the native Web Share API (`navigator.share({ text })`) so mobile users can pick WhatsApp from the system share sheet when available.
   - If Web Share is unavailable or fails, fall back to `https://api.whatsapp.com/send?text=<encoded>` so WhatsApp opens directly on devices that support it.
   - Use `finishWithConfirm()` with an appropriate message, matching the existing confirmation pattern.
   - Catch errors with `showToast("Unable to open WhatsApp")`.

## What will not change
- PDF, SMS, and Email options remain exactly as they are.
- No changes to `src/lib/bp.ts`, `src/lib/pdf.ts`, readings/history, storage, zone calculations, colours, typography, layout, navigation, About, footer, Buy Me a Coffee, PWA/service worker, or Home Screen prompt.

## Verification
- Open the Export sheet and confirm four options appear: PDF, SMS, Email, WhatsApp.
- Confirm PDF/SMS/Email still work as before.
- Confirm WhatsApp option triggers either the native share sheet or the WhatsApp web/app fallback.
- Confirm exported text formatting is unchanged.
- Test on mobile and desktop viewport sizes.

## Cost / credit check
- Current workspace balance: 34.60 credits.
- This is a very small, isolated UI/logic addition (one function + one button), so the build cost should be minimal and well under one credit.
- After the change, the remaining balance will still be at least 26 credits.

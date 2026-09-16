# Home Screen install prompt for Easy Read BP

Add a one-time, friendly "Add to Home Screen" modal plus a discreet permanent reminder. No changes to readings, zones, storage, export, About, or the Buy Me a Coffee link.

## What users will see

### First visit (per browser/device)
A small, clean modal (not full-screen) matching the app's existing design:

- Title: "Keep Easy Read BP handy"
- Body: "Add it to your Home Screen for quick access whenever you want to record or check your readings."
- Device-specific instructions:
  - iPhone/iPad: open in Safari → Share button → Add to Home Screen → Add (with a note about opening as a web app where supported)
  - Android: open in Chrome → ⋮ menu → "Install app" / "Add to Home Screen" (wording accommodates Chrome variations)
  - Desktop/unidentified: "Use Easy Read BP on your phone? You can add it to your phone's Home Screen for quick access." (no mobile-specific steps)
- Buttons: "Got it" (primary) and "Maybe later" (secondary) — both close the modal and record that it was seen.

### After dismissal
A small, subtle "📱 Add to Home Screen" reminder placed near the footer/support area. Tapping it reopens the same instructions modal. It never pops up on its own again.

## Behaviour rules

- Shown once per browser/device via localStorage key `easy-read-bp-home-screen-prompt-v1`; set on either button so the large modal never reappears.
- Simple device detection from the user agent (iOS / Android / other) — no libraries, no fingerprinting.
- No install forcing, no notification permission, no analytics, no personal data — privacy model unchanged.

## Technical details

- `src/lib/homeScreenPrompt.ts` (new): localStorage seen/dismiss helpers and `getDeviceKind()` user-agent check.
- `src/components/HomeScreenPrompt.tsx` (new): the modal (device-aware steps) + the small reminder link.
- `src/routes/index.tsx`: render the reminder near the footer and mount the modal; modal auto-opens only on first visit.
- Reuse existing modal styling patterns already in index.tsx; no new dependencies.
- Verified: no existing install-prompt code in the app (only a text mention in About), so nothing to reuse.
- Test at mobile and desktop viewport sizes; confirm the modal appears once, dismissal persists across reload, and the reminder reopens instructions.

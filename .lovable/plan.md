# Home Screen install prompt for Easy Read BP

Add a one-time, friendly "Add to Home Screen" modal plus a discreet permanent reminder. No changes to readings, zones, history, storage, export, About, footer layout, Buy Me a Coffee, colours, typography, or service worker.

## What users will see

### First visit (per browser/device)
A small, clean modal (not full-screen) matching the app's existing design:

- Title: "Keep Easy Read BP handy"
- Body: "Add it to your Home Screen for quick access whenever you want to record or check your readings."
- Device-specific instructions:
  - iPhone/iPad: open in Safari → Share button → Add to Home Screen → Add, plus note "Where supported, it will open as a web app."
  - Android: open in Chrome → ⋮ menu → "Install app" or "Add to Home Screen" (both terms, as Chrome wording varies)
  - Desktop/unidentified: "Use Easy Read BP on your phone? You can add it to your phone's Home Screen for quick access." — no mobile-specific steps
- Buttons: "Got it" (primary) and "Maybe later" (secondary) — both close the modal and record it as seen.

### After dismissal
A small, subtle "📱 Add to Home Screen" reminder added alongside the existing footer/support content (no footer redesign). Tapping it reopens the same instructions modal. It stays permanently and never auto-pops up again.

## Behaviour rules

- localStorage key `easy-read-bp-home-screen-prompt-v1`: if absent on load, auto-open the modal; set it on either button so it never auto-opens again.
- Device detection via simple user-agent check (`ios` / `android` / `other`) — no libraries, no fingerprinting, user agent never stored or sent anywhere.
- No install forcing, no native-prompt interception, no notification permission, no analytics, no cookies, no personal data — privacy model unchanged.

## Technical details

- `src/lib/homeScreenPrompt.ts` (new): storage key, has-seen/mark-seen helpers, `getDeviceKind()`.
- `src/components/HomeScreenPrompt.tsx` (new): self-contained modal (device-aware steps, Got it / Maybe later) + small reminder link, reusing existing modal styling and design tokens.
- `src/routes/index.tsx`: mount the component; modal auto-opens only when the key is unset; reminder rendered near the existing footer/support area. No other restructuring.
- No new dependencies. Verified: no existing install-prompt code to reuse (only a text mention in About).
- Test: iPhone and Android viewports show correct instructions; desktop shows generic text; both buttons close the modal; dismissal persists across reload; reminder reopens instructions; regression check on readings, zones, history, export, About, footer, Buy Me a Coffee.

export const HOME_SCREEN_PROMPT_KEY = "easy-read-bp-home-screen-prompt-v1";

export type DeviceKind = "ios" | "android" | "other";

export function hasSeenHomeScreenPrompt(): boolean {
  try {
    return window.localStorage.getItem(HOME_SCREEN_PROMPT_KEY) !== null;
  } catch {
    return true;
  }
}

export function markHomeScreenPromptSeen(): void {
  try {
    window.localStorage.setItem(HOME_SCREEN_PROMPT_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — prompt simply won't persist dismissal */
  }
}

export function getDeviceKind(): DeviceKind {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  // iPadOS 13+ reports as Macintosh but has touch
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

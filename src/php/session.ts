import { generateUUID } from "./helpers";

export function getOrCreateSessionId(): string {
  const storedSessionId = window.sessionStorage.getItem("log_session_id");

  if (storedSessionId) {
    return storedSessionId;
  }

  const newSessionId = generateUUID();
  window.sessionStorage.setItem("log_session_id", newSessionId);
  return newSessionId;
}

export function clearSessionId(): void {
  window.sessionStorage.removeItem("log_session_id");
}

export function generateFingerprint(): string {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // platform: navigator.platform, // Deprecated, do not use
    hardwareConcurrency: (navigator as any).hardwareConcurrency || "unknown",
    deviceMemory: (navigator as any).deviceMemory || "unknown",
  };

  function hashObject(obj: Record<string, any>): string {
    const str = Object.entries(obj)
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    let hash = 0,
      i,
      chr;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    // Convert hash to base36 and pad
    return Math.abs(hash).toString(36).padStart(10, "0").slice(0, 32);
  }

  return hashObject(fingerprint);
}

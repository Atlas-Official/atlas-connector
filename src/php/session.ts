export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}

export function getOrCreateSessionId(): string {
  const storedSessionId = window.sessionStorage.getItem("log_session_id");

  if (storedSessionId) {
    return storedSessionId;
  }

  const newSessionId = generateSessionId();
  window.sessionStorage.setItem("log_session_id", newSessionId);
  return newSessionId;
}

export function clearSessionId(): void {
  window.sessionStorage.removeItem("log_session_id");
}

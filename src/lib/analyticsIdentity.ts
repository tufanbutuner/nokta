const ANON_ID_KEY = "sheesha_anon_id";
const SESSION_ID_KEY = "sheesha_session_id";
const SESSION_STARTED_AT_KEY = "sheesha_session_started_at";

function createId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${id}`;
}

export function getAnonymousUserId(): string {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const id = createId("anon");
    localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return createId("anon");
  }
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = createId("session");
    sessionStorage.setItem(SESSION_ID_KEY, id);
    sessionStorage.setItem(SESSION_STARTED_AT_KEY, new Date().toISOString());
    return id;
  } catch {
    return createId("session");
  }
}

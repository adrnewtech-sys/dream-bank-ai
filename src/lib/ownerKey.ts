const OWNER_KEY_STORAGE = 'dreambank-ai-owner-key';

export function getOwnerKey(): string {
  const existing = window.localStorage.getItem(OWNER_KEY_STORAGE);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(OWNER_KEY_STORAGE, created);
  return created;
}

const mem: Record<string, unknown> = {};

function lsGet(k: string): string | null {
  try { return typeof window !== "undefined" ? localStorage.getItem(k) : null; }
  catch { return null; }
}
function lsSet(k: string, v: string): void {
  try { if (typeof window !== "undefined") localStorage.setItem(k, v); }
  catch { /* quota exceeded */ }
}
function lsDel(k: string): void {
  try { if (typeof window !== "undefined") localStorage.removeItem(k); }
  catch { /* ignore */ }
}

export const store = {
  async get<T>(k: string): Promise<T | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await (window as any).storage?.get(k);
      if (r) return JSON.parse(r.value) as T;
    } catch { /* Capacitor not available */ }
    const raw = lsGet(k) ?? (mem[k] !== undefined ? JSON.stringify(mem[k]) : null);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(k: string, v: unknown): Promise<void> {
    const serialized = JSON.stringify(v);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).storage?.set(k, serialized);
    } catch { /* Capacitor not available */ }
    lsSet(k, serialized);
    mem[k] = v;
  },
  async del(k: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).storage?.delete(k);
    } catch { /* Capacitor not available */ }
    lsDel(k);
    delete mem[k];
  },
};

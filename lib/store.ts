const mem: Record<string, unknown> = {};

export const store = {
  async get<T>(k: string): Promise<T | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await (window as any).storage?.get(k);
      return r ? (JSON.parse(r.value) as T) : null;
    } catch {
      return (mem[k] as T) ?? null;
    }
  },
  async set(k: string, v: unknown): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).storage?.set(k, JSON.stringify(v));
    } catch {
      mem[k] = v;
    }
  },
  async del(k: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).storage?.delete(k);
    } catch {
      delete mem[k];
    }
  },
};

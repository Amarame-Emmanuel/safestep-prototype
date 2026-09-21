export class Memory {
  static save(key: string, value: unknown): void {
    try {
      localStorage.setItem(`safestep_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('[Memory] Failed to save:', key, e);
    }
  }

  static load<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(`safestep_${key}`);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch (e) {
      console.error('[Memory] Failed to load:', key, e);
      return defaultValue;
    }
  }

  static clear(key: string): void {
    localStorage.removeItem(`safestep_${key}`);
  }
}

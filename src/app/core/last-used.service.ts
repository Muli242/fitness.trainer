import { Injectable, signal } from '@angular/core';

export interface LastUsed { kind: 'training' | 'workout'; id: string; }
const KEY = 'ft_last';

/** Merkt sich, was zuletzt gestartet wurde (für das Dashboard) */
@Injectable({ providedIn: 'root' })
export class LastUsedService {
  readonly last = signal<LastUsed | null>(this.read());
  set(kind: LastUsed['kind'], id: string) {
    const v = { kind, id }; this.last.set(v);
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignorieren */ }
  }
  private read(): LastUsed | null {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (v?.kind === 'plan') v.kind = 'workout';   // alter Wert
      return v && (v.kind === 'training' || v.kind === 'workout') && typeof v.id === 'string' ? v : null;
    } catch { return null; }
  }
}

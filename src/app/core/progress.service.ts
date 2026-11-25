import { Injectable, signal } from '@angular/core';

const KEY = 'ft_progress';
const today = () => new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, lokale Zeit
interface Entry { date: string; done: number[]; }

/** Erledigt-Markierungen je Training (Positionen der Pläne); gelten nur für den heutigen Tag */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private store = signal<Record<string, Entry>>(this.read());
  done(trainingId: string): number[] { const e = this.store()[trainingId]; return e && e.date === today() ? e.done : []; }
  mark(trainingId: string, index: number) {
    const cur = this.done(trainingId);
    if (!cur.includes(index)) this.save({ ...this.store(), [trainingId]: { date: today(), done: [...cur, index] } });
  }
  reset(trainingId: string) { const rest = { ...this.store() }; delete rest[trainingId]; this.save(rest); }
  private save(s: Record<string, Entry>) { this.store.set(s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignorieren */ } }
  private read(): Record<string, Entry> { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { return {}; } }
}

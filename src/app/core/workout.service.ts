import { Injectable, signal } from '@angular/core';
import { WorkoutEntry, WorkoutItem, Workout, clampRounds } from './models';
import { ImportResult } from './file-io';

const KEY = 'ft_workouts';
const LEGACY_KEY = 'ft_plans';   // bis zur Umbenennung Trainingsplan → Workout; bleibt als Sicherung erhalten
@Injectable({ providedIn: 'root' })
export class WorkoutService {
  readonly workouts = signal<Workout[]>(this.read());
  private read(): Workout[] { try { return JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY) ?? '[]'); } catch { return []; } }
  private persist(list: Workout[]) { this.workouts.set(list); localStorage.setItem(KEY, JSON.stringify(list)); }
  get(id: string) { return this.workouts().find(p => p.id === id); }
  save(p: Workout) {
    const list = this.workouts();
    this.persist(list.some(x => x.id === p.id) ? list.map(x => x.id === p.id ? p : x) : [...list, p]);
  }
  remove(id: string) { this.persist(this.workouts().filter(p => p.id !== id)); }
  newId() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }

  exportData() { return { app: 'fitness-trainer', version: 1, workouts: this.workouts() }; }
  /** Importiert Workouts; gleiche id = bestehendes Workout wird überschrieben */
  importData(raw: any): ImportResult {
    const list = Array.isArray(raw) ? raw : (raw?.workouts ?? raw?.plans);   // plans = alte Exportdateien
    if (!Array.isArray(list)) throw new Error('Keine Workouts in der Datei gefunden.');
    const res: ImportResult = { added: 0, updated: 0, skipped: 0 };
    let all = [...this.workouts()];
    for (const item of list) {
      const p = this.normalize(item);
      if (!p) { res.skipped++; continue; }
      if (all.some(x => x.id === p.id)) { all = all.map(x => x.id === p.id ? p : x); res.updated++; } else { all.push(p); res.added++; }
    }
    this.persist(all);
    return res;
  }
  private normalize(p: any): Workout | null {
    if (!p || typeof p.name !== 'string' || !p.name.trim() || !Array.isArray(p.items)) return null;
    const leaf = (i: any): WorkoutItem[] => {
      const d = Number(i?.durationSeconds);
      if (!isFinite(d) || d < 0) return [];
      if (i.pause === true) return [{ pause: true, durationSeconds: Math.round(d) }];
      return typeof i.exerciseId === 'string' ? [{ exerciseId: i.exerciseId, durationSeconds: Math.round(d) }] : [];
    };
    const items = p.items.flatMap((e: any): WorkoutEntry[] => {
      if (e && Array.isArray(e.items)) {
        const sub = e.items.flatMap(leaf);
        return sub.length ? [{ name: typeof e.name === 'string' ? e.name.trim().slice(0, 40) : '', rounds: clampRounds(e.rounds), items: sub }] : [];
      }
      return leaf(e);
    });
    if (!items.length) return null;
    return { id: typeof p.id === 'string' && p.id ? p.id : this.newId(), name: p.name.trim(),
      description: typeof p.description === 'string' ? p.description : '', items, rounds: clampRounds(p.rounds) };
  }
}

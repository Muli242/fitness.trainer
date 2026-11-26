import { Injectable, signal } from '@angular/core';
import { Training } from './models';
import { ImportResult } from './file-io';

const KEY = 'ft_trainings';
const IMG = /^data:image\/(jpeg|png|webp|gif);base64,/;

@Injectable({ providedIn: 'root' })
export class TrainingService {
  readonly trainings = signal<Training[]>(this.read());
  private read(): Training[] {
    try { return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as any[]).map(t => t.workoutIds ? t : { ...t, workoutIds: t.planIds ?? [] }); } catch { return []; }
  }
  /** false = Speicher voll (Bilder sind groß) */
  private persist(list: Training[]): boolean {
    try { localStorage.setItem(KEY, JSON.stringify(list)); this.trainings.set(list); return true; } catch { return false; }
  }
  get(id: string) { return this.trainings().find(t => t.id === id); }
  save(t: Training): boolean {
    const l = this.trainings();
    return this.persist(l.some(x => x.id === t.id) ? l.map(x => x.id === t.id ? t : x) : [...l, t]);
  }
  remove(id: string) { this.persist(this.trainings().filter(t => t.id !== id)); }
  newId() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }

  exportData() { return { app: 'fitness-trainer', version: 1, trainings: this.trainings() }; }
  importData(raw: any): ImportResult {
    const list = Array.isArray(raw) ? raw : raw?.trainings;
    if (!Array.isArray(list)) throw new Error('Keine Trainings in der Datei gefunden.');
    const res: ImportResult = { added: 0, updated: 0, skipped: 0 };
    let all = [...this.trainings()];
    for (const item of list) {
      const t = this.normalize(item);
      if (!t) { res.skipped++; continue; }
      if (all.some(x => x.id === t.id)) { all = all.map(x => x.id === t.id ? t : x); res.updated++; } else { all.push(t); res.added++; }
    }
    if (!this.persist(all)) throw new Error('Speicher voll – Import nicht möglich (zu viele oder zu große Bilder).');
    return res;
  }
  private normalize(t: any): Training | null {
    if (!t || typeof t.name !== 'string' || !t.name.trim() || !Array.isArray(t.workoutIds ?? t.planIds)) return null;   // planIds = alte Daten
    const workoutIds = (t.workoutIds ?? t.planIds).filter((x: unknown): x is string => typeof x === 'string');
    if (!workoutIds.length) return null;
    const image = typeof t.image === 'string' && IMG.test(t.image) && t.image.length < 2_000_000 ? t.image : undefined;
    return { id: typeof t.id === 'string' && t.id ? t.id : this.newId(), name: t.name.trim(),
      description: typeof t.description === 'string' ? t.description : '', workoutIds, ...(image ? { image } : {}), ...(t.showStartAll === true ? { showStartAll: true } : {}) };
  }
}

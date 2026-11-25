import { Injectable, signal } from '@angular/core';
import { PlanEntry, PlanItem, TrainingPlan, clampRounds } from './models';
import { ImportResult } from './file-io';

const KEY = 'ft_plans';
@Injectable({ providedIn: 'root' })
export class PlanService {
  readonly plans = signal<TrainingPlan[]>(this.read());
  private read(): TrainingPlan[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
  private persist(list: TrainingPlan[]) { this.plans.set(list); localStorage.setItem(KEY, JSON.stringify(list)); }
  get(id: string) { return this.plans().find(p => p.id === id); }
  save(p: TrainingPlan) {
    const list = this.plans();
    this.persist(list.some(x => x.id === p.id) ? list.map(x => x.id === p.id ? p : x) : [...list, p]);
  }
  remove(id: string) { this.persist(this.plans().filter(p => p.id !== id)); }
  newId() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }

  exportData() { return { app: 'fitness-trainer', version: 1, plans: this.plans() }; }
  /** Importiert Pläne; gleiche id = bestehender Plan wird überschrieben */
  importData(raw: any): ImportResult {
    const list = Array.isArray(raw) ? raw : raw?.plans;
    if (!Array.isArray(list)) throw new Error('Keine Trainingspläne in der Datei gefunden.');
    const res: ImportResult = { added: 0, updated: 0, skipped: 0 };
    let all = [...this.plans()];
    for (const item of list) {
      const p = this.normalize(item);
      if (!p) { res.skipped++; continue; }
      if (all.some(x => x.id === p.id)) { all = all.map(x => x.id === p.id ? p : x); res.updated++; } else { all.push(p); res.added++; }
    }
    this.persist(all);
    return res;
  }
  private normalize(p: any): TrainingPlan | null {
    if (!p || typeof p.name !== 'string' || !p.name.trim() || !Array.isArray(p.items)) return null;
    const leaf = (i: any): PlanItem[] => {
      const d = Number(i?.durationSeconds);
      if (!isFinite(d) || d < 0) return [];
      if (i.pause === true) return [{ pause: true, durationSeconds: Math.round(d) }];
      return typeof i.exerciseId === 'string' ? [{ exerciseId: i.exerciseId, durationSeconds: Math.round(d) }] : [];
    };
    const items = p.items.flatMap((e: any): PlanEntry[] => {
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

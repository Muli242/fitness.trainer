import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Exercise, isExerciseType } from './models';
import { ImportResult } from './file-io';

const KEY = 'ft_custom_exercises';
const DEFAULT_PAUSE: Exercise = { id: 'pause', name: 'Pause', type: 'Entspannung', alt: '', target: 'Erholung', purpose: 'Entspannung, Erholung',
  steps: ['Trinke einen Schluck Wasser.', 'Beruhige deinen Atem.'], durationSeconds: 30 };

const str = (v: unknown) => typeof v === 'string' ? v : '';
const pos = (v: unknown) => typeof v === 'number' && isFinite(v) && v > 0 ? Math.round(v) : undefined;

/** Prüft und bereinigt ein importiertes Übungsobjekt; null = ungültig */
function normalize(e: any): Exercise | null {
  if (!e || !str(e.id).trim() || !str(e.name).trim()) return null;
  return {
    id: e.id.trim(), name: e.name.trim(), alt: str(e.alt), target: str(e.target), purpose: str(e.purpose),
    steps: Array.isArray(e.steps) ? e.steps.filter((s: unknown) => typeof s === 'string') : [],
    ...(isExerciseType(e.type) && { type: e.type }),
    ...(str(e.note) && { note: e.note }), ...(str(e.safety) && { safety: e.safety }),
    ...(pos(e.durationSeconds) && { durationSeconds: pos(e.durationSeconds) }), ...(pos(e.reps) && { reps: pos(e.reps) }),
  };
}

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private http = inject(HttpClient);
  private base = signal<Exercise[]>([]);                 // assets/exercises.json
  private custom = signal<Exercise[]>(this.readCustom()); // importierte / eigene Übungen (localStorage)
  /** Basisliste, überlagert von importierten Übungen gleicher id */
  readonly exercises = computed(() => {
    const m = new Map(this.base().map(e => [e.id, e]));
    this.custom().forEach(e => m.set(e.id, e));
    return [...m.values()];
  });
  /** Pause als Exercise-ähnliches Objekt (assets/pause.json) */
  readonly pause = signal<Exercise>(DEFAULT_PAUSE);

  async load(): Promise<void> {
    try { this.base.set(await firstValueFrom(this.http.get<Exercise[]>('assets/exercises.json'))); }
    catch (e) { console.error('Übungen konnten nicht geladen werden', e); }
    try { this.pause.set(await firstValueFrom(this.http.get<Exercise>('assets/pause.json'))); }
    catch { /* Standardwerte bleiben */ }
  }
  byId(id: string) { return this.exercises().find(e => e.id === id); }
  search(q: string): Exercise[] {
    const s = q.trim().toLowerCase();
    if (!s) return this.exercises();
    return this.exercises().filter(e => [e.name, e.type ?? '', e.alt, e.target, e.purpose, ...e.steps].join(' ').toLowerCase().includes(s));
  }

  /** Übung stammt aus den mitgelieferten Daten (assets/exercises.json) */
  inBase(id: string) { return this.base().some(e => e.id === id); }
  /** Übung wurde in der App angelegt oder überschrieben */
  isCustom(id: string) { return this.custom().some(e => e.id === id); }
  /** Neue eindeutige ID aus dem Namen */
  newId(name: string): string {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'uebung';
    let id = slug, n = 2;
    while (this.byId(id) || id === 'pause') id = `${slug}_${n++}`;
    return id;
  }
  /** Speichert (neu oder überschreibend); false = ungültig oder Speicher voll */
  save(ex: Exercise): boolean {
    const n = normalize(ex);
    if (!n) return false;
    const prev = this.custom();
    this.custom.set([...prev.filter(e => e.id !== n.id), n]);
    if (this.persistCustom()) return true;
    this.custom.set(prev); return false;
  }
  /** Löscht eine eigene Übung; bei überschriebenen Originalen wird das Original wiederhergestellt */
  remove(id: string) { this.custom.set(this.custom().filter(e => e.id !== id)); this.persistCustom(); }
  private persistCustom(): boolean { try { localStorage.setItem(KEY, JSON.stringify(this.custom())); return true; } catch { return false; } }

  exportData() { return { app: 'fitness-trainer', version: 1, exercises: this.exercises() }; }
  importData(raw: any): ImportResult {
    const list = Array.isArray(raw) ? raw : raw?.exercises;
    if (!Array.isArray(list)) throw new Error('Keine Übungen in der Datei gefunden.');
    const res: ImportResult = { added: 0, updated: 0, skipped: 0 };
    const known = new Set(this.exercises().map(e => e.id));
    const next = new Map(this.custom().map(e => [e.id, e]));
    for (const item of list) {
      const ex = normalize(item);
      if (!ex) { res.skipped++; continue; }
      known.has(ex.id) ? res.updated++ : res.added++;
      known.add(ex.id); next.set(ex.id, ex);
    }
    this.custom.set([...next.values()]);
    localStorage.setItem(KEY, JSON.stringify(this.custom()));
    return res;
  }
  private readCustom(): Exercise[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
}

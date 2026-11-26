import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../core/exercise.service';
import { WorkoutService } from '../core/workout.service';
import { TrainingService } from '../core/training.service';
import { downloadJson, importMessage, readJsonFile, today } from '../core/file-io';

type Key = 'exercises' | 'workouts' | 'trainings';
const LABEL: Record<Key, string> = { exercises: 'Eigene Übungen', workouts: 'Workouts', trainings: 'Trainings' };
const KEYS: Key[] = ['exercises', 'workouts', 'trainings'];

@Component({
  selector: 'app-data', standalone: true, imports: [FormsModule],
  template: `
    <div class="card">
      <h2>Daten sichern &amp; übertragen</h2>
      <p class="muted">Eine Datei enthält die ganze Hierarchie: Trainings → Workouts → Übungen. Beim Import kannst du einzelne Teile auswählen.</p>

      <h3>Exportieren</h3>
      @for (k of keys; track k) {
        <label class="row"><input type="checkbox" [checked]="exp().has(k)" (change)="toggle(exp, k)"> {{ label[k] }} ({{ count(k) }})</label>
      }
      <div class="row"><button class="btn primary" [disabled]="!exp().size" (click)="export()">⇩ Exportieren</button></div>
      <p class="muted">Standard-Übungen der App sind nicht enthalten, sie sind auf jedem Gerät vorhanden.</p>
    </div>

    <div class="card">
      <h3>Importieren</h3>
      <div class="row"><button class="btn secondary" (click)="file.click()">⇧ Datei wählen</button></div>
      <input #file type="file" accept=".json,application/json" hidden (change)="pick($event)">
      @if (found(); as f) {
        <p class="muted">Gefunden in der Datei – Auswahl wird in dieser Reihenfolge importiert:</p>
        @for (k of keys; track k) {
          @if (f[k]) {
            <label class="row"><input type="checkbox" [checked]="imp().has(k)" (change)="toggle(imp, k)"> {{ label[k] }} ({{ f[k] }})</label>
          }
        }
        <p class="muted">Gleiche IDs werden ersetzt, neue ergänzt. Verweist ein Workout auf eine fehlende Übung, bleibt der Verweis leer, bis sie importiert wird.</p>
        <div class="row"><button class="btn primary" [disabled]="!imp().size" (click)="run()">Importieren</button></div>
      }
      @if (msg()) { <div class="note" [class.danger]="err()" role="status">{{ msg() }}</div> }
    </div>`,
})
export class DataComponent {
  private es = inject(ExerciseService); private ws = inject(WorkoutService); private ts = inject(TrainingService);
  keys = KEYS; label = LABEL;
  exp = signal(new Set<Key>(KEYS)); imp = signal(new Set<Key>());
  found = signal<Record<Key, number> | null>(null);
  msg = signal(''); err = signal(false);
  private raw: any = null;

  count(k: Key) { return k === 'exercises' ? this.es.customList().length : k === 'workouts' ? this.ws.workouts().length : this.ts.trainings().length; }
  toggle(s: ReturnType<typeof signal<Set<Key>>>, k: Key) { s.update(v => { const n = new Set(v); n.has(k) ? n.delete(k) : n.add(k); return n; }); }

  export() {
    const out: any = { app: 'fitness-trainer', version: 2 };
    if (this.exp().has('exercises')) out.exercises = this.es.customList();
    if (this.exp().has('workouts')) out.workouts = this.ws.workouts();
    if (this.exp().has('trainings')) out.trainings = this.ts.trainings();
    downloadJson(`fitness-trainer-${today()}.json`, out);
  }

  async pick(ev: Event) {
    const input = ev.target as HTMLInputElement, f = input.files?.[0]; input.value = '';
    if (!f) return;
    this.msg.set(''); this.found.set(null); this.imp.set(new Set());
    try {
      const raw: any = await readJsonFile(f); this.raw = raw;
      const n = (a: unknown) => Array.isArray(a) ? a.length : 0;
      const found = { exercises: n(raw?.exercises), workouts: n(raw?.workouts ?? raw?.plans), trainings: n(raw?.trainings) };
      if (!KEYS.some(k => found[k])) throw new Error('Keine Übungen, Workouts oder Trainings gefunden. Reine Listen bitte über die jeweilige Seite importieren.');
      this.found.set(found); this.imp.set(new Set(KEYS.filter(k => found[k])));
    } catch (e) { this.msg.set((e as Error).message); this.err.set(true); }
  }

  run() {
    const parts: string[] = [];
    try {
      const f = this.found()!;
      if (this.imp().has('exercises') && f.exercises) parts.push(importMessage(this.es.importData({ exercises: this.raw.exercises }), 'Übungen'));
      if (this.imp().has('workouts') && f.workouts) parts.push(importMessage(this.ws.importData(this.raw), 'Workouts'));
      if (this.imp().has('trainings') && f.trainings) parts.push(importMessage(this.ts.importData({ trainings: this.raw.trainings }), 'Trainings'));
      this.msg.set(parts.join(' ')); this.err.set(false); this.found.set(null);
    } catch (e) { this.msg.set([...parts, (e as Error).message].join(' ')); this.err.set(true); }
  }
}

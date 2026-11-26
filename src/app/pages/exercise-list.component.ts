import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { isGroup } from '../core/models';
import { ExerciseService } from '../core/exercise.service';
import { EXERCISE_TYPES, formatDuration } from '../core/models';
import { downloadJson, importMessage, readJsonFile, today } from '../core/file-io';

@Component({
  selector: 'app-exercise-list', standalone: true, imports: [FormsModule, RouterLink],
  template: `
    <div class="row span-all" style="margin:0 0 1rem"><a class="btn primary" routerLink="/exercises/new">➕ Neue Übung</a></div>
    <div class="filters span-all">
      <input class="search-bar" type="search" placeholder="Suchen…" [ngModel]="q()" (ngModelChange)="q.set($event)">
      <select class="search-bar" aria-label="Typ filtern" [ngModel]="type()" (ngModelChange)="type.set($event)">
        <option value="">Alle Typen</option>
        @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
      </select>
    </div>
    @for (ex of list(); track ex.id) {
      <article class="card">
        <h2>{{ ex.name }}
          <span class="tags">@if (ex.type) { <span class="badge">{{ ex.type }}</span> }
            <span class="badge">{{ ex.reps ? ex.reps + ' Wdh.' : fmt(ex.durationSeconds ?? 120) }}</span></span></h2>
        <div class="muted"><i>{{ ex.alt }}</i>{{ ex.alt ? ' · ' : '' }}{{ ex.target }}</div>
        <h3>Ziel &amp; Wirkung</h3><p>{{ ex.purpose }}</p>
        @if (ex.steps.length) {
          <h3>Ausführung</h3>
          <ol>@for (s of ex.steps; track $index) { <li [innerHTML]="s"></li> }</ol>
        }
        @if (ex.note) { <div class="note">{{ ex.note }}</div> }
        @if (ex.safety) { <div class="note danger">{{ ex.safety }}</div> }
        <div class="row">
          <a class="btn secondary" [routerLink]="['/exercises', ex.id, 'edit']">Bearbeiten</a>
          @if (es.isCustom(ex.id)) {
            <button class="btn danger" (click)="del(ex.id, ex.name)">{{ es.inBase(ex.id) ? 'Original wiederherstellen' : 'Löschen' }}</button>
          }
        </div>
      </article>
    } @empty { <p class="muted center span-all">Keine Übungen gefunden.</p> }

    <div class="card span-all">
      <h3>Übungen übertragen</h3>
      <p class="muted">Exportiert alle Übungen als JSON-Datei. Beim Import werden Übungen mit gleicher ID ersetzt, neue ergänzt.</p>
      <div class="row">
        <button class="btn secondary" (click)="export()">⇩ Exportieren</button>
        <button class="btn secondary" (click)="file.click()">⇧ Importieren</button>
      </div>
      <input #file type="file" accept=".json,application/json" hidden (change)="import($event)">
      @if (msg()) { <div class="note" [class.danger]="err()" role="status">{{ msg() }}</div> }
    </div>`,
})
export class ExerciseListComponent {
  es = inject(ExerciseService); private ps = inject(WorkoutService); fmt = formatDuration; types = EXERCISE_TYPES;
  q = signal(''); type = signal(''); msg = signal(''); err = signal(false);
  list = computed(() => this.es.search(this.q()).filter(e => !this.type() || e.type === this.type()));

  del(id: string, name: string) {
    const restore = this.es.inBase(id);
    const used = this.ps.workouts().filter(p => p.items.some(e => isGroup(e) ? e.items.some(i => i.exerciseId === id) : e.exerciseId === id)).length;
    const text = restore ? `Eigene Änderungen an „${name}“ verwerfen und das Original wiederherstellen?`
      : `„${name}“ wirklich löschen?` + (used ? `\nSie wird in ${used} Workout(s) verwendet und fehlt dort danach.` : '');
    if (confirm(text)) this.es.remove(id);
  }
  export() { downloadJson(`fitness-trainer-uebungen-${today()}.json`, this.es.exportData()); }
  async import(ev: Event) {
    const input = ev.target as HTMLInputElement, f = input.files?.[0]; input.value = '';
    if (!f) return;
    try { this.msg.set(importMessage(this.es.importData(await readJsonFile(f)), 'Übungen')); this.err.set(false); }
    catch (e) { this.msg.set((e as Error).message || 'Import fehlgeschlagen.'); this.err.set(true); }
  }
}

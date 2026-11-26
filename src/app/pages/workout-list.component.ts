import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { formatDuration, workoutCounts, workoutSeconds, Workout } from '../core/models';
import { downloadJson, importMessage, readJsonFile, today } from '../core/file-io';

@Component({
  selector: 'app-workout-list', standalone: true, imports: [RouterLink],
  template: `
    @for (p of ps.workouts(); track p.id) {
      <article class="card">
        <h2>{{ p.name }}</h2>
        @if (p.description) { <p class="muted sub-text">{{ p.description }}</p> }
        <div class="stats">
          <div class="stat-box"><span class="stat-label">Dauer</span><span class="stat-value">{{ fmt(total(p)) }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Übungen</span><span class="stat-value">{{ counts(p).exercises }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Pausen</span><span class="stat-value">{{ counts(p).pauses }}</span></div>
          @if (counts(p).rounds > 1) { <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Runden</span><span class="stat-value">{{ counts(p).rounds }}</span></div> }
        </div>
        <div class="row">
          <a class="btn primary" [routerLink]="['/workouts', p.id, 'play']">▶ Starten</a>
          <a class="btn secondary" [routerLink]="['/workouts', p.id, 'edit']">Bearbeiten</a>
          <button class="btn danger" (click)="del(p)">Löschen</button>
        </div>
      </article>
    } @empty {
      <div class="card center span-all"><h2>Bereit</h2><p class="muted sub-text">Noch keine Workouts vorhanden.</p>
        <div class="row"><a class="btn primary" routerLink="/workouts/new">Erstes Workout erstellen</a></div></div>
    }

    <div class="card span-all">
      <h3>Workouts übertragen</h3>
      <p class="muted">Exportiert alle Workouts als JSON-Datei. Beim Import werden Workouts mit gleicher ID ersetzt, neue ergänzt. Eigene Übungen vorher auf dem Zielgerät importieren.</p>
      <div class="row">
        <button class="btn secondary" (click)="export()" [disabled]="!ps.workouts().length">⇩ Exportieren</button>
        <button class="btn secondary" (click)="file.click()">⇧ Importieren</button>
      </div>
      <input #file type="file" accept=".json,application/json" hidden (change)="import($event)">
      @if (msg()) { <div class="note" [class.danger]="err()" role="status">{{ msg() }}</div> }
    </div>`,
})
export class WorkoutListComponent {
  ps = inject(WorkoutService); fmt = formatDuration;
  total = workoutSeconds; counts = workoutCounts;
  msg = signal(''); err = signal(false);
  export() { downloadJson(`fitness-trainer-plaene-${today()}.json`, this.ps.exportData()); }
  async import(ev: Event) {
    const input = ev.target as HTMLInputElement, f = input.files?.[0]; input.value = '';
    if (!f) return;
    try { this.msg.set(importMessage(this.ps.importData(await readJsonFile(f)), 'Workouts')); this.err.set(false); }
    catch (e) { this.msg.set((e as Error).message || 'Import fehlgeschlagen.'); this.err.set(true); }
  }
  del(p: Workout) { if (confirm(`„${p.name}“ wirklich löschen?`)) this.ps.remove(p.id); }
}

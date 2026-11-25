import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanService } from '../core/plan.service';
import { TrainingService } from '../core/training.service';
import { Training, formatDuration, planSeconds } from '../core/models';
import { downloadJson, importMessage, readJsonFile, today } from '../core/file-io';

@Component({
  selector: 'app-training-list', standalone: true, imports: [RouterLink],
  template: `
    <div class="row span-all" style="margin:0 0 1rem"><a class="btn primary" routerLink="/trainings/new">➕ Neues Training</a></div>
    @for (t of ts.trainings(); track t.id) {
      <article class="card">
        @if (t.image) { <img class="card-img" [src]="t.image" alt=""> }
        <h2>{{ t.name }}</h2>
        <div class="stats">
          <div class="stat-box"><span class="stat-label">Dauer</span><span class="stat-value">{{ fmt(total(t)) }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Pläne</span><span class="stat-value">{{ t.planIds.length }}</span></div>
        </div>
        <div class="row">
          <a class="btn primary" [routerLink]="['/trainings', t.id]">Öffnen</a>
          <a class="btn secondary" [routerLink]="['/trainings', t.id, 'edit']">Bearbeiten</a>
          <button class="btn danger" (click)="del(t)">Löschen</button>
        </div>
      </article>
    } @empty {
      <div class="card center span-all"><h2>Bereit</h2><p class="muted sub-text">Noch keine Trainings vorhanden. Ein Training fasst mehrere Trainingspläne zusammen.</p></div>
    }

    <div class="card span-all">
      <h3>Trainings übertragen</h3>
      <p class="muted">Exportiert alle Trainings (inkl. Bild) als JSON-Datei. Beim Import werden Trainings mit gleicher ID ersetzt, neue ergänzt. Die zugehörigen Pläne vorher auf dem Zielgerät importieren.</p>
      <div class="row">
        <button class="btn secondary" (click)="export()" [disabled]="!ts.trainings().length">⇩ Exportieren</button>
        <button class="btn secondary" (click)="file.click()">⇧ Importieren</button>
      </div>
      <input #file type="file" accept=".json,application/json" hidden (change)="import($event)">
      @if (msg()) { <div class="note" [class.danger]="err()" role="status">{{ msg() }}</div> }
    </div>`,
})
export class TrainingListComponent {
  ts = inject(TrainingService); private ps = inject(PlanService); fmt = formatDuration;
  msg = signal(''); err = signal(false);
  total(t: Training) { return t.planIds.reduce((s, id) => s + planSeconds(this.ps.get(id)), 0); }
  del(t: Training) { if (confirm(`„${t.name}“ wirklich löschen?`)) this.ts.remove(t.id); }
  export() { downloadJson(`fitness-trainer-trainings-${today()}.json`, this.ts.exportData()); }
  async import(ev: Event) {
    const input = ev.target as HTMLInputElement, f = input.files?.[0]; input.value = '';
    if (!f) return;
    try { this.msg.set(importMessage(this.ts.importData(await readJsonFile(f)), 'Trainings')); this.err.set(false); }
    catch (e) { this.msg.set((e as Error).message || 'Import fehlgeschlagen.'); this.err.set(true); }
  }
}

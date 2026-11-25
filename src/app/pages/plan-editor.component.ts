import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { PlanService } from '../core/plan.service';
import { Exercise, formatDuration, itemColors, PlanItem } from '../core/models';

@Component({
  selector: 'app-plan-editor', standalone: true, imports: [FormsModule],
  template: `
    <section class="card">
      <h2>{{ id() ? 'Trainingsplan bearbeiten' : 'Neuer Trainingsplan' }}</h2>
      <label>Name<input class="field" [(ngModel)]="name" placeholder="z. B. Morgen-Mobility"></label>
      <label>Beschreibung<textarea class="field" rows="2" [(ngModel)]="description"></textarea></label>
      <div class="summary"><strong>Gesamtdauer:</strong> {{ fmt(total()) }} · {{ items().length }} Übungen</div>
    </section>

    <section class="card">
      <h3>Ablauf</h3>
      @for (it of items(); track $index) {
        <div class="item">
          <span class="nr">{{ $index + 1 }}</span>
          <span class="sw" [style.background]="colors()[$index]"></span>
          <span class="grow">{{ it.pause ? '⏸ Pause' : (es.byId(it.exerciseId!)?.name ?? 'Unbekannte Übung') }}</span>
          <input class="dur" type="number" min="10" step="10" [ngModel]="it.durationSeconds" (ngModelChange)="setDur($index, $event)"> s
          <button class="icon" (click)="move($index, -1)" [disabled]="$first">↑</button>
          <button class="icon" (click)="move($index, 1)" [disabled]="$last">↓</button>
          <button class="icon" (click)="remove($index)">✕</button>
        </div>
      } @empty { <p class="muted">Noch keine Übungen – unten hinzufügen.</p> }
      <div class="row"><button class="btn secondary" (click)="addPause()">⏸ Pause einfügen</button></div>
    </section>

    <section class="card">
      <h3>Übungen hinzufügen</h3>
      <input class="search-bar" type="search" placeholder="Suchen…" [ngModel]="q()" (ngModelChange)="q.set($event)">
      @for (ex of filtered(); track ex.id) {
        <div class="item"><span class="grow"><strong>{{ ex.name }}</strong><br><small class="muted">{{ ex.type ? ex.type + ' · ' : '' }}{{ ex.target }}</small></span>
          <button class="btn secondary" (click)="add(ex)">+ Hinzufügen</button></div>
      }
    </section>

    <div class="row sticky">
      <button class="btn primary" [disabled]="!name.trim() || !items().length" (click)="save()">💾 Speichern</button>
      <button class="btn secondary" (click)="router.navigate(['/plans'])">Abbrechen</button>
    </div>`,
})
export class PlanEditorComponent {
  es = inject(ExerciseService); private ps = inject(PlanService); router = inject(Router); private route = inject(ActivatedRoute);
  fmt = formatDuration;
  id = signal<string | undefined>(undefined);
  name = ''; description = '';
  items = signal<PlanItem[]>([]);
  q = signal('');
  colors = computed(() => itemColors(this.items()));
  filtered = computed(() => this.es.search(this.q()));
  total = computed(() => this.items().reduce((s, i) => s + (i.durationSeconds || 0), 0));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const p = id ? this.ps.get(id) : undefined;
    if (p) { this.id.set(p.id); this.name = p.name; this.description = p.description; this.items.set(p.items.map(i => ({ ...i }))); }
  }
  add(e: Exercise) { this.items.update(l => [...l, { exerciseId: e.id, durationSeconds: e.durationSeconds ?? 120 }]); }
  addPause() { this.items.update(l => [...l, { pause: true, durationSeconds: this.es.pause().durationSeconds ?? 30 }]); }
  remove(i: number) { this.items.update(l => l.filter((_, x) => x !== i)); }
  setDur(i: number, v: number) { this.items.update(l => l.map((it, x) => x === i ? { ...it, durationSeconds: Math.max(0, Math.round(+v || 0)) } : it)); }
  move(i: number, d: number) {
    this.items.update(l => { const c = [...l]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c; });
  }
  save() {
    this.ps.save({ id: this.id() ?? this.ps.newId(), name: this.name.trim(), description: this.description.trim(), items: this.items() });
    this.router.navigate(['/plans']);
  }
}

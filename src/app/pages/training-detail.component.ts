import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { ProgressService } from '../core/progress.service';
import { TrainingService } from '../core/training.service';
import { formatDuration, workoutSeconds } from '../core/models';

@Component({
  selector: 'app-training-detail', standalone: true, imports: [RouterLink],
  template: `
    @if (tr(); as t) {
      <article class="card">
        @if (t.image && t.description) {
          <div class="flip" [class.flipped]="flipped()" (pointerdown)="down($event)" (pointerup)="up($event)" (pointercancel)="sx = null">
            <div class="flip-in">
              <div class="flip-face front" [attr.inert]="flipped() ? '' : null" (click)="front()">
                <img class="cover" [src]="t.image" alt="">
                <span class="flip-hint" aria-hidden="true">ⓘ Beschreibung</span>
              </div>
              <div class="flip-face back" [attr.inert]="flipped() ? null : ''">
                <button class="icon flip-back" (click)="flipped.set(false)" aria-label="Zurück zum Bild" title="Zurück zum Bild">↺</button>
                <div class="rich" [innerHTML]="t.description"></div>
              </div>
            </div>
          </div>
        } @else if (t.image) { <img class="cover" [src]="t.image" alt=""> }
        <h2>{{ t.name }}</h2>
        <div class="stats compact">
          <div class="stat-box"><span class="stat-label">Dauer</span><span class="stat-value">{{ fmt(total()) }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Workouts</span><span class="stat-value">{{ entries().length }}</span></div>
        </div>
        @if (t.description && !t.image) { <div class="rich" [innerHTML]="t.description"></div> }

        <h3>Workouts <span class="progress-info">{{ doneCount() }} / {{ entries().length }} erledigt</span></h3>
        @for (e of entries(); track e.i) {
          <div class="item" [class.done]="doneSet().has(e.i)">
            @if (doneSet().has(e.i)) { <span class="nr check" aria-label="erledigt">✓</span> } @else { <span class="nr">{{ $index + 1 }}</span> }
            <span class="grow"><span class="pname">{{ e.p.name }}</span>
              <small class="sub-dur">{{ fmt(sec(e.p)) }}@if ((e.p.rounds ?? 1) > 1) { · {{ e.p.rounds }} Runden }</small></span>
            <a class="icon" [routerLink]="['/workouts', e.p.id, 'play']" [queryParams]="{ training: t.id, index: e.i }"
               aria-label="Workout einzeln starten" title="Workout einzeln starten">▶</a>
          </div>
        }
        @if (doneCount()) { <div class="row" style="margin-top:.5rem"><button class="linkbtn" (click)="progress.reset(t.id)">Markierungen zurücksetzen</button></div> }
        <div class="row"><a class="btn primary" [routerLink]="['/trainings', t.id, 'play']" (click)="progress.reset(t.id)">▶ Training starten</a></div>
      </article>
    } @else { <p class="center">Training nicht gefunden. <a routerLink="/trainings">Zurück</a></p> }`,
})
export class TrainingDetailComponent {
  private ps = inject(WorkoutService); private ts = inject(TrainingService); progress = inject(ProgressService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  /** Wendekarte: Bild vorne, Beschreibung hinten; Wechsel per Tippen oder Wischen */
  flipped = signal(false); sx: number | null = null; sy = 0; private swiped = false;
  down(e: PointerEvent) { this.sx = e.clientX; this.sy = e.clientY; this.swiped = false; }
  up(e: PointerEvent) {
    if (this.sx === null) return;
    const dx = e.clientX - this.sx, dy = e.clientY - this.sy; this.sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { this.swiped = true; this.flipped.update(v => !v); }
  }
  front() { if (this.swiped) { this.swiped = false; return; } this.flipped.set(true); }
  fmt = formatDuration; sec = workoutSeconds;
  tr = computed(() => this.ts.get(this.id));
  /** Workouts mit ihrer Position (i) im Training; gelöschte Workouts werden übersprungen */
  entries = computed(() => (this.tr()?.workoutIds ?? []).flatMap((pid, i) => { const p = this.ps.get(pid); return p ? [{ p, i }] : []; }));
  total = computed(() => this.entries().reduce((s, e) => s + workoutSeconds(e.p), 0));
  doneSet = computed(() => new Set(this.progress.done(this.id)));
  doneCount = computed(() => this.entries().filter(e => this.doneSet().has(e.i)).length);
}

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { LastUsedService } from '../core/last-used.service';
import { WorkoutService } from '../core/workout.service';
import { TrainingService } from '../core/training.service';
import { formatDuration, workoutSeconds } from '../core/models';

interface Last { kind: 'training' | 'workout'; name: string; image?: string; seconds: number; play: string[]; detail?: string[]; }

@Component({
  selector: 'app-dashboard', standalone: true, imports: [RouterLink],
  template: `
    <section class="card">
      <p class="muted">{{ greeting }}</p>
      <h2>Bereit fürs Training?</h2>
      @if (last(); as l) {
        <h3>Zuletzt trainiert</h3>
        @if (l.image) { <img class="cover" [src]="l.image" alt=""> }
        <div class="last-title">{{ l.name }}</div>
        <div class="muted">{{ l.kind === 'training' ? 'Training' : 'Workout' }} · {{ fmt(l.seconds) }}</div>
        <div class="row">
          <a class="btn primary" [routerLink]="l.play">▶ Starten</a>
          @if (l.detail) { <a class="btn secondary" [routerLink]="l.detail">Öffnen</a> }
        </div>
      } @else {
        <p class="muted sub-text">Noch nichts trainiert. Lege ein Training an oder starte ein Workout.</p>
        <div class="row"><a class="btn primary" routerLink="/trainings/new">➕ Neues Training</a></div>
      }
    </section>

    <div class="tiles">
      <a class="tile" routerLink="/trainings">Trainings<small>{{ ts.trainings().length }} gespeichert</small></a>
      <a class="tile" routerLink="/workouts">Workouts<small>{{ ps.workouts().length }} gespeichert</small></a>
      <a class="tile" routerLink="/workouts/new">Neues Workout<small>Aus Übungen erstellen</small></a>
      <a class="tile" routerLink="/exercises">Übungen<small>{{ es.exercises().length }} im Nachschlagewerk</small></a>
    </div>`,
})
export class DashboardComponent {
  ts = inject(TrainingService); ps = inject(WorkoutService); es = inject(ExerciseService); private lu = inject(LastUsedService);
  fmt = formatDuration;
  greeting = (() => { const h = new Date().getHours(); return h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend'; })();

  /** zuletzt gestartetes Training bzw. Workout – nur, wenn es noch existiert */
  last = computed<Last | undefined>(() => {
    const l = this.lu.last();
    if (!l) return undefined;
    if (l.kind === 'training') {
      const t = this.ts.get(l.id);
      return t && { kind: 'training', name: t.name, image: t.image, play: ['/trainings', t.id, 'play'], detail: ['/trainings', t.id],
        seconds: t.workoutIds.reduce((s, id) => s + workoutSeconds(this.ps.get(id)), 0) };
    }
    const p = this.ps.get(l.id);
    return p && { kind: 'workout', name: p.name, seconds: workoutSeconds(p), play: ['/workouts', p.id, 'play'] };
  });
}

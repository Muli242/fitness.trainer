import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { ExerciseService } from '../core/exercise.service';
import { WorkoutGroup, WorkoutItem, colorEntries, colorOf, formatDuration, isGroup, workoutCounts, workoutSeconds } from '../core/models';
import { KebabComponent, KebabItem } from '../shared/kebab.component';

@Component({
  selector: 'app-workout-detail', standalone: true, imports: [RouterLink, KebabComponent],
  template: `
    @if (w(); as p) {
      <article class="card">
        <h2><span class="ttl">{{ p.name }}</span><app-kebab [items]="menu()" /></h2>
        @if (p.description) { <p class="muted sub-text">{{ p.description }}</p> }
        <div class="stats compact">
          <div class="stat-box"><span class="stat-label">Dauer</span><span class="stat-value">{{ fmt(sec(p)) }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Übungen</span><span class="stat-value">{{ counts(p).exercises }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Pausen</span><span class="stat-value">{{ counts(p).pauses }}</span></div>
          @if ((p.rounds ?? 1) > 1) { <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Runden</span><span class="stat-value">{{ p.rounds }}</span></div> }
        </div>

        <h3>Ablauf</h3>
        @for (e of entries(); track $index) {
          @if (grp(e); as g) {
            <div class="group">
              <div class="item group-head"><span class="grow"><span class="pname">{{ g.name }}</span>
                <small class="sub-dur">{{ g.rounds }} {{ g.rounds > 1 ? 'Runden' : 'Runde' }}</small></span></div>
              @for (i of g.items; track $index) { <div class="item sub">
                <span class="dot" [style.background]="col(i)"></span><span class="grow pname">{{ label(i) }}</span><span class="badge">{{ fmt(i.durationSeconds) }}</span></div> }
            </div>
          } @else {
            <div class="item"><span class="dot" [style.background]="col(leaf(e))"></span><span class="grow pname">{{ label(leaf(e)) }}</span>
              <span class="badge">{{ fmt(leaf(e).durationSeconds) }}</span></div>
          }
        }
        <div class="row"><a class="btn primary" [routerLink]="['/workouts', p.id, 'play']">▶ Starten</a></div>
      </article>
    } @else { <p class="center">Workout nicht gefunden. <a routerLink="/workouts">Zurück</a></p> }`,
})
export class WorkoutDetailComponent {
  private ws = inject(WorkoutService); private es = inject(ExerciseService); private router = inject(Router);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  fmt = formatDuration; sec = workoutSeconds; counts = workoutCounts;
  w = computed(() => this.ws.get(this.id));
  entries = computed(() => colorEntries(this.w()?.items ?? []));
  grp(e: unknown): WorkoutGroup | null { return isGroup(e as any) ? e as WorkoutGroup : null; }
  leaf(e: unknown) { return e as WorkoutItem; }
  col(i: WorkoutItem) { return colorOf(i); }
  label(i: WorkoutItem) { return i.pause ? '⏸ Pause' : (this.es.byId(i.exerciseId!)?.name ?? 'Unbekannte Übung'); }
  menu(): KebabItem[] {
    return [
      { label: 'Bearbeiten', run: () => this.router.navigate(['/workouts', this.id, 'edit']) },
      { label: 'Löschen', danger: true, run: () => {
        const p = this.w();
        if (p && confirm(`„${p.name}“ wirklich löschen?`)) { this.ws.remove(p.id); this.router.navigate(['/workouts']); }
      } },
    ];
  }
}

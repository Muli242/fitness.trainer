import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { formatDuration, workoutCounts, workoutSeconds, Workout } from '../core/models';
import { KebabComponent, KebabItem, fromKebab } from '../shared/kebab.component';

@Component({
  selector: 'app-workout-list', standalone: true, imports: [RouterLink, KebabComponent],
  template: `
    @for (p of ps.workouts(); track p.id) {
      <article class="card clickable" tabindex="0" (click)="open(p, $event)" (keydown.enter)="open(p, $event)">
        <h2><span class="ttl">{{ p.name }}</span><app-kebab [items]="menu(p)" /></h2>
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
      </article>
    } @empty {
      <div class="card center span-all"><h2>Bereit</h2><p class="muted sub-text">Noch keine Workouts vorhanden.</p></div>
    }
    <a class="fab" routerLink="/workouts/new" aria-label="Neues Workout" title="Neues Workout">+</a>`,
})
export class WorkoutListComponent {
  ps = inject(WorkoutService); private router = inject(Router); fmt = formatDuration;
  total = workoutSeconds; counts = workoutCounts;
  open(p: Workout, e: Event) { if (!fromKebab(e)) this.router.navigate(['/workouts', p.id]); }
  menu(p: Workout): KebabItem[] {
    return [
      { label: 'Öffnen', run: () => this.router.navigate(['/workouts', p.id]) },
      { label: 'Bearbeiten', run: () => this.router.navigate(['/workouts', p.id, 'edit']) },
      { label: 'Löschen', danger: true, run: () => { if (confirm(`„${p.name}“ wirklich löschen?`)) this.ps.remove(p.id); } },
    ];
  }
}

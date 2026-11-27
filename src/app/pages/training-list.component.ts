import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { TrainingService } from '../core/training.service';
import { Training, formatDuration, workoutSeconds } from '../core/models';
import { KebabComponent, KebabItem, fromKebab } from '../shared/kebab.component';

@Component({
  selector: 'app-training-list', standalone: true, imports: [RouterLink, KebabComponent],
  template: `
    @for (t of ts.trainings(); track t.id) {
      <article class="card clickable" tabindex="0" (click)="open(t, $event)" (keydown.enter)="open(t, $event)">
        @if (t.image) { <img class="card-img" [src]="t.image" alt=""> }
        <h2><span class="ttl">{{ t.name }}</span><app-kebab [items]="menu(t)" /></h2>
        <div class="stats">
          <div class="stat-box"><span class="stat-label">Dauer</span><span class="stat-value">{{ fmt(total(t)) }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Workouts</span><span class="stat-value">{{ t.workoutIds.length }}</span></div>
        </div>
      </article>
    } @empty {
      <div class="card center span-all"><h2>Bereit</h2><p class="muted sub-text">Noch keine Trainings vorhanden. Ein Training fasst mehrere Workouts zusammen.</p></div>
    }
    <a class="fab" routerLink="/trainings/new" aria-label="Neues Training" title="Neues Training">+</a>`,
})
export class TrainingListComponent {
  ts = inject(TrainingService); private ps = inject(WorkoutService); private router = inject(Router); fmt = formatDuration;
  total(t: Training) { return t.workoutIds.reduce((s, id) => s + workoutSeconds(this.ps.get(id)), 0); }
  open(t: Training, e: Event) { if (!fromKebab(e)) this.router.navigate(['/trainings', t.id]); }
  menu(t: Training): KebabItem[] {
    return [
      { label: 'Öffnen', run: () => this.router.navigate(['/trainings', t.id]) },
      { label: 'Bearbeiten', run: () => this.router.navigate(['/trainings', t.id, 'edit']) },
      { label: 'Löschen', danger: true, run: () => { if (confirm(`„${t.name}“ wirklich löschen?`)) this.ts.remove(t.id); } },
    ];
  }
}

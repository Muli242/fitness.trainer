import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { ExerciseActions } from '../core/exercise-actions.service';
import { formatDuration } from '../core/models';
import { KebabComponent, KebabItem } from '../shared/kebab.component';

@Component({
  selector: 'app-exercise-detail', standalone: true, imports: [RouterLink, KebabComponent],
  template: `
    @if (ex(); as e) {
      <article class="card">
        <h2><span class="ttl">{{ e.name }}</span><app-kebab [items]="menu()" /></h2>
        <div class="tags mt">@if (e.type) { <span class="badge">{{ e.type }}</span> }
          <span class="badge">{{ e.reps ? e.reps + ' Wdh.' : fmt(e.durationSeconds ?? 120) }}</span></div>
        <div class="muted mt"><i>{{ e.alt }}</i>{{ e.alt ? ' · ' : '' }}{{ e.target }}</div>
        <h3>Ziel &amp; Wirkung</h3><p>{{ e.purpose }}</p>
        @if (e.steps.length) {
          <h3>Ausführung</h3>
          <ol>@for (s of e.steps; track $index) { <li [innerHTML]="s"></li> }</ol>
        }
        @if (e.note) { <div class="note">{{ e.note }}</div> }
        @if (e.safety) { <div class="note danger">{{ e.safety }}</div> }
      </article>
    } @else { <p class="center">Übung nicht gefunden. <a routerLink="/exercises">Zurück</a></p> }`,
})
export class ExerciseDetailComponent {
  private es = inject(ExerciseService); private act = inject(ExerciseActions); private router = inject(Router);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  fmt = formatDuration;
  ex = computed(() => this.es.byId(this.id));
  menu(): KebabItem[] {
    const e = this.ex(); if (!e) return [];
    const m: KebabItem[] = [{ label: 'Bearbeiten', run: () => this.router.navigate(['/exercises', e.id, 'edit']) }];
    if (this.act.canRemove(e)) m.push({ label: this.act.removeLabel(e), danger: true, run: () => {
      if (this.act.remove(e) && !this.es.byId(e.id)) this.router.navigate(['/exercises']);   // Original wiederherstellen: Ansicht bleibt
    } });
    return m;
  }
}

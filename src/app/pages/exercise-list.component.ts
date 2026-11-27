import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { ExerciseActions } from '../core/exercise-actions.service';
import { EXERCISE_TYPES, Exercise } from '../core/models';
import { KebabComponent, KebabItem, fromKebab } from '../shared/kebab.component';

@Component({
  selector: 'app-exercise-list', standalone: true, imports: [FormsModule, RouterLink, KebabComponent],
  template: `
    <div class="filters span-all">
      <input class="search-bar" type="search" placeholder="Suchen…" [ngModel]="q()" (ngModelChange)="q.set($event)">
      <select class="search-bar" aria-label="Typ filtern" [ngModel]="type()" (ngModelChange)="type.set($event)">
        <option value="">Alle Typen</option>
        @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
      </select>
    </div>
    @for (ex of list(); track ex.id) {
      <article class="card clickable ex-card" tabindex="0" (click)="open(ex, $event)" (keydown.enter)="open(ex, $event)">
        <h2><span class="ttl">{{ ex.name }}</span><app-kebab [items]="menu(ex)" /></h2>
        <div class="ex-target">{{ ex.target }}</div>
        <div class="ex-purpose"><span>{{ ex.purpose }}</span>@if (ex.type) { <span class="badge">{{ ex.type }}</span> }</div>
      </article>
    } @empty { <p class="muted center span-all">Keine Übungen gefunden.</p> }
    <a class="fab" routerLink="/exercises/new" aria-label="Neue Übung" title="Neue Übung">+</a>`,
})
export class ExerciseListComponent {
  es = inject(ExerciseService); private act = inject(ExerciseActions); private router = inject(Router); types = EXERCISE_TYPES;
  q = signal(''); type = signal('');
  list = computed(() => this.es.search(this.q()).filter(e => !this.type() || e.type === this.type()));
  open(ex: Exercise, e: Event) { if (!fromKebab(e)) this.router.navigate(['/exercises', ex.id]); }
  menu(ex: Exercise): KebabItem[] {
    const m: KebabItem[] = [
      { label: 'Öffnen', run: () => this.router.navigate(['/exercises', ex.id]) },
      { label: 'Bearbeiten', run: () => this.router.navigate(['/exercises', ex.id, 'edit']) },
    ];
    if (this.act.canRemove(ex)) m.push({ label: this.act.removeLabel(ex), danger: true, run: () => this.act.remove(ex) });
    return m;
  }
}

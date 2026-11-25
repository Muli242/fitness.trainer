import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { EXERCISE_TYPES, Exercise, ExerciseType, isExerciseType } from '../core/models';

@Component({
  selector: 'app-exercise-editor', standalone: true, imports: [FormsModule],
  template: `
    <section class="card">
      <h2>{{ editId() ? 'Übung bearbeiten' : 'Neue Übung' }}</h2>
      @if (editId() && es.inBase(editId()!) ) { <p class="muted sub-text">Originalübung – deine Änderungen werden gespeichert und überlagern das Original.</p> }

      <label>Name<input class="field" maxlength="80" [(ngModel)]="name" placeholder="z. B. Liegestütze"></label>
      <label>Typ
        <select class="search-bar" [(ngModel)]="type">
          <option value="">– kein Typ –</option>
          @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
        </select></label>
      <label>Auch bekannt als<input class="field" [(ngModel)]="alt" placeholder="Synonyme, Varianten"></label>
      <label>Zielbereich<input class="field" [(ngModel)]="target" placeholder="z. B. Brust, Schultern, Trizeps"></label>
      <label>Ziel &amp; Wirkung<textarea class="field" rows="3" [(ngModel)]="purpose"></textarea></label>

      <label>Vorgabe</label>
      <div class="row" style="margin:.35rem 0 .75rem">
        <button class="btn" [class.primary]="mode() === 'duration'" (click)="mode.set('duration')">Dauer</button>
        <button class="btn" [class.primary]="mode() === 'reps'" (click)="mode.set('reps')">Wiederholungen</button>
      </div>
      @if (mode() === 'duration') {
        <label>Dauer in Sekunden<input class="field" type="number" min="5" step="5" [(ngModel)]="duration"></label>
      } @else {
        <label>Anzahl Wiederholungen<input class="field" type="number" min="1" step="1" [(ngModel)]="reps"></label>
        <label>Zeit im Plan (Sekunden, für die Gesamtdauer)<input class="field" type="number" min="5" step="5" [(ngModel)]="duration"></label>
      }
    </section>

    <section class="card">
      <h3>Ausführung (optional)</h3>
      @for (s of steps(); track $index; let i = $index) {
        <div class="item">
          <span class="nr">{{ i + 1 }}</span>
          <textarea class="field grow" style="margin:0" rows="2" [ngModel]="s" (ngModelChange)="setStep(i, $event)" placeholder="Schritt beschreiben"></textarea>
          <button class="icon" (click)="move(i, -1)" [disabled]="i === 0">↑</button>
          <button class="icon" (click)="move(i, 1)" [disabled]="i === steps().length - 1">↓</button>
          <button class="icon" (click)="removeStep(i)">✕</button>
        </div>
      }
      <div class="row"><button class="btn secondary" (click)="addStep()">+ Schritt hinzufügen</button></div>
      <p class="muted small" style="text-align:center;margin-top:.5rem">Hervorhebung mit &lt;strong&gt;Text&lt;/strong&gt; ist möglich.</p>
    </section>

    <section class="card">
      <label>Hinweis / Tipp (optional)<textarea class="field" rows="2" [(ngModel)]="note"></textarea></label>
      <label>Sicherheitshinweis (optional)<textarea class="field" rows="2" [(ngModel)]="safety"></textarea></label>
    </section>

    @if (msg()) { <div class="note danger" role="alert">{{ msg() }}</div> }
    <div class="row sticky">
      <button class="btn primary" [disabled]="!valid()" (click)="save()">💾 Speichern</button>
      <button class="btn secondary" (click)="router.navigate(['/exercises'])">Abbrechen</button>
    </div>`,
})
export class ExerciseEditorComponent {
  es = inject(ExerciseService); router = inject(Router); private route = inject(ActivatedRoute);
  types = EXERCISE_TYPES;
  editId = signal<string | undefined>(undefined);
  name = ''; type: ExerciseType | '' = ''; alt = ''; target = ''; purpose = ''; note = ''; safety = '';
  duration = 120; reps = 10;
  mode = signal<'duration' | 'reps'>('duration');
  steps = signal<string[]>(['']);
  msg = signal('');
  valid = computed(() => true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const e = id ? this.es.byId(id) : undefined;
    if (!e) return;
    this.editId.set(e.id); this.name = e.name; this.type = e.type ?? ''; this.alt = e.alt; this.target = e.target; this.purpose = e.purpose;
    this.note = e.note ?? ''; this.safety = e.safety ?? ''; this.duration = e.durationSeconds ?? 120;
    if (e.reps) { this.mode.set('reps'); this.reps = e.reps; }
    this.steps.set(e.steps.length ? [...e.steps] : ['']);
  }
  setStep(i: number, v: string) { this.steps.update(l => l.map((s, x) => x === i ? v : s)); }
  addStep() { this.steps.update(l => [...l, '']); }
  removeStep(i: number) { this.steps.update(l => l.length > 1 ? l.filter((_, x) => x !== i) : ['']); }
  move(i: number, d: number) { this.steps.update(l => { const c = [...l]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c; }); }

  save() {
    const name = this.name.trim();
    if (!name) { this.msg.set('Bitte einen Namen eingeben.'); return; }
    const steps = this.steps().map(s => s.trim()).filter(Boolean);
    const dur = Math.max(5, Math.round(+this.duration || 0)), reps = Math.max(1, Math.round(+this.reps || 0));
    const ex: Exercise = {
      id: this.editId() ?? this.es.newId(name), name, alt: this.alt.trim(), target: this.target.trim(), purpose: this.purpose.trim(), steps,
      ...(isExerciseType(this.type) && { type: this.type }),
      ...(this.note.trim() && { note: this.note.trim() }), ...(this.safety.trim() && { safety: this.safety.trim() }),
      durationSeconds: dur, ...(this.mode() === 'reps' && { reps }),
    };
    if (this.es.save(ex)) this.router.navigate(['/exercises']);
    else this.msg.set('Speichern nicht möglich (Speicher voll oder ungültige Daten).');
  }
}

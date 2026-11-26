import { AfterViewInit, Component, ElementRef, SecurityContext, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutService } from '../core/workout.service';
import { TrainingService } from '../core/training.service';
import { Workout, formatDuration, workoutSeconds } from '../core/models';
import { imageToDataUrl } from '../core/file-io';

@Component({
  selector: 'app-training-editor', standalone: true, imports: [FormsModule],
  template: `
    <section class="card">
      <h2>{{ id() ? 'Training bearbeiten' : 'Neues Training' }}</h2>
      <label>Name<input class="field" maxlength="80" [(ngModel)]="name" placeholder="z. B. Montag-Training"></label>

      <label>Beschreibung</label>
      <div class="rte-bar" (mousedown)="$event.preventDefault()">
        <button class="icon" (click)="cmd('bold')" aria-label="Fett" title="Fett"><b>B</b></button>
        <button class="icon" (click)="cmd('italic')" aria-label="Kursiv" title="Kursiv"><i>I</i></button>
        <button class="icon" (click)="cmd('underline')" aria-label="Unterstrichen" title="Unterstrichen"><u>U</u></button>
        <button class="icon" (click)="heading()" aria-label="Überschrift" title="Überschrift">H</button>
        <button class="icon" (click)="cmd('insertUnorderedList')" aria-label="Aufzählung" title="Aufzählung">•</button>
        <button class="icon" (click)="cmd('insertOrderedList')" aria-label="Nummerierung" title="Nummerierung">1.</button>
      </div>
      <div #ed class="rte" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Beschreibung des Trainings …"
           (input)="onInput()" (paste)="paste($event)"></div>

      <label>Funktionsbild</label>
      @if (image(); as img) {
        <img class="cover" [src]="img" alt="Vorschau">
        <div class="row" style="margin-top:0"><button class="btn secondary" (click)="pic.click()">Ersetzen</button>
          <button class="btn danger" (click)="image.set(undefined)">Entfernen</button></div>
      } @else { <div class="row" style="margin-top:.4rem"><button class="btn secondary" (click)="pic.click()">🖼 Bild hochladen</button></div> }
      <input #pic type="file" accept="image/*" hidden (change)="pickImage($event)">
    </section>

    <section class="card">
      <h3>Workouts im Training</h3>
      @for (id of workoutIds(); track $index) {
        <div class="item">
          <span class="nr">{{ $index + 1 }}</span>
          <span class="grow">{{ workout(id)?.name ?? 'Unbekanntes Workout' }}</span>
          <span class="badge">{{ fmt(sec(workout(id))) }}</span>
          <button class="icon" (click)="move($index, -1)" [disabled]="$first">↑</button>
          <button class="icon" (click)="move($index, 1)" [disabled]="$last">↓</button>
          <button class="icon" (click)="remove($index)">✕</button>
        </div>
      } @empty { <p class="muted">Noch kein Workout – unten hinzufügen.</p> }
      <div class="summary"><strong>Gesamtdauer:</strong> {{ fmt(total()) }} · {{ workoutIds().length }} Workouts</div>
    </section>

    <section class="card">
      <h3>Workouts hinzufügen</h3>
      @for (p of ps.workouts(); track p.id) {
        <div class="item"><span class="grow"><strong>{{ p.name }}</strong><br><small class="muted">{{ fmt(sec(p)) }}</small></span>
          <button class="btn secondary" (click)="add(p)">+ Hinzufügen</button></div>
      } @empty { <p class="muted">Es gibt noch keine Workouts. Lege zuerst ein Workout an.</p> }
    </section>

    @if (msg()) { <div class="note danger" role="alert">{{ msg() }}</div> }
    <div class="row sticky">
      <button class="btn primary" [disabled]="!name.trim() || !workoutIds().length" (click)="save()">💾 Speichern</button>
      <button class="btn secondary" (click)="router.navigate(['/trainings'])">Abbrechen</button>
    </div>`,
})
export class TrainingEditorComponent implements AfterViewInit {
  ps = inject(WorkoutService); router = inject(Router);
  private ts = inject(TrainingService); private route = inject(ActivatedRoute); private san = inject(DomSanitizer);
  fmt = formatDuration; sec = workoutSeconds;
  @ViewChild('ed') ed!: ElementRef<HTMLElement>;
  id = signal<string | undefined>(undefined);
  name = ''; private html = '';
  image = signal<string | undefined>(undefined);
  workoutIds = signal<string[]>([]);
  msg = signal('');
  total = computed(() => this.workoutIds().reduce((s, id) => s + workoutSeconds(this.ps.get(id)), 0));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const t = id ? this.ts.get(id) : undefined;
    if (t) { this.id.set(t.id); this.name = t.name; this.html = t.description; this.image.set(t.image); this.workoutIds.set([...t.workoutIds]); }
  }
  ngAfterViewInit() { // gespeichertes HTML nur bereinigt in den Editor übernehmen
    this.ed.nativeElement.innerHTML = this.san.sanitize(SecurityContext.HTML, this.html) ?? '';
  }
  workout(id: string): Workout | undefined { return this.ps.get(id); }

  cmd(c: string) { document.execCommand(c); }
  heading() { document.execCommand('formatBlock', false, document.queryCommandValue('formatBlock').toLowerCase() === 'h3' ? 'p' : 'h3'); }
  paste(e: ClipboardEvent) { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? ''); }
  onInput() { const el = this.ed.nativeElement; if (!el.textContent?.trim() && !el.querySelector('li')) el.innerHTML = ''; }

  async pickImage(ev: Event) {
    const input = ev.target as HTMLInputElement, f = input.files?.[0]; input.value = '';
    if (!f) return;
    try { this.image.set(await imageToDataUrl(f)); this.msg.set(''); } catch { this.msg.set('Das Bild konnte nicht gelesen werden.'); }
  }
  add(p: Workout) { this.workoutIds.update(l => [...l, p.id]); }
  remove(i: number) { this.workoutIds.update(l => l.filter((_, x) => x !== i)); }
  move(i: number, d: number) { this.workoutIds.update(l => { const c = [...l]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c; }); }

  save() {
    const ok = this.ts.save({ id: this.id() ?? this.ts.newId(), name: this.name.trim(), description: this.ed.nativeElement.innerHTML,
      workoutIds: this.workoutIds(), ...(this.image() ? { image: this.image() } : {}) });
    if (ok) this.router.navigate(['/trainings']);
    else this.msg.set('Speicher voll – bitte ein kleineres Bild wählen oder das Bild entfernen.');
  }
}

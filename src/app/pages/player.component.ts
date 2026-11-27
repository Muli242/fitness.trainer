import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { WorkoutService } from '../core/workout.service';
import { TrainingService } from '../core/training.service';
import { LastUsedService } from '../core/last-used.service';
import { ProgressService } from '../core/progress.service';
import { SoundService } from '../core/sound.service';
import { SettingsService } from '../core/settings.service';
import { Exercise, PAUSE_COLOR, Workout, colorOf, expandWorkout, formatDuration, isGroup } from '../core/models';

@Component({
  selector: 'app-player', standalone: true, imports: [RouterLink],
  template: `
    @if (workout(); as p) {
      <h2 class="center">{{ p.name }}</h2>
      @if (done()) {
        <div class="card center"><h2>🎉 Geschafft!</h2><p>{{ fmt(totalSec()) }} Training abgeschlossen.</p>
          @if (ctx) { <div class="row"><a class="btn primary" [routerLink]="['/trainings', ctx]">Zurück zum Training</a></div> }
          @else { <div class="row"><button class="btn primary" (click)="restart()">Nochmal</button><a class="btn secondary" routerLink="/workouts">Zur Auswahl</a></div> }</div>
      } @else {
        @if (current(); as c) {
          <div class="stats compact run-stats">
            <div class="stat-box"><span class="stat-label">Verstrichen</span><span class="stat-value">{{ hms(elapsed()) }}</span></div>
            <div class="stat-div"></div>
            <div class="stat-box wide"><span class="stat-label">Runde</span><span class="stat-value">{{ roundText() }}</span></div>
            <div class="stat-div"></div>
            <div class="stat-box"><span class="stat-label">Verbleibend</span><span class="stat-value">{{ hms(remaining()) }}</span></div>
          </div>
          <div class="player-grid">
            <div class="card timer panel" [class.hide-narrow]="view() !== 'timer'">
              <div class="dial">
                <svg viewBox="0 0 300 300" aria-hidden="true">
                  @for (sg of segs(); track $index) {
                    <circle cx="150" cy="150" [attr.r]="R2" fill="none" stroke-width="9" class="track"
                      [attr.stroke-dasharray]="sg.track" [attr.stroke-dashoffset]="sg.off" transform="rotate(-90 150 150)"/>
                    <circle cx="150" cy="150" [attr.r]="R2" fill="none" stroke-width="9" [attr.stroke]="sg.color"
                      [attr.stroke-dasharray]="sg.fill" [attr.stroke-dashoffset]="sg.off" transform="rotate(-90 150 150)"/>
                  }
                  <circle cx="150" cy="150" [attr.r]="R" fill="none" class="track" stroke-width="14"/>
                  <circle cx="150" cy="150" [attr.r]="R" fill="none" [attr.stroke]="c.color" stroke-width="14"
                    [attr.stroke-dasharray]="arcLen() + ' ' + C" transform="rotate(-90 150 150)"/>
                </svg>
                <div class="dial-center">
                  <div class="dc-top">{{ c.pause ? '💧' : '🏃' }}</div>
                  <div class="ex-name" [style.color]="c.color">{{ c.ex.name }}</div>
                  <div class="time">{{ mmss(left()) }}</div>
                </div>
              </div>
              <div class="next-line">@if (nextEx(); as n) { <span class="next-label">NEXT</span><span class="sw" [style.background]="n.color"></span><strong>{{ n.ex.name }}</strong> }</div>
            </div>
            <div class="card panel scroll" [class.hide-narrow]="view() === 'timer'">
              @for (r of rows(); track $index) {
                <div class="item" [class.current]="$index === idx()" [class.past]="$index < idx()">
                  @if ($index === idx()) { <div class="rowbar" [style.width.%]="frac() * 100" [style.background]="r.color"></div> }
                  <span class="nr">{{ $index + 1 }}</span><span class="sw" [style.background]="r.color"></span>
                  <span class="grow">{{ r.ex.name }}</span><span class="badge">{{ fmt(r.durationSeconds) }}</span>
                  <button class="info" (click)="pin(r.ex)" aria-label="Beschreibung anzeigen" title="Beschreibung anzeigen">ⓘ</button>
                </div>
              }
            </div>
          </div>
          <div class="controls">
            <button class="ib view-toggle" (click)="toggleView()" [attr.aria-label]="view() === 'timer' ? 'Übungsliste anzeigen' : 'Timer anzeigen'"
                    [title]="view() === 'timer' ? 'Übungsliste' : 'Timer'">
              @if (view() === 'timer') { <svg viewBox="0 0 24 24"><path d="M3 5h18v2H3zM3 11h18v2H3zM3 17h18v2H3z"/></svg> }
              @else { <svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3z"/></svg> }
            </button>
            <button class="ib" (click)="reset()" aria-label="Zurücksetzen" title="Zurücksetzen">
              <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg></button>
            @if (idx() > 0) {
              <button class="ib" (click)="prev()" aria-label="Zurück" title="Zurück">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
            }
            <button class="ib main" (click)="toggle()" [attr.aria-label]="(running() || cd() !== null) ? 'Pause' : 'Start'" [title]="(running() || cd() !== null) ? 'Pause' : 'Start'">
              @if (running() || cd() !== null) { <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg> }
              @else { <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> }
            </button>
            <button class="ib" (click)="next()" aria-label="Weiter" title="Weiter">
              <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          </div>
        }
      }
    } @else { <p class="center">Workout nicht gefunden. <a routerLink="/workouts">Zurück</a></p> }
    @if (popup(); as pu) {
      <div class="overlay" [class.pinned]="pu.pinned" (click)="popup.set(null)">
        <article class="card detail pop" (click)="$event.stopPropagation()">
          <h2>{{ pu.ex.name }} @if (pu.pinned) { <button class="icon" (click)="popup.set(null)">✕</button> }</h2>
          <p class="muted"><i>{{ pu.ex.type ? pu.ex.type + ' · ' : '' }}{{ pu.ex.target }}</i></p>
          <h3>Ziel &amp; Wirkung</h3><p>{{ pu.ex.purpose }}</p>
          @if (pu.ex.steps.length) {
            <h3>Ausführung</h3>
            <ol>@for (st of pu.ex.steps; track $index) { <li [innerHTML]="st"></li> }</ol>
          }
          @if (pu.ex.note) { <div class="note">{{ pu.ex.note }}</div> }
          @if (pu.ex.safety) { <div class="note danger">{{ pu.ex.safety }}</div> }
        </article>
      </div>
    }
    @if (cd() !== null) {
      <div class="countdown" (click)="cancelCountdown()" role="status" aria-live="polite">
        <div class="cd-hint">Gleich geht's los</div>
        @for (n of [cd()]; track n) { <div class="cd-num">{{ n }}</div> }
        <div class="cd-hint">Tippen zum Abbrechen</div>
      </div>
    }`,
})
export class PlayerComponent implements OnDestroy {
  private es = inject(ExerciseService); private ps = inject(WorkoutService);
  fmt = formatDuration;
  private route = inject(ActivatedRoute); private ts = inject(TrainingService); private last = inject(LastUsedService);
  private router = inject(Router); private progress = inject(ProgressService); private settings = inject(SettingsService);
  /** Training, aus dem gestartet wurde (Rücksprung + Erledigt-Markierung) */
  readonly ctx: string | undefined = this.route.snapshot.routeConfig?.path?.startsWith('trainings')
    ? this.route.snapshot.paramMap.get('id') ?? undefined : this.route.snapshot.queryParamMap.get('training') ?? undefined;
  workout = signal<Workout | undefined>(this.resolve());
  /** /workouts/:id/play = ein Workout, /trainings/:id/play = alle Workouts des Trainings hintereinander */
  private resolve(): Workout | undefined {
    const snap = this.route.snapshot, id = snap.paramMap.get('id') ?? '';
    if (snap.routeConfig?.path?.startsWith('trainings')) {
      const t = this.ts.get(id);
      return t && { id: t.id, name: t.name, description: t.description,
        items: t.workoutIds.flatMap((pid, i) => { const p = this.ps.get(pid); return p ? expandWorkout(p).map(it => ({ ...it, workoutIndex: i })) : []; }) };
    }
    const p = this.ps.get(id);
    if (!p) return undefined;
    const idx = Number(snap.queryParamMap.get('index')), items = expandWorkout(p);   // Runden/Gruppen aufgelöst
    const ctx = snap.queryParamMap.has('training') && snap.queryParamMap.has('index') && isFinite(idx);
    return { ...p, rounds: 1, items: ctx ? items.map(it => ({ ...it, workoutIndex: idx })) : items };
  }
  rows = computed(() => (this.workout()?.items ?? []).flatMap(e => {
    if (isGroup(e)) return [];
    if (e.pause) return [{ ...e, pause: true, ex: this.es.pause(), color: PAUSE_COLOR }];
    const ex = this.es.byId(e.exerciseId ?? '');
    return ex ? [{ ...e, pause: false, ex, color: colorOf(e) }] : [];
  }));
  totalSec = computed(() => this.rows().reduce((s, r) => s + r.durationSeconds, 0));
  idx = signal(0); ms = signal(0); running = signal(false); done = signal(false);
  left = computed(() => Math.ceil(this.ms() / 1000));
  current = computed(() => this.rows()[this.idx()]);
  /** nächste Übung (Pausen werden übersprungen) */
  nextEx = computed(() => this.rows().slice(this.idx() + 1).find(r => !r.pause));
  elapsed = computed(() => {
    const before = this.rows().slice(0, this.idx()).reduce((s, r) => s + r.durationSeconds, 0);
    return before + Math.max(0, (this.current()?.durationSeconds ?? 0) - this.left());
  });
  remaining = computed(() => Math.max(0, this.totalSec() - this.elapsed()));
  /** Übungsnummer/Anzahl ▪ Gruppe ▪ Runde */
  roundText = computed(() => [`${this.idx() + 1}/${this.rows().length}`, this.current()?.group, this.current()?.round].filter(Boolean).join(' ▪ '));
  /** Anteil (0..1) der aktuellen Einheit, der bereits abgelaufen ist */
  frac = computed(() => { const d = (this.current()?.durationSeconds ?? 0) * 1000; return d ? 1 - this.ms() / d : 1; });

  readonly R = 125; readonly C = 2 * Math.PI * 125; readonly R2 = 141; readonly C2 = 2 * Math.PI * 141;
  arcLen = computed(() => this.C * this.frac());
  /** Außenring: ein Segment je Einheit (Länge ∝ Dauer), füllt sich stetig */
  segs = computed(() => {
    const tot = this.totalSec() || 1, cur = this.idx(), f = this.frac(); let acc = 0;
    return this.rows().map((r, i) => {
      const start = acc / tot * this.C2; acc += r.durationSeconds;
      const len = Math.max(r.durationSeconds / tot * this.C2 - 5, 1), fl = len * (i < cur ? 1 : i === cur ? f : 0);
      return { color: r.color, off: -start, track: `${len} ${this.C2 - len}`, fill: `${fl} ${this.C2 - fl}` };
    });
  });

  view = signal<'timer' | 'list'>('timer');
  toggleView() { this.view.update(v => v === 'timer' ? 'list' : 'timer'); }
  popup = signal<{ ex: Exercise; pinned: boolean } | null>(null);
  pin(ex: Exercise) { this.popup.set({ ex, pinned: true }); }

  private end = 0; private t?: ReturnType<typeof setInterval>; private lock?: WakeLockSentinel;
  private onVis = () => { if (document.visibilityState === 'visible' && this.running()) { this.acquire(); this.tick(); } };

  constructor() { this.ms.set((this.current()?.durationSeconds ?? 0) * 1000); document.addEventListener('visibilitychange', this.onVis);
    // aktuelle Zeile in der Liste sichtbar halten
    effect(() => { this.idx(); this.view(); setTimeout(() => document.querySelector('.item.current')?.scrollIntoView({ block: 'nearest' })); });
  }

  hms(s: number) { return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${this.mmss(s % 3600)}`; }
  mmss(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  cd = signal<number | null>(null);   // laufender Start-Countdown
  private started = false; private cdTimer?: ReturnType<typeof setInterval>; private backTimer?: ReturnType<typeof setTimeout>;
  private snd = inject(SoundService);
  toggle() {
    this.snd.unlock();
    if (this.cd() !== null) { this.cancelCountdown(); return; }
    if (this.running()) { this.pause(); return; }
    const n = this.settings.countdown();
    if (n > 0 && !this.started) this.startCountdown(n); else this.start();
  }
  private startCountdown(n: number) {
    this.cd.set(n); this.snd.tick();
    this.cdTimer = setInterval(() => {
      n--;
      if (n <= 0) { this.cancelCountdown(); this.snd.play(); this.start(); }
      else { this.cd.set(n); this.snd.tick(); }
    }, 1000);
  }
  cancelCountdown() { clearInterval(this.cdTimer); this.cd.set(null); }
  private back() { if (this.ctx) this.router.navigate(['/trainings', this.ctx]); }
  private markWorkout(row?: { workoutIndex?: number }) { if (this.ctx && row?.workoutIndex !== undefined) this.progress.mark(this.ctx, row.workoutIndex); }
  private recorded = false;
  private record() {
    const p = this.workout();
    if (this.recorded || !p) return;
    this.recorded = true;
    this.last.set(this.route.snapshot.routeConfig?.path?.startsWith('trainings') ? 'training' : 'workout', p.id);
  }
  private start() {
    this.record(); this.started = true;
    this.running.set(true); this.end = Date.now() + this.ms();
    this.acquire(); clearInterval(this.t); this.t = setInterval(() => this.tick(), 100);
  }
  private pause() { this.running.set(false); clearInterval(this.t); this.release(); }
  private tick() {
    const ms = Math.max(0, this.end - Date.now());
    this.ms.set(ms);
    if (ms === 0) { this.snd.play(); this.next(true); }
  }
  prev() {
    if (this.idx() === 0) return;
    const was = this.running(); clearInterval(this.t);
    this.idx.update(i => i - 1); this.ms.set(this.current()!.durationSeconds * 1000);
    if (was) this.start(); else this.pause();
  }
  next(keepRunning = false) {
    clearInterval(this.t);
    const cur = this.current(), nxt = this.rows()[this.idx() + 1];
    if (!nxt) {
      this.markWorkout(cur);
      this.running.set(false); this.release(); this.ms.set(0); this.done.set(true);
      if (this.ctx) this.backTimer = setTimeout(() => this.back(), 2500);   // zurück in die Training-Ansicht
      return;
    }
    if (nxt.workoutIndex !== cur?.workoutIndex) this.markWorkout(cur);               // Workout abgeschlossen
    this.idx.update(i => i + 1); this.ms.set(this.current()!.durationSeconds * 1000);
    if (keepRunning) this.start(); else this.pause();
  }
  reset() { this.pause(); this.ms.set((this.current()?.durationSeconds ?? 0) * 1000); }
  restart() { this.started = false; this.done.set(false); this.idx.set(0); this.ms.set((this.current()?.durationSeconds ?? 0) * 1000); }

  private async acquire() { try { this.lock = await navigator.wakeLock?.request('screen'); } catch { /* nicht unterstützt */ } }
  private release() { this.lock?.release().catch(() => {}); this.lock = undefined; }
  ngOnDestroy() { clearInterval(this.t); clearInterval(this.cdTimer); clearTimeout(this.backTimer); this.release(); document.removeEventListener('visibilitychange', this.onVis); }
}

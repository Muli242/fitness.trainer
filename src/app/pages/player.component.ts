import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { PlanService } from '../core/plan.service';
import { TrainingService } from '../core/training.service';
import { LastUsedService } from '../core/last-used.service';
import { ProgressService } from '../core/progress.service';
import { SettingsService } from '../core/settings.service';
import { Exercise, PAUSE_COLOR, TrainingPlan, colorOf, expandPlan, formatDuration, isGroup } from '../core/models';

@Component({
  selector: 'app-player', standalone: true, imports: [RouterLink],
  template: `
    @if (plan(); as p) {
      <h2 class="center">{{ p.name }}</h2>
      @if (done()) {
        <div class="card center"><h2>🎉 Geschafft!</h2><p>{{ fmt(totalSec()) }} Training abgeschlossen.</p>
          @if (ctx) { <div class="row"><a class="btn primary" [routerLink]="['/trainings', ctx]">Zurück zum Training</a></div> }
          @else { <div class="row"><button class="btn primary" (click)="restart()">Nochmal</button><a class="btn secondary" routerLink="/plans">Zur Auswahl</a></div> }</div>
      } @else {
        @if (current(); as c) {
          @if (view() === 'timer') {
            <div class="card timer panel">
              <div class="upnext">
                <div class="up">@if (nx(); as n) { <span class="sw" [style.background]="n.color"></span> Als Nächstes: <strong>{{ n.ex.name }}</strong> }</div>
                <div class="up">@if (nn(); as n) { <span class="sw" [style.background]="n.color"></span> Danach: <strong>{{ n.ex.name }}</strong> }</div>
              </div>
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
                  <div class="ico">{{ c.pause ? '💧' : '🏃' }}</div>
                  <div class="ex-name" [style.color]="c.color">{{ c.ex.name }}</div>
                  <div class="time">{{ mmss(left()) }}</div>
                  <div class="muted small">{{ idx() + 1 }} / {{ rows().length }}</div>
                  @if (c.info) { <div class="muted small">{{ c.info }}</div> }
                </div>
              </div>
            </div>
          } @else {
            <div class="card panel scroll">
              @for (r of rows(); track $index) {
                <div class="item" [class.current]="$index === idx()" [class.past]="$index < idx()">
                  @if ($index === idx()) { <div class="rowbar" [style.width.%]="frac() * 100" [style.background]="r.color"></div> }
                  <span class="nr">{{ $index + 1 }}</span><span class="sw" [style.background]="r.color"></span>
                  <span class="grow">{{ r.ex.name }}</span><span class="badge">{{ fmt(r.durationSeconds) }}</span>
                  <button class="info" (click)="pin(r.ex)" aria-label="Beschreibung anzeigen" title="Beschreibung anzeigen">ⓘ</button>
                </div>
              }
              @for (e of filler(); track $index) { <div class="item empty"></div> }
            </div>
          }
          <div class="controls">
            <button class="ib" (click)="toggleView()" [attr.aria-label]="view() === 'timer' ? 'Übungsliste anzeigen' : 'Timer anzeigen'"
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
    } @else { <p class="center">Plan nicht gefunden. <a routerLink="/plans">Zurück</a></p> }
    @if (popup(); as pu) {
      <div class="overlay" [class.pinned]="pu.pinned" (click)="popup.set(null)">
        <article class="card detail pop" (click)="$event.stopPropagation()">
          <h2>{{ pu.ex.name }} @if (pu.pinned) { <button class="icon" (click)="popup.set(null)">✕</button> }</h2>
          <p class="muted"><i>{{ pu.ex.type ? pu.ex.type + ' · ' : '' }}{{ pu.ex.target }}</i></p>
          <h3>Ziel &amp; Wirkung</h3><p>{{ pu.ex.purpose }}</p>
          <h3>Ausführung</h3>
          <ol>@for (st of pu.ex.steps; track $index) { <li [innerHTML]="st"></li> }</ol>
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
  private es = inject(ExerciseService); private ps = inject(PlanService);
  fmt = formatDuration;
  private route = inject(ActivatedRoute); private ts = inject(TrainingService); private last = inject(LastUsedService);
  private router = inject(Router); private progress = inject(ProgressService); private settings = inject(SettingsService);
  /** Training, aus dem gestartet wurde (Rücksprung + Erledigt-Markierung) */
  readonly ctx: string | undefined = this.route.snapshot.routeConfig?.path?.startsWith('trainings')
    ? this.route.snapshot.paramMap.get('id') ?? undefined : this.route.snapshot.queryParamMap.get('training') ?? undefined;
  plan = signal<TrainingPlan | undefined>(this.resolve());
  /** /plans/:id/play = ein Plan, /trainings/:id/play = alle Pläne des Trainings hintereinander */
  private resolve(): TrainingPlan | undefined {
    const snap = this.route.snapshot, id = snap.paramMap.get('id') ?? '';
    if (snap.routeConfig?.path?.startsWith('trainings')) {
      const t = this.ts.get(id);
      return t && { id: t.id, name: t.name, description: t.description,
        items: t.planIds.flatMap((pid, i) => { const p = this.ps.get(pid); return p ? expandPlan(p).map(it => ({ ...it, planIndex: i })) : []; }) };
    }
    const p = this.ps.get(id);
    if (!p) return undefined;
    const idx = Number(snap.queryParamMap.get('index')), items = expandPlan(p);   // Runden/Gruppen aufgelöst
    const ctx = snap.queryParamMap.has('training') && snap.queryParamMap.has('index') && isFinite(idx);
    return { ...p, rounds: 1, items: ctx ? items.map(it => ({ ...it, planIndex: idx })) : items };
  }
  rows = computed(() => (this.plan()?.items ?? []).flatMap(e => {
    if (isGroup(e)) return [];
    if (e.pause) return [{ ...e, pause: true, ex: this.es.pause(), color: PAUSE_COLOR }];
    const ex = this.es.byId(e.exerciseId ?? '');
    return ex ? [{ ...e, pause: false, ex, color: colorOf(e) }] : [];
  }));
  totalSec = computed(() => this.rows().reduce((s, r) => s + r.durationSeconds, 0));
  idx = signal(0); ms = signal(0); running = signal(false); done = signal(false);
  left = computed(() => Math.ceil(this.ms() / 1000));
  current = computed(() => this.rows()[this.idx()]);
  nx = computed(() => this.rows()[this.idx() + 1]);
  nn = computed(() => this.rows()[this.idx() + 2]);
  /** Leerzeilen, damit die Liste immer 12 Zeilen hoch ist */
  filler = computed(() => Array.from({ length: Math.max(0, 12 - this.rows().length) }));
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

  mmss(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  cd = signal<number | null>(null);   // laufender Start-Countdown
  private started = false; private cdTimer?: ReturnType<typeof setInterval>; private backTimer?: ReturnType<typeof setTimeout>;
  private ac?: AudioContext;
  /** gemeinsamer AudioContext, wird per Tipp-Geste freigeschaltet (nötig u. a. auf iOS) */
  private audio(): AudioContext | undefined {
    try { this.ac ??= new AudioContext(); if (this.ac.state === 'suspended') void this.ac.resume(); return this.ac; } catch { return undefined; }
  }
  toggle() {
    this.audio();
    if (this.cd() !== null) { this.cancelCountdown(); return; }
    if (this.running()) { this.pause(); return; }
    const n = this.settings.countdown();
    if (n > 0 && !this.started) this.startCountdown(n); else this.start();
  }
  private startCountdown(n: number) {
    this.cd.set(n); this.beep(660, 0.15);
    this.cdTimer = setInterval(() => {
      n--;
      if (n <= 0) { this.cancelCountdown(); this.beep(1100, 0.5); this.start(); }
      else { this.cd.set(n); this.beep(660, 0.15); }
    }, 1000);
  }
  cancelCountdown() { clearInterval(this.cdTimer); this.cd.set(null); }
  private back() { if (this.ctx) this.router.navigate(['/trainings', this.ctx]); }
  private markPlan(row?: { planIndex?: number }) { if (this.ctx && row?.planIndex !== undefined) this.progress.mark(this.ctx, row.planIndex); }
  private recorded = false;
  private record() {
    const p = this.plan();
    if (this.recorded || !p) return;
    this.recorded = true;
    this.last.set(this.route.snapshot.routeConfig?.path?.startsWith('trainings') ? 'training' : 'plan', p.id);
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
    if (ms === 0) { this.beep(); this.next(true); }
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
      this.markPlan(cur);
      this.running.set(false); this.release(); this.ms.set(0); this.done.set(true);
      if (this.ctx) this.backTimer = setTimeout(() => this.back(), 2500);   // zurück in die Training-Ansicht
      return;
    }
    if (nxt.planIndex !== cur?.planIndex) this.markPlan(cur);               // Plan abgeschlossen
    this.idx.update(i => i + 1); this.ms.set(this.current()!.durationSeconds * 1000);
    if (keepRunning) this.start(); else this.pause();
  }
  reset() { this.pause(); this.ms.set((this.current()?.durationSeconds ?? 0) * 1000); }
  restart() { this.started = false; this.done.set(false); this.idx.set(0); this.ms.set((this.current()?.durationSeconds ?? 0) * 1000); }

  private async acquire() { try { this.lock = await navigator.wakeLock?.request('screen'); } catch { /* nicht unterstützt */ } }
  private release() { this.lock?.release().catch(() => {}); this.lock = undefined; }
  private beep(freq = 880, dur = 0.8) {
    const c = this.audio();
    if (c) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = freq; g.gain.setValueAtTime(0.3, c.currentTime); g.gain.exponentialRampToValueAtTime(0.00001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
    }
    navigator.vibrate?.(dur > 0.3 ? 300 : 30);
  }
  ngOnDestroy() { clearInterval(this.t); clearInterval(this.cdTimer); clearTimeout(this.backTimer); void this.ac?.close(); this.release(); document.removeEventListener('visibilitychange', this.onVis); }
}

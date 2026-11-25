import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlanService } from '../core/plan.service';
import { ProgressService } from '../core/progress.service';
import { TrainingService } from '../core/training.service';
import { formatDuration, planSeconds } from '../core/models';

@Component({
  selector: 'app-training-detail', standalone: true, imports: [RouterLink],
  template: `
    @if (tr(); as t) {
      <article class="card">
        @if (t.image) { <img class="cover" [src]="t.image" alt=""> }
        <h2>{{ t.name }}</h2>
        <div class="stats compact">
          <div class="stat-box"><span class="stat-label">Dauer</span><span class="stat-value">{{ fmt(total()) }}</span></div>
          <div class="stat-div"></div>
          <div class="stat-box"><span class="stat-label">Pläne</span><span class="stat-value">{{ entries().length }}</span></div>
        </div>
        @if (t.description) { <div class="rich" [innerHTML]="t.description"></div> }

        <h3>Trainingspläne <span class="progress-info">{{ doneCount() }} / {{ entries().length }} erledigt</span></h3>
        @for (e of entries(); track e.i) {
          <div class="item" [class.done]="doneSet().has(e.i)">
            @if (doneSet().has(e.i)) { <span class="nr check" aria-label="erledigt">✓</span> } @else { <span class="nr">{{ $index + 1 }}</span> }
            <span class="grow">{{ e.p.name }}</span>
            <span class="badge">{{ fmt(sec(e.p)) }}</span>
            <a class="icon" [routerLink]="['/plans', e.p.id, 'play']" [queryParams]="{ training: t.id, index: e.i }"
               aria-label="Plan einzeln starten" title="Plan einzeln starten">▶</a>
          </div>
        }
        @if (doneCount()) { <div class="row" style="margin-top:.5rem"><button class="linkbtn" (click)="progress.reset(t.id)">Markierungen zurücksetzen</button></div> }
        <div class="row"><a class="btn primary" [routerLink]="['/trainings', t.id, 'play']" (click)="progress.reset(t.id)">▶ Training starten</a></div>
      </article>
    } @else { <p class="center">Training nicht gefunden. <a routerLink="/trainings">Zurück</a></p> }`,
})
export class TrainingDetailComponent {
  private ps = inject(PlanService); private ts = inject(TrainingService); progress = inject(ProgressService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  fmt = formatDuration; sec = planSeconds;
  tr = computed(() => this.ts.get(this.id));
  /** Pläne mit ihrer Position (i) im Training; gelöschte Pläne werden übersprungen */
  entries = computed(() => (this.tr()?.planIds ?? []).flatMap((pid, i) => { const p = this.ps.get(pid); return p ? [{ p, i }] : []; }));
  total = computed(() => this.entries().reduce((s, e) => s + planSeconds(e.p), 0));
  doneSet = computed(() => new Set(this.progress.done(this.id)));
  doneCount = computed(() => this.entries().filter(e => this.doneSet().has(e.i)).length);
}

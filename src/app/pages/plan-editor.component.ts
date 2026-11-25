import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExerciseService } from '../core/exercise.service';
import { PlanService } from '../core/plan.service';
import { Exercise, PlanEntry, PlanGroup, PlanItem, clampRounds, colorEntries, colorOf, expandEntries, formatDuration, isGroup } from '../core/models';

@Component({
  selector: 'app-plan-editor', standalone: true, imports: [FormsModule],
  template: `
    <section class="card pe-head">
      <h2>{{ id() ? 'Trainingsplan bearbeiten' : 'Neuer Trainingsplan' }}</h2>
      <label>Name<input class="field" [(ngModel)]="name" placeholder="z. B. Morgen-Mobility"></label>
      <label>Beschreibung<textarea class="field" rows="2" [(ngModel)]="description"></textarea></label>
      <label>Runden (Durchläufe der gesamten Übungsfolge)
        <input class="field" type="number" min="1" max="20" step="1" [ngModel]="rounds()" (ngModelChange)="rounds.set(clamp($event))"></label>
      <div class="summary"><strong>Gesamtdauer:</strong> {{ fmt(total()) }} · {{ exCount() }} Übungen je Runde
        @if (rounds() > 1) { · {{ rounds() }} Runden }</div>
    </section>

    <section class="card pe-flow">
      <h3>Ablauf</h3>
      @for (e of colored(); track $index; let i = $index) {
        @if (grp(e); as g) {
          <div class="group">
            <div class="item group-head"><div class="gline">
              <button class="icon" (click)="toggleCollapse(g)" [attr.aria-expanded]="!isCollapsed(g)" [attr.aria-label]="isCollapsed(g) ? 'Gruppe ausklappen' : 'Gruppe einklappen'">{{ isCollapsed(g) ? '▸' : '▾' }}</button>
              <input class="search-bar gname" maxlength="40" placeholder="Gruppenname (z. B. Zirkel A)" [ngModel]="g.name" (ngModelChange)="setGroup(i, { name: $event })">
              <button class="icon" (click)="move(i, -1)" [disabled]="i === 0" aria-label="Gruppe nach oben">↑</button>
              <button class="icon" (click)="move(i, 1)" [disabled]="i === entries().length - 1" aria-label="Gruppe nach unten">↓</button>
            </div></div>
            @if (isCollapsed(g)) {
              <div class="muted small" style="padding:0 .25rem .4rem">{{ g.items.length }} Einträge · {{ g.rounds }}× · {{ fmt(groupSec(g)) }}</div>
            } @else {
              <div class="item edit"><span class="muted grow">Wiederholungen der Gruppe</span>
                <input class="dur" type="number" min="1" max="20" [ngModel]="g.rounds" (ngModelChange)="setGroup(i, { rounds: clamp($event) })">
                <button class="btn secondary" (click)="duplicate(i)">⧉ Duplizieren</button>
                <button class="btn secondary" (click)="ungroup(i)">Auflösen</button></div>
              @for (it of g.items; track $index; let j = $index) {
                <div class="item sub">
                  <span class="sw" [style.background]="col(it)"></span>
                  <span class="grow">{{ label(it) }}</span>
                  <input class="dur" type="number" min="5" step="5" [ngModel]="it.durationSeconds" (ngModelChange)="setDur(i, j, $event)"> s
                  <button class="icon" (click)="moveIn(i, j, -1)" [disabled]="j === 0">↑</button>
                  <button class="icon" (click)="moveIn(i, j, 1)" [disabled]="j === g.items.length - 1">↓</button>
                  <button class="icon" (click)="removeIn(i, j)">✕</button>
                </div>
              }
            }
          </div>
        } @else {
          <div class="item">
            <input type="checkbox" [checked]="sel().has(i)" (change)="toggle(i)" aria-label="Für Gruppe auswählen">
            <span class="sw" [style.background]="col(leaf(e))"></span>
            <span class="grow">{{ label(leaf(e)) }}</span>
            <input class="dur" type="number" min="5" step="5" [ngModel]="leaf(e).durationSeconds" (ngModelChange)="setDur(i, -1, $event)"> s
            <button class="icon" (click)="move(i, -1)" [disabled]="i === 0">↑</button>
            <button class="icon" (click)="move(i, 1)" [disabled]="i === entries().length - 1">↓</button>
            <button class="icon" (click)="remove(i)">✕</button>
          </div>
        }
      } @empty { <p class="muted">Noch keine Übungen – unten hinzufügen.</p> }
      <div class="row">
        <button class="btn secondary" (click)="addPause()">⏸ Pause einfügen</button>
        <button class="btn secondary" (click)="groupSel()" [disabled]="sel().size < 1">▣ Auswahl gruppieren ({{ sel().size }})</button>
      </div>
      <p class="muted small" style="text-align:center;margin-top:.5rem">Einzelne Einträge per Häkchen auswählen und zu einer Gruppe zusammenfassen. Eine Gruppe lässt sich mehrfach wiederholen.</p>
    </section>

    <section class="card pe-add">
      <h3>Übungen hinzufügen</h3>
      <input class="search-bar" type="search" placeholder="Suchen…" [ngModel]="q()" (ngModelChange)="q.set($event)">
      @for (ex of filtered(); track ex.id) {
        <div class="item"><span class="grow"><strong>{{ ex.name }}</strong><br><small class="muted">{{ ex.type ? ex.type + ' · ' : '' }}{{ ex.target }}</small></span>
          <button class="btn secondary" (click)="add(ex)">+ Hinzufügen</button></div>
      }
    </section>

    <div class="row sticky">
      <button class="btn primary" [disabled]="!name.trim() || !entries().length" (click)="save()">💾 Speichern</button>
      <button class="btn secondary" (click)="router.navigate(['/plans'])">Abbrechen</button>
    </div>`,
})
export class PlanEditorComponent {
  es = inject(ExerciseService); private ps = inject(PlanService); router = inject(Router); private route = inject(ActivatedRoute);
  fmt = formatDuration; clamp = clampRounds;
  id = signal<string | undefined>(undefined);
  name = ''; description = '';
  entries = signal<PlanEntry[]>([]);
  rounds = signal(1);
  sel = signal<Set<number>>(new Set());
  q = signal('');
  filtered = computed(() => this.es.search(this.q()));
  colored = computed(() => colorEntries(this.entries()));
  total = computed(() => expandEntries(this.entries(), this.rounds()).reduce((s, i) => s + (i.durationSeconds || 0), 0));
  exCount = computed(() => expandEntries(this.entries(), 1).filter(i => !i.pause).length);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const p = id ? this.ps.get(id) : undefined;
    if (p) {
      this.id.set(p.id); this.name = p.name; this.description = p.description; this.rounds.set(clampRounds(p.rounds ?? 1));
      this.entries.set(p.items.map(e => isGroup(e) ? { ...e, id: e.id ?? this.gid(), items: e.items.map(i => ({ ...i })) } : { ...e }));
    }
  }
  collapsed = signal<Set<string>>(new Set());
  isCollapsed(g: PlanGroup) { return !!g.id && this.collapsed().has(g.id); }
  toggleCollapse(g: PlanGroup) { if (!g.id) return; this.collapsed.update(s => { const n = new Set(s); n.has(g.id!) ? n.delete(g.id!) : n.add(g.id!); return n; }); }
  groupSec(g: PlanGroup) { return g.items.reduce((s, i) => s + i.durationSeconds, 0) * g.rounds; }
  private gid() { return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2); }
  /** Gruppe samt Übungen direkt dahinter duplizieren */
  duplicate(i: number) {
    this.edit(l => { const g = l[i] as PlanGroup;
      l.splice(i + 1, 0, { ...g, id: this.gid(), name: g.name ? `${g.name} (Kopie)`.slice(0, 40) : '', items: g.items.map(it => ({ ...it })) }); return l; });
  }
  grp(e: PlanEntry): PlanGroup | null { return isGroup(e) ? e : null; }
  leaf(e: PlanEntry): PlanItem { return e as PlanItem; }
  col(i: PlanItem) { return colorOf(i); }
  label(i: PlanItem) { return i.pause ? '⏸ Pause' : (this.es.byId(i.exerciseId!)?.name ?? 'Unbekannte Übung'); }

  private edit(f: (l: PlanEntry[]) => PlanEntry[]) { this.entries.update(l => f([...l])); this.sel.set(new Set()); }
  add(e: Exercise) { this.entries.update(l => [...l, { exerciseId: e.id, durationSeconds: e.durationSeconds ?? 120 }]); }
  addPause() { this.entries.update(l => [...l, { pause: true, durationSeconds: this.es.pause().durationSeconds ?? 30 }]); }
  remove(i: number) { this.edit(l => l.filter((_, x) => x !== i)); }
  move(i: number, d: number) { this.edit(l => { [l[i], l[i + d]] = [l[i + d], l[i]]; return l; }); }
  setDur(i: number, j: number, v: number) {
    const d = Math.max(0, Math.round(+v || 0));
    this.entries.update(l => l.map((e, x) => x !== i ? e : j < 0 ? { ...(e as PlanItem), durationSeconds: d }
      : { ...(e as PlanGroup), items: (e as PlanGroup).items.map((it, y) => y === j ? { ...it, durationSeconds: d } : it) }));
  }
  setGroup(i: number, patch: Partial<PlanGroup>) { this.entries.update(l => l.map((e, x) => x === i ? { ...(e as PlanGroup), ...patch } : e)); }
  moveIn(i: number, j: number, d: number) {
    this.entries.update(l => l.map((e, x) => { if (x !== i) return e; const it = [...(e as PlanGroup).items]; [it[j], it[j + d]] = [it[j + d], it[j]]; return { ...(e as PlanGroup), items: it }; }));
  }
  removeIn(i: number, j: number) {   // letzte Übung entfernt = Gruppe verschwindet
    this.edit(l => l.flatMap((e, x) => { if (x !== i) return [e]; const it = (e as PlanGroup).items.filter((_, y) => y !== j); return it.length ? [{ ...(e as PlanGroup), items: it }] : []; }));
  }
  toggle(i: number) { this.sel.update(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; }); }
  /** Ausgewählte Einzeleinträge → eine Gruppe an der Position des ersten Eintrags */
  groupSel() {
    const s = this.sel(), idx = [...s].sort((a, b) => a - b);
    if (!idx.length) return;
    this.edit(l => {
      const items = idx.map(i => l[i] as PlanItem), n = idx.length;
      const g: PlanGroup = { id: this.gid(), name: `Gruppe ${l.filter(isGroup).length + 1}`, rounds: 1, items };
      return l.flatMap((e, i) => i === idx[0] ? [g] : s.has(i) ? [] : [e]).slice(0, l.length - n + 1);
    });
  }
  ungroup(i: number) { this.edit(l => l.flatMap((e, x) => x === i ? (e as PlanGroup).items : [e])); }

  save() {
    this.ps.save({ id: this.id() ?? this.ps.newId(), name: this.name.trim(), description: this.description.trim(), items: this.entries(), rounds: this.rounds() });
    this.router.navigate(['/plans']);
  }
}

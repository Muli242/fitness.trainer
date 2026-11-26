/** Konstante Liste der Übungstypen */
export const EXERCISE_TYPES = ['Kraft', 'Ausdauer', 'Schnelligkeit', 'Beweglichkeit', 'Koordination', 'Mobilisierung', 'Entspannung'] as const;
export type ExerciseType = typeof EXERCISE_TYPES[number];
export const isExerciseType = (v: unknown): v is ExerciseType => (EXERCISE_TYPES as readonly unknown[]).includes(v);

export interface Exercise {
  id: string;
  name: string;
  type?: ExerciseType;
  alt: string;              // Synonyme / Formen
  target: string;           // Zielbereich
  purpose: string;          // Ziel & Wirkung
  steps: string[];          // Ausführung (darf <strong> enthalten)
  note?: string;
  safety?: string;
  durationSeconds?: number; // Dauer ...
  reps?: number;            // ... oder Wiederholungen
}
export interface WorkoutItem {
  exerciseId?: string; pause?: boolean; durationSeconds: number;
  // nur zur Laufzeit (nicht gespeichert):
  workoutIndex?: number;   // Position des Workouts im Training
  colorIndex?: number;  // Farbe der Übung (gleich in allen Runden)
  info?: string;        // z. B. "Runde 2/3 · Zirkel A 1/2"
}
/** Gruppe von Übungen mit eigener Rundenzahl (Standard 1 = reine Zusammenfassung) */
export interface WorkoutGroup { id?: string; name: string; rounds: number; items: WorkoutItem[]; }
export type WorkoutEntry = WorkoutItem | WorkoutGroup;
export const PALETTE = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899', '#06b6d4'];
export const PAUSE_COLOR = '#2dd4bf';
/** Farbe je Workout-Eintrag: Übungen reihum aus der Palette, Pausen fest türkis. */
export function itemColors(items: WorkoutItem[]): string[] {
  let k = 0;
  return items.map(i => i.pause ? PAUSE_COLOR : PALETTE[k++ % PALETTE.length]);
}
export interface Workout { id: string; name: string; description: string; items: WorkoutEntry[]; rounds?: number; }

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}:${String(s).padStart(2, '0')} Min` : `${m} Min`;
}

export interface Training { id: string; name: string; description: string; image?: string; workoutIds: string[]; }
export const isGroup = (e: WorkoutEntry): e is WorkoutGroup => 'items' in e;
export const clampRounds = (n: unknown) => Math.min(20, Math.max(1, Math.round(Number(n)) || 1));
export const colorOf = (i: WorkoutItem) => i.pause ? PAUSE_COLOR : PALETTE[(i.colorIndex ?? 0) % PALETTE.length];

/** Vergibt je Übung (nicht Pause) einen Farbindex in Workout-Reihenfolge */
export function colorEntries(entries: WorkoutEntry[]): WorkoutEntry[] {
  let k = 0;
  const c = (i: WorkoutItem): WorkoutItem => i.pause ? i : { ...i, colorIndex: k++ };
  return entries.map(e => isGroup(e) ? { ...e, items: e.items.map(c) } : c(e));
}
/** Löst Gruppen- und Workout-Runden zu einer flachen Ablaufliste auf */
export function expandEntries(entries: WorkoutEntry[], rounds = 1): WorkoutItem[] {
  const R = clampRounds(rounds), colored = colorEntries(entries), out: WorkoutItem[] = [];
  for (let r = 0; r < R; r++) {
    const round = R > 1 ? `Runde ${r + 1}/${R}` : '';
    for (const e of colored) {
      if (!isGroup(e)) { out.push({ ...e, info: round || undefined }); continue; }
      const G = clampRounds(e.rounds);
      for (let g = 0; g < G; g++) {
        const info = [round, e.name ? (G > 1 ? `${e.name} ${g + 1}/${G}` : e.name) : ''].filter(Boolean).join(' · ');
        for (const it of e.items) out.push({ ...it, info: info || undefined });
      }
    }
  }
  return out;
}
export const expandWorkout = (p: Workout) => expandEntries(p.items, p.rounds ?? 1);
export const workoutSeconds = (p?: Workout) => p ? expandWorkout(p).reduce((s, i) => s + i.durationSeconds, 0) : 0;
/** Kennzahlen je Runde (Gruppen-Wiederholungen eingerechnet) */
export function workoutCounts(p: Workout) {
  const one = expandEntries(p.items, 1);
  return { exercises: one.filter(i => !i.pause).length, pauses: one.filter(i => i.pause).length, rounds: clampRounds(p.rounds ?? 1) };
}

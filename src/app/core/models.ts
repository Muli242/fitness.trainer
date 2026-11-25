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
export interface PlanItem { exerciseId?: string; pause?: boolean; durationSeconds: number; planIndex?: number /* nur zur Laufzeit: Position des Plans im Training */; }
export const PALETTE = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899', '#06b6d4'];
export const PAUSE_COLOR = '#2dd4bf';
/** Farbe je Plan-Eintrag: Übungen reihum aus der Palette, Pausen fest türkis. */
export function itemColors(items: PlanItem[]): string[] {
  let k = 0;
  return items.map(i => i.pause ? PAUSE_COLOR : PALETTE[k++ % PALETTE.length]);
}
export interface TrainingPlan { id: string; name: string; description: string; items: PlanItem[]; }

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60;
  return s ? `${m}:${String(s).padStart(2, '0')} Min` : `${m} Min`;
}

export interface Training { id: string; name: string; description: string; image?: string; planIds: string[]; }
export const planSeconds = (p?: TrainingPlan) => p ? p.items.reduce((s, i) => s + i.durationSeconds, 0) : 0;

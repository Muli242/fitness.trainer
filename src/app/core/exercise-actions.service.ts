import { Injectable, inject } from '@angular/core';
import { ExerciseService } from './exercise.service';
import { WorkoutService } from './workout.service';
import { Exercise, isGroup } from './models';

/** Löschen bzw. Wiederherstellen einer Übung inkl. Rückfrage (von Liste und Detailansicht genutzt) */
@Injectable({ providedIn: 'root' })
export class ExerciseActions {
  private es = inject(ExerciseService); private ws = inject(WorkoutService);
  /** Eigene bzw. überschriebene Übungen lassen sich löschen; mitgelieferte nicht */
  canRemove(ex: Exercise) { return this.es.isCustom(ex.id); }
  removeLabel(ex: Exercise) { return this.es.inBase(ex.id) ? 'Original wiederherstellen' : 'Löschen'; }
  /** true = wirklich gelöscht bzw. zurückgesetzt */
  remove(ex: Exercise): boolean {
    const restore = this.es.inBase(ex.id);
    const used = this.ws.workouts().filter(p => p.items.some(e => isGroup(e) ? e.items.some(i => i.exerciseId === ex.id) : e.exerciseId === ex.id)).length;
    const text = restore ? `Eigene Änderungen an „${ex.name}“ verwerfen und das Original wiederherstellen?`
      : `„${ex.name}“ wirklich löschen?` + (used ? `\nSie wird in ${used} Workout(s) verwendet und fehlt dort danach.` : '');
    if (!confirm(text)) return false;
    this.es.remove(ex.id); return true;
  }
}

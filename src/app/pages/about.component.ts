import { Component } from '@angular/core';
import { APP_VERSION } from '../core/app-info';

@Component({
  selector: 'app-about', standalone: true,
  template: `
    <section class="card">
      <h2>About</h2>
      <div class="stats compact"><div class="stat-box"><span class="stat-label">Version</span><span class="stat-value">{{ version }}</span></div></div>
      <h3>Worum geht's?</h3>
      <p>Fitness Trainer führt dich Schritt für Schritt durch dein Training – mit Timer, Countdown und Pausen.</p>
      <h3>So ist es aufgebaut</h3>
      <ul>
        <li><strong>Training</strong> fasst ein oder mehrere Workouts zusammen.</li>
        <li><strong>Workout</strong> ist eine Folge von Übungen und Pausen, auch in Gruppen mit Runden.</li>
        <li><strong>Übung</strong> beschreibt Ziel, Wirkung und Ausführung.</li>
      </ul>
      <p class="muted">Alle Daten liegen nur auf diesem Gerät. Über „Daten“ kannst du sie sichern und auf andere Geräte übertragen.</p>
    </section>`,
})
export class AboutComponent { version = APP_VERSION; }

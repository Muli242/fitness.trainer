import { Component, inject } from '@angular/core';
import { SettingsService } from '../core/settings.service';
import { ThemeService } from '../core/theme.service';
import { StorageService } from '../core/storage.service';
import { SOUNDS, SoundService } from '../core/sound.service';

@Component({
  selector: 'app-settings', standalone: true,
  template: `
    <section class="card">
      <h2>Settings</h2>
      <h3>Start-Countdown</h3>
      <select id="cd" class="search-bar" aria-label="Start-Countdown" (change)="settings.setCountdown(+$any($event.target).value)">
        <option value="0" [selected]="settings.countdown() === 0">Aus</option>
        @for (n of secs; track n) { <option [value]="n" [selected]="settings.countdown() === n">{{ n }} Sekunde{{ n > 1 ? 'n' : '' }}</option> }
      </select>
      <p class="muted">Countdown mit Piepton vor dem Start eines Workouts.</p>

      <h3>Signalton</h3>
      <div class="sound-row">
        <select class="search-bar" aria-label="Signalton" (change)="snd.set($any($event.target).value)">
          @for (s of sounds; track s.id) { <option [value]="s.id" [selected]="snd.sound() === s.id">{{ s.name }}</option> }
        </select>
        <button class="btn secondary" (click)="snd.play()" aria-label="Probehören" title="Probehören">▶</button>
      </div>
      <label class="row check-row"><input type="checkbox" [checked]="snd.vibration()" (change)="snd.setVibration($any($event.target).checked)"> Zusätzlich vibrieren</label>
      <p class="muted">Ertönt beim Start und am Ende jeder Einheit. Die Töne werden in der App erzeugt – keine Fremddateien, keine Lizenzfragen.</p>

      <h3>Design</h3>
      <div class="row">
        <button class="btn" [class.primary]="theme.theme() === 'dark'" [class.secondary]="theme.theme() !== 'dark'" (click)="theme.theme.set('dark')">☾ Dunkel</button>
        <button class="btn" [class.primary]="theme.theme() === 'light'" [class.secondary]="theme.theme() !== 'light'" (click)="theme.theme.set('light')">☀ Hell</button>
      </div>

      <h3>Speicher</h3>
      <p class="muted">Dauerhafter Speicher: {{ storage.persisted() }}
        @if (storage.persisted() === 'nein') { · <button class="linkbtn" (click)="storage.request()">erneut anfragen</button> }</p>
    </section>`,
})
export class SettingsComponent {
  settings = inject(SettingsService); theme = inject(ThemeService); storage = inject(StorageService); snd = inject(SoundService); sounds = SOUNDS;
  secs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { SettingsService } from './core/settings.service';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <header class="head">
        <div class="head-row">
          <h1><a routerLink="/dashboard">Fitness Trainer</a></h1>
          <button class="burger" (click)="open.set(true)" aria-label="Menü öffnen"><span></span></button>
        </div>
        <p class="sub">Dein Training. Dein Plan.</p>
      </header>
      <main><router-outlet /></main>
    </div>
    <nav class="nav" [class.active]="open()" [attr.aria-hidden]="!open()" aria-label="Hauptmenü">
      <button class="close" (click)="open.set(false)" aria-label="Menü schließen">×</button>
      <a routerLink="/dashboard" routerLinkActive="active" (click)="open.set(false)">Start</a>
      <a routerLink="/trainings" routerLinkActive="active" (click)="open.set(false)">Trainings</a>
      <a routerLink="/plans" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="open.set(false)">Trainingspläne</a>
      <a routerLink="/plans/new" routerLinkActive="active" (click)="open.set(false)">Neuer Plan</a>
      <a routerLink="/exercises" routerLinkActive="active" (click)="open.set(false)">Übungen</a>
      <div class="setting">
        <label for="cd">Start-Countdown</label>
        <select id="cd" class="search-bar" (change)="settings.setCountdown(+$any($event.target).value)">
          <option value="0" [selected]="settings.countdown() === 0">Aus</option>
          @for (n of secs; track n) { <option [value]="n" [selected]="settings.countdown() === n">{{ n }} Sekunde{{ n > 1 ? 'n' : '' }}</option> }
        </select>
      </div>
      <button class="btn secondary theme-toggle" (click)="theme.toggle()">
        {{ theme.theme() === 'dark' ? '☀ Helles Design' : '☾ Dunkles Design' }}</button>
      <div class="nav-foot">Fitness Trainer</div>
    </nav>`,
})
export class AppComponent {
  open = signal(false); theme = inject(ThemeService); settings = inject(SettingsService);
  secs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

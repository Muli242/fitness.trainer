import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StorageService } from './core/storage.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <header class="head">
        <div class="head-row">
          <h1><a routerLink="/dashboard">Fitness Trainer</a></h1>
          <button class="burger" (click)="open.set(true)" aria-label="Menü öffnen"><span></span></button>
        </div>
        <p class="sub">Dein Training. Dein Workout.</p>
      </header>
      <main><router-outlet /></main>
    </div>
    <nav class="nav" [class.active]="open()" [attr.aria-hidden]="!open()" aria-label="Hauptmenü">
      <button class="close" (click)="open.set(false)" aria-label="Menü schließen">×</button>
      <a routerLink="/dashboard" routerLinkActive="active" (click)="open.set(false)">Start</a>
      <a routerLink="/trainings" routerLinkActive="active" (click)="open.set(false)">Training</a>
      <a routerLink="/workouts" routerLinkActive="active" (click)="open.set(false)">Workout</a>
      <a routerLink="/exercises" routerLinkActive="active" (click)="open.set(false)">Übung</a>
      <a routerLink="/data" routerLinkActive="active" (click)="open.set(false)">Daten</a>
      <a routerLink="/settings" routerLinkActive="active" (click)="open.set(false)">Settings</a>
      <a routerLink="/about" routerLinkActive="active" (click)="open.set(false)">About</a>
    </nav>`,
})
export class AppComponent {
  open = signal(false);
  private storage = inject(StorageService);   // fordert beim Start dauerhaften Speicher an
  private theme = inject(ThemeService);       // setzt Design und Statusleistenfarbe beim Start
}

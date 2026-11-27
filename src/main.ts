import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

const MIN_SPLASH_MS = 1600; // Animation soll einmal durchlaufen

function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  el.classList.add('hide');
  setTimeout(() => el.remove(), 500);
}

bootstrapApplication(AppComponent, appConfig)
  .then(() => setTimeout(hideSplash, Math.max(0, MIN_SPLASH_MS - performance.now())))
  .catch(err => { console.error(err); hideSplash(); });

// Kein Kontextmenü (z. B. langer Druck auf Bilder) – außer in Eingabefeldern
document.addEventListener('contextmenu', e => {
  const t = e.target as HTMLElement | null;
  if (!t?.closest?.('input,textarea,[contenteditable]')) e.preventDefault();
});

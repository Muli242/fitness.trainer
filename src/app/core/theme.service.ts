import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());
  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.dataset['theme'] = t;
      try { localStorage.setItem('ft_theme', t); } catch { /* ignorieren */ }
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#f8fafc' : '#0f172a');
    });
  }
  toggle() { this.theme.update(t => t === 'dark' ? 'light' : 'dark'); }
  private initial(): Theme {
    try { const s = localStorage.getItem('ft_theme'); if (s === 'light' || s === 'dark') return s; } catch { /* ignorieren */ }
    return 'dark';
  }
}

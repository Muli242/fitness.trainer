import { Injectable, signal } from '@angular/core';

const KEY = 'ft_countdown';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  /** Start-Countdown in Sekunden (0 = aus, sonst 1–10) */
  readonly countdown = signal<number>(this.read());
  setCountdown(n: number) {
    const v = Math.min(10, Math.max(0, Math.round(n) || 0));
    this.countdown.set(v);
    try { localStorage.setItem(KEY, String(v)); } catch { /* ignorieren */ }
  }
  private read(): number {
    try { const v = Number(localStorage.getItem(KEY)); return isFinite(v) && v >= 0 && v <= 10 ? Math.round(v) : 0; } catch { return 0; }
  }
}

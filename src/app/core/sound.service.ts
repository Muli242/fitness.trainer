import { Injectable, signal } from '@angular/core';

export type SoundId = 'off' | 'beep' | 'bell' | 'gong' | 'alarm' | 'chime';
export const SOUNDS: { id: SoundId; name: string }[] = [
  { id: 'beep', name: 'Piepton' }, { id: 'bell', name: 'Boxglocke' }, { id: 'gong', name: 'Gong' },
  { id: 'alarm', name: 'Alarm' }, { id: 'chime', name: 'Glockenspiel' }, { id: 'off', name: 'Aus (nur Vibration)' },
];
const KEY = 'ft_sound';

/** Signaltöne, live per WebAudio erzeugt – keine Audiodateien, daher frei von Lizenzfragen und offline verfügbar */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly sound = signal<SoundId>(this.read());
  /** Vibration zusätzlich zum Ton (nur Geräte mit Unterstützung) */
  readonly vibration = signal<boolean>(localStorage.getItem('ft_vibrate') !== '0');
  setVibration(on: boolean) { this.vibration.set(on); try { localStorage.setItem('ft_vibrate', on ? '1' : '0'); } catch { /* ignorieren */ } }
  private vibrate(ms: number) { if (this.vibration()) navigator.vibrate?.(ms); }
  private ac?: AudioContext;
  private read(): SoundId {
    try { const v = localStorage.getItem(KEY) as SoundId; return SOUNDS.some(s => s.id === v) ? v : 'beep'; } catch { return 'beep'; }
  }
  set(id: SoundId) { this.sound.set(id); try { localStorage.setItem(KEY, id); } catch { /* ignorieren */ } }

  /** gemeinsamer AudioContext; muss per Tipp-Geste freigeschaltet werden (iOS) */
  unlock(): AudioContext | undefined {
    try { this.ac ??= new AudioContext(); if (this.ac.state === 'suspended') void this.ac.resume(); return this.ac; } catch { return undefined; }
  }

  /** kurzer Tick (Start-Countdown) */
  tick() { const c = this.unlock(); if (c) this.tone(c, c.currentTime, 660, 0.15, 0.3); this.vibrate(30); }

  /** gewähltes Signal (Start und Ende einer Einheit); id = Probehören */
  play(id: SoundId = this.sound()) {
    const c = this.unlock(), t = c ? c.currentTime + 0.02 : 0;
    if (c) switch (id) {
      case 'beep': this.tone(c, t, 880, 0.6, 0.3); break;
      case 'bell': for (let i = 0; i < 3; i++) this.bell(c, t + i * 0.3, 880); break;
      case 'gong': this.bell(c, t, 110, 3.2, [1, 1.5, 2, 2.76, 4.07], 0.05); break;
      case 'alarm': for (let i = 0; i < 6; i++) this.tone(c, t + i * 0.16, i % 2 ? 660 : 880, 0.14, 0.12, 'square'); break;
      case 'chime': [784, 988, 1175, 1568].forEach((f, i) => this.tone(c, t + i * 0.14, f, 0.9, 0.22)); break;
    }
    this.vibrate(id === 'off' || id === 'beep' ? 200 : 300);
  }

  private tone(c: AudioContext, t: number, f: number, dur: number, vol: number, type: OscillatorType = 'sine', attack = 0.005) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.00001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.00001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  /** Glocke: mehrere unharmonische Teiltöne mit unterschiedlicher Abklingzeit */
  private bell(c: AudioContext, t: number, f: number, dur = 1.4, ratios = [1, 2.76, 5.4, 8.93], attack = 0.003) {
    ratios.forEach((r, i) => this.tone(c, t, f * r, dur / (1 + i * 0.7), 0.28 / (1 + i * 0.6), 'sine', attack));
  }
}

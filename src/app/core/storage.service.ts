import { Injectable, signal } from '@angular/core';

/** Bittet den Browser, die App-Daten dauerhaft zu behalten (nicht bei Speicherknappheit löschen) */
@Injectable({ providedIn: 'root' })
export class StorageService {
  /** 'ja' | 'nein' | 'unbekannt' (nicht unterstützt) */
  readonly persisted = signal<'ja' | 'nein' | 'unbekannt'>('unbekannt');
  constructor() { this.request(); }
  async request() {
    const s = navigator.storage;
    if (!s?.persist) return;
    try {
      this.persisted.set((await s.persisted()) || (await s.persist()) ? 'ja' : 'nein');
    } catch { /* ignorieren */ }
  }
}

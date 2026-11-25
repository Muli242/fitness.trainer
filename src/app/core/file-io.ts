export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readJsonFile(file: File): Promise<unknown> {
  try { return JSON.parse(await file.text()); } catch { throw new Error('Die Datei ist kein gültiges JSON.'); }
}
export const today = () => new Date().toISOString().slice(0, 10);
export interface ImportResult { added: number; updated: number; skipped: number; }
export const importMessage = (r: ImportResult, what: string) =>
  `${r.added} ${what} neu, ${r.updated} aktualisiert` + (r.skipped ? `, ${r.skipped} übersprungen (ungültig)` : '') + '.';

/** Bild einlesen, auf max. Breite verkleinern und als JPEG-Data-URL liefern (spart localStorage-Platz) */
export async function imageToDataUrl(file: File, maxW = 800, quality = 0.8): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxW / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  return c.toDataURL('image/jpeg', quality);
}

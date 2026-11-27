import { Component, ElementRef, inject, input, signal } from '@angular/core';

export interface KebabItem { label: string; run: () => void; danger?: boolean; }
/** true, wenn das Ereignis aus einem Drei-Punkte-Menü stammt (Karten-Klick dann ignorieren) */
export const fromKebab = (e: Event) => !!(e.target as HTMLElement | null)?.closest?.('app-kebab');

/** Drei-Punkte-Menü ⋮ */
@Component({
  selector: 'app-kebab', standalone: true,
  host: { '(document:click)': 'outside($event)', '(document:keydown.escape)': 'open.set(false)' },
  template: `
    <div class="kebab">
      <button class="kebab-btn" type="button" aria-label="Menü" aria-haspopup="menu" [attr.aria-expanded]="open()" (click)="open.set(!open())">⋮</button>
      @if (open()) {
        <div class="kebab-menu" role="menu">
          @for (i of items(); track i.label) {
            <button type="button" role="menuitem" class="kebab-item" [class.danger]="i.danger" (click)="choose(i)">{{ i.label }}</button>
          }
        </div>
      }
    </div>`,
})
export class KebabComponent {
  items = input.required<KebabItem[]>();
  open = signal(false);
  private el = inject(ElementRef<HTMLElement>);
  outside(e: Event) { if (!this.el.nativeElement.contains(e.target)) this.open.set(false); }
  choose(i: KebabItem) { this.open.set(false); i.run(); }
}

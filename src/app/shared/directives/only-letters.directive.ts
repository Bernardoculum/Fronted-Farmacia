import { Directive, ElementRef, HostListener, Optional, Self, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appOnlyLetters], [onlyLetters]',
  standalone: true,
})
export class OnlyLettersDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  @Optional() @Self() private readonly ngControl = inject(NgControl, { optional: true });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const teclasPermitidas = [
      'Backspace',
      'Tab',
      'Enter',
      'Escape',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    if (
      teclasPermitidas.includes(event.key) ||
      (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) ||
      (event.metaKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase()))
    ) {
      return;
    }

    // Bloquear si la tecla es un número (0-9)
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Permitir solo letras, tildes, diéresis, eñes, espacios, punto, guion o apóstrofe
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const textoPegado = event.clipboardData?.getData('text') || '';
    this.sanitizar(textoPegado);
  }

  @HostListener('input')
  onInput(): void {
    this.sanitizar(this.el.nativeElement.value);
  }

  private sanitizar(texto: string): void {
    const limpio = texto.replace(/[0-9]/g, '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '');
    this.el.nativeElement.value = limpio;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(limpio, { emitEvent: true });
    }
  }
}

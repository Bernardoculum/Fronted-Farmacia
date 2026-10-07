import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Optional,
  Self,
  inject,
} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appOnlyNumbers], [onlyNumbers]',
  standalone: true,
})
export class OnlyNumbersDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  @Optional() @Self() private readonly ngControl = inject(NgControl, { optional: true });

  /** Permite punto decimal si es verdadero (ej. para precios o costos) */
  @Input() allowDecimals: boolean = false;

  /** Permite números negativos (por defecto falso: solo números positivos) */
  @Input() allowNegative: boolean = false;

  /** Longitud máxima de dígitos numéricos (ej. 8 para teléfono, 13 para DPI) */
  @Input() maxDigits?: number | string;

  /** Número máximo de decimales permitidos cuando allowDecimals es verdadero */
  @Input() maxDecimals: number = 2;

  private get maxLen(): number | undefined {
    return this.maxDigits ? Number(this.maxDigits) : undefined;
  }

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

    const input = this.el.nativeElement;
    const valorActual = input.value || '';
    const seleccionLongitud = (input.selectionEnd || 0) - (input.selectionStart || 0);

    // Permitir punto decimal si está habilitado y aún no existe uno
    if (this.allowDecimals && (event.key === '.' || event.key === ',')) {
      if (valorActual.includes('.') || valorActual.includes(',')) {
        event.preventDefault();
      }
      return;
    }

    if (this.allowNegative && event.key === '-') {
      if (valorActual.includes('-') || input.selectionStart !== 0) {
        event.preventDefault();
      }
      return;
    }

    // Bloquear cualquier tecla alfabética o símbolo que no sea 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Límite de dígitos numéricos
    if (this.maxLen && seleccionLongitud === 0) {
      const digitosActuales = valorActual.replace(/[^0-9]/g, '').length;
      if (digitosActuales >= this.maxLen) {
        event.preventDefault();
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const textoPegado = event.clipboardData?.getData('text') || '';
    this.sanitizarYAplicar(textoPegado);
  }

  @HostListener('input')
  onInput(): void {
    this.sanitizarYAplicar(this.el.nativeElement.value);
  }

  private sanitizarYAplicar(nuevoTexto: string): void {
    const input = this.el.nativeElement;
    let limpio = '';

    if (this.allowDecimals) {
      const partes = nuevoTexto.replace(/,/g, '.').replace(/[^0-9.]/g, '').split('.');
      if (partes.length > 1) {
        limpio = partes[0] + '.' + partes.slice(1).join('').substring(0, this.maxDecimals);
      } else {
        limpio = partes[0];
      }
    } else {
      limpio = nuevoTexto.replace(/[^0-9]/g, '');
    }

    if (this.maxLen) {
      limpio = limpio.substring(0, this.maxLen);
    }

    input.value = limpio;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(limpio, { emitEvent: true });
    }
  }
}

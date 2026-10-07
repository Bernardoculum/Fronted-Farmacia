import { Injectable } from '@angular/core';
import Swal, { SweetAlertOptions } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private getBaseConfig(): SweetAlertOptions {
    const overlay = typeof document !== 'undefined' ? (document.querySelector('.cdk-overlay-container') as HTMLElement) : null;
    return {
      target: overlay || 'body',
      heightAuto: false,
      customClass: {
        container: '!z-[9999999]',
        popup: 'rounded-3xl p-6 font-sans shadow-2xl border border-slate-100 !z-[10000000]',
        title: 'text-lg font-black text-slate-800 tracking-tight',
        htmlContainer: 'text-xs text-slate-600 leading-relaxed',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ml-2',
        cancelButton: 'px-4 py-2.5 rounded-xl font-bold text-xs border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer mr-2',
      },
      buttonsStyling: false,
    };
  }

  /**
   * Modal de Éxito en el Centro (SweetAlert2 con icono animado)
   */
  success(titulo: string, texto?: string, timer = 2200): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'success',
      title: titulo,
      text: texto,
      showConfirmButton: true,
      confirmButtonText: 'Aceptar',
      timer: timer,
      timerProgressBar: true,
      iconColor: '#059669', // Emerald 600
    });
  }

  /**
   * Modal de Error en el Centro (SweetAlert2 con icono animado)
   */
  error(titulo: string, texto?: string): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'error',
      title: titulo,
      text: texto,
      confirmButtonText: 'Entendido',
      iconColor: '#dc2626', // Red 600
    });
  }

  /**
   * Modal de Advertencia en el Centro (SweetAlert2)
   */
  warning(titulo: string, texto?: string): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'warning',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
      iconColor: '#d97706', // Amber 600
    });
  }

  /**
   * Modal Informativo
   */
  info(titulo: string, texto?: string): Promise<any> {
    return Swal.fire({
      ...this.getBaseConfig(),
      icon: 'info',
      title: titulo,
      text: texto,
      confirmButtonText: 'Aceptar',
      iconColor: '#0284c7', // Sky 600
    });
  }

  /**
   * Diálogo de Confirmación "¿Estás seguro?" con SweetAlert2
   * Cancelar en ROJO y Aceptar en VERDE ESMERALDA
   */
  async confirm(options: {
    title: string;
    text: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  }): Promise<boolean> {
    const isDanger = options.type === 'danger';
    const iconType: 'warning' | 'error' | 'info' = isDanger ? 'error' : (options.type === 'info' ? 'info' : 'warning');
    const result = await Swal.fire({
      ...this.getBaseConfig(),
      title: options.title,
      text: options.text,
      icon: iconType,
      showCancelButton: true,
      confirmButtonText: options.confirmText || 'Confirmar',
      cancelButtonText: options.cancelText || 'Cancelar',
      reverseButtons: true, // Cancelar a la izquierda (rojo), Confirmar a la derecha (verde)
      iconColor: isDanger ? '#dc2626' : '#d97706',
    });
    return result.isConfirmed;
  }

  /**
   * Diálogo con Input de Texto (ej. Motivo de cancelación)
   */
  async prompt(options: {
    title: string;
    text?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<string | null> {
    const result = await Swal.fire({
      ...this.getBaseConfig(),
      title: options.title,
      text: options.text,
      input: 'text',
      inputPlaceholder: options.placeholder || 'Escribe el motivo...',
      showCancelButton: true,
      confirmButtonText: options.confirmText || 'Confirmar',
      cancelButtonText: options.cancelText || 'Cancelar',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un motivo para continuar';
        }
        return null;
      },
    });

    return result.isConfirmed ? (result.value as string).trim() : null;
  }
}

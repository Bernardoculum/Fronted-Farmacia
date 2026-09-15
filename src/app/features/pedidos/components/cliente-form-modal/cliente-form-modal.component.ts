import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { Cliente } from '../../../../core/models/pedido.models';

@Component({
  selector: 'app-cliente-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm backdrop-blur-md">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </span>
            <div>
              <h3 class="text-base font-bold text-white">Nuevo Cliente Rápido</h3>
              <p class="text-xs text-purple-100">Alta ágil para Call Center o Mostrador</p>
            </div>
          </div>
          <button (click)="cerrarModal.emit()" class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Formulario -->
        <form [formGroup]="clienteForm" (ngSubmit)="guardar()" class="p-6 space-y-4">
          @if (errorMessage) {
            <div class="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Nombre -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                formControlName="nombre"
                placeholder="Ej. Carlos"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <!-- Apellido -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Apellido</label>
              <input
                type="text"
                formControlName="apellido"
                placeholder="Ej. Gómez"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Teléfono -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
              <input
                type="text"
                formControlName="telefono"
                placeholder="Ej. 55551234"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <!-- Correo (opcional) -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                formControlName="email"
                placeholder="cliente@ejemplo.com"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          <!-- Dirección de Entrega -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Dirección de Entrega / Domicilio *</label>
            <textarea
              formControlName="direccion"
              rows="2"
              placeholder="Ej. 5ta Avenida 12-40 Zona 10, Edificio Las Flores, Apto 302"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Referencia -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Punto de Referencia (Para motorista)</label>
            <input
              type="text"
              formControlName="referenciaDireccion"
              placeholder="Ej. Frente al supermercado, portón color gris"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          <!-- Footer Botones -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              (click)="cerrarModal.emit()"
              class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="clienteForm.invalid || guardando"
              class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20 transition-all flex items-center gap-2">
              @if (guardando) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              <span>Guardar y Seleccionar</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `
})
export class ClienteFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pedidosService = inject(PedidosService);

  readonly cerrarModal = output<void>();
  readonly clienteCreado = output<Cliente>();

  guardando = false;
  errorMessage = '';

  clienteForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: [''],
    telefono: ['', [Validators.required, Validators.minLength(8)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    referenciaDireccion: [''],
    email: ['', [Validators.email]],
  });

  guardar(): void {
    if (this.clienteForm.invalid) return;
    this.guardando = true;
    this.errorMessage = '';

    const val = this.clienteForm.value;
    this.pedidosService.crearCliente({
      nombre: val.nombre!,
      apellido: val.apellido || undefined,
      telefono: val.telefono!,
      direccion: val.direccion!,
      referenciaDireccion: val.referenciaDireccion || undefined,
      email: val.email || undefined,
    }).subscribe({
      next: (nuevo) => {
        this.guardando = false;
        this.clienteCreado.emit(nuevo);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMessage = err?.error?.message || 'Error al guardar el cliente. Verifique los datos.';
      },
    });
  }
}

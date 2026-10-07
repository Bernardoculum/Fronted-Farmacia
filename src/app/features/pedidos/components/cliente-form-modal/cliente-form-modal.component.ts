import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PedidosService } from '../../../../core/services/pedidos.service';
import { Cliente } from '../../../../core/models/pedido.models';
import { OnlyNumbersDirective } from '../../../../shared/directives/only-numbers.directive';
import { OnlyLettersDirective } from '../../../../shared/directives/only-letters.directive';
import { CustomValidators } from '../../../../shared/validators/custom-validators';

@Component({
  selector: 'app-cliente-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    OnlyNumbersDirective,
    OnlyLettersDirective,
  ],
  template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col p-6">
        
        <!-- Header Estandarizado -->
        <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
              <mat-icon class="text-2xl">person_add</mat-icon>
            </div>
            <div>
              <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
                Call Center / POS
              </span>
              <h3 class="text-base font-black text-slate-800 mt-0.5">Nuevo Cliente Rápido</h3>
              <p class="text-xs text-slate-500">Alta ágil para atención de pacientes</p>
            </div>
          </div>
          <button mat-icon-button (click)="cerrarModal.emit()" class="text-slate-400 hover:text-slate-600">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Formulario con CSS Grid -->
        <form [formGroup]="clienteForm" (ngSubmit)="guardar()" class="space-y-3">
          @if (errorMessage) {
            <div class="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
              <mat-icon class="text-rose-500 text-base shrink-0">error_outline</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Nombre -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Nombre *</label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="text"
                  appOnlyLetters
                  formControlName="nombre"
                  placeholder="Ej. Carlos"
                />
                @if (clienteForm.get('nombre')?.hasError('required') && clienteForm.get('nombre')?.touched) {
                  <mat-error class="text-2xs">El nombre es obligatorio</mat-error>
                }
                @if ((clienteForm.get('nombre')?.hasError('soloNumeros') || clienteForm.get('nombre')?.hasError('soloLetras')) && clienteForm.get('nombre')?.touched) {
                  <mat-error class="text-2xs">No se permiten números (ej. '323')</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Apellido -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Apellido</label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="text"
                  appOnlyLetters
                  formControlName="apellido"
                  placeholder="Ej. Gómez"
                />
                @if ((clienteForm.get('apellido')?.hasError('soloNumeros') || clienteForm.get('apellido')?.hasError('soloLetras')) && clienteForm.get('apellido')?.touched) {
                  <mat-error class="text-2xs">No se permiten números</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Teléfono -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Teléfono Móvil *</label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="text"
                  appOnlyNumbers
                  maxDigits="8"
                  maxlength="8"
                  formControlName="telefono"
                  placeholder="Ej. 55551234"
                />
                @if (clienteForm.get('telefono')?.hasError('required') && clienteForm.get('telefono')?.touched) {
                  <mat-error class="text-2xs">El teléfono es obligatorio</mat-error>
                }
                @if (clienteForm.get('telefono')?.hasError('telefonoInvalido') && clienteForm.get('telefono')?.touched) {
                  
                }
              </mat-form-field>
            </div>

            <!-- Correo (opcional) -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Correo Electrónico</label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  placeholder="cliente@ejemplo.com"
                />
              </mat-form-field>
            </div>
          </div>

          <!-- Dirección de Entrega -->
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Dirección de Entrega / Domicilio *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="direccion"
                placeholder="Ej. 5ta Avenida 12-40 Zona 10, Edificio Las Flores"
              />
              @if (clienteForm.get('direccion')?.hasError('required') && clienteForm.get('direccion')?.touched) {
                <mat-error class="text-2xs">La dirección es obligatoria</mat-error>
              }
              @if ((clienteForm.get('direccion')?.hasError('soloNumeros') || clienteForm.get('direccion')?.hasError('requiereLetras')) && clienteForm.get('direccion')?.touched) {
                <mat-error class="text-2xs">No se permiten solo números (ej. '323')</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Referencia -->
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Punto de Referencia</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="referenciaDireccion"
                placeholder="Ej. Frente al supermercado, portón color gris"
              />
            </mat-form-field>
          </div>

          <!-- Footer Botones -->
          <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              mat-button
              (click)="cerrarModal.emit()"
              class="!rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              mat-flat-button
              color="primary"
              [disabled]="clienteForm.invalid || guardando"
              class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
            >
              <span>{{ guardando ? 'Guardando...' : 'Guardar y Seleccionar' }}</span>
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
    nombre: ['', [Validators.required, CustomValidators.nombrePersona()]],
    apellido: ['', [CustomValidators.nombrePersona()]],
    telefono: ['', [Validators.required, CustomValidators.telefonoGuatemala()]],
    direccion: ['', [Validators.required, Validators.maxLength(300), CustomValidators.textoConLetras()]],
    referenciaDireccion: ['', [CustomValidators.textoConLetras()]],
    email: ['', [Validators.email]],
  });

  guardar(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorMessage = '';

    const val = this.clienteForm.value;
    const dto: any = {
      nombre: val.nombre!.trim(),
      apellido: val.apellido?.trim() || undefined,
      telefono: val.telefono!.trim(),
      direccion: val.direccion!.trim(),
      referenciaDireccion: val.referenciaDireccion?.trim() || undefined,
      email: val.email?.trim() || undefined,
    };

    this.pedidosService.crearCliente(dto).subscribe({
      next: (cliente) => {
        this.guardando = false;
        this.clienteCreado.emit(cliente);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMessage = err?.error?.message || 'Error al registrar el cliente.';
      },
    });
  }
}

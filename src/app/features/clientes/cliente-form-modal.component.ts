import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClientesService } from '../../core/services/clientes.service';
import { NotificationService } from '../../core/services/notification.service';
import { OnlyNumbersDirective } from '../../shared/directives/only-numbers.directive';
import { OnlyLettersDirective } from '../../shared/directives/only-letters.directive';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { ClienteItem } from '../../core/models/clientes.models';

@Component({
  selector: 'app-cliente-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    OnlyNumbersDirective,
    OnlyLettersDirective,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-xl w-full bg-white text-slate-800 rounded-2xl">
      
      <!-- Encabezado Estandarizado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">{{ data ? 'edit_note' : 'person_add' }}</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Padrón de Pacientes
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {{ data ? 'Modificar Paciente' : 'Registrar Nuevo Paciente' }}
            </h2>
            <p class="text-xs text-slate-500">
              Datos de contacto para facturación y entregas a domicilio
            </p>
          </div>
        </div>
        <button
          type="button"
          mat-icon-button
          (click)="cerrar()"
          class="text-slate-400 hover:text-slate-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Formulario con CSS Grid 2 Columnas -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        
        <!-- Nombres y Apellidos en Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Nombres *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="text"
                appOnlyLetters
                formControlName="nombre"
                placeholder="Ej. María René"
              />
              @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
                <mat-error class="text-2xs">El nombre es obligatorio</mat-error>
              }
              @if ((form.get('nombre')?.hasError('soloNumeros') || form.get('nombre')?.hasError('soloLetras')) && form.get('nombre')?.touched) {
                
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Apellidos
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="text"
                appOnlyLetters
                formControlName="apellido"
                placeholder="Ej. Castillo Ramos"
              />
              @if ((form.get('apellido')?.hasError('soloNumeros') || form.get('apellido')?.hasError('soloLetras')) && form.get('apellido')?.touched) {
                <mat-error class="text-2xs">No se permiten números</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Teléfono y Correo Electrónico en Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Teléfono Principal *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="text"
                appOnlyNumbers
                maxDigits="8"
                maxlength="8"
                formControlName="telefono"
                placeholder="Ej. 55512345"
              />
              @if (form.get('telefono')?.hasError('required') && form.get('telefono')?.touched) {
                <mat-error class="text-2xs">El teléfono es obligatorio</mat-error>
              }
              @if (form.get('telefono')?.hasError('telefonoInvalido') && form.get('telefono')?.touched) {
                
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Correo Electrónico</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="cliente@correo.com"
              />
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error class="text-2xs">Formato de correo inválido</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Dirección de Entrega -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Dirección de Entrega / Residencia *</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              formControlName="direccion"
              placeholder="Ej. 14 Avenida 5-20 Zona 11, Colonia Mariscal"
            />
            @if (form.get('direccion')?.hasError('required') && form.get('direccion')?.touched) {
              <mat-error class="text-2xs">La dirección es obligatoria</mat-error>
            }
            @if ((form.get('direccion')?.hasError('soloNumeros') || form.get('direccion')?.hasError('requiereLetras')) && form.get('direccion')?.touched) {
              <mat-error class="text-2xs">No se permiten solo números (ej. '323'). Ingrese dirección descriptiva.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Puntos de Referencia -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Puntos de Referencia</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              formControlName="referenciaDireccion"
              placeholder="Ej. Casa de 2 niveles frente a panadería, portón negro"
            />
            @if ((form.get('referenciaDireccion')?.hasError('soloNumeros') || form.get('referenciaDireccion')?.hasError('requiereLetras')) && form.get('referenciaDireccion')?.touched) {
              <mat-error class="text-2xs">No se permiten solo números (ej. '323')</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            mat-button
            (click)="cerrar()"
            class="!rounded-xl"
          >
            Cancelar
          </button>

          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || guardando()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            <span>{{ guardando() ? 'Guardando...' : (data ? 'Actualizar Paciente' : 'Registrar Paciente') }}</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class ClienteFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ClienteFormModalComponent>);
  private readonly clientesService = inject(ClientesService);
  private readonly notification = inject(NotificationService);
  data: ClienteItem | null = inject(MAT_DIALOG_DATA, { optional: true });

  readonly guardando = signal<boolean>(false);

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, CustomValidators.nombrePersona()]],
    apellido: ['', [CustomValidators.nombrePersona()]],
    telefono: ['', [Validators.required, CustomValidators.telefonoGuatemala()]],
    email: ['', [Validators.email]],
    direccion: ['', [Validators.required, Validators.maxLength(300), CustomValidators.textoConLetras()]],
    referenciaDireccion: ['', [CustomValidators.textoConLetras()]],
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        nombre: this.data.nombre,
        apellido: this.data.apellido || '',
        telefono: this.data.telefono,
        email: this.data.email || '',
        direccion: this.data.direccion,
        referenciaDireccion: this.data.referenciaDireccion || '',
      });
    }
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = this.form.value;

    const payload: any = {
      nombre: val.nombre.trim(),
      apellido: val.apellido?.trim() || undefined,
      telefono: val.telefono.trim(),
      email: val.email?.trim() || undefined,
      direccion: val.direccion.trim(),
      referenciaDireccion: val.referenciaDireccion?.trim() || undefined,
    };

    const req$ = this.data
      ? this.clientesService.actualizarCliente(this.data.clienteId, payload)
      : this.clientesService.crearCliente(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.notification.success(
          this.data ? 'Paciente Actualizado' : 'Paciente Registrado',
          `Los datos de "${val.nombre}" han sido guardados con éxito.`
        );
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notification.error('Error al guardar', err?.error?.message || 'No se pudo procesar la solicitud.');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

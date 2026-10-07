import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClientesService } from '../../core/services/clientes.service';
import { NotificationService } from '../../core/services/notification.service';
import { LaboratorioItem } from '../../core/models/clientes.models';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-laboratorio-form-modal',
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
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-md w-full bg-white text-slate-800 rounded-2xl">
      <div class="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">science</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Proveedores
            </span>
            <h3 class="text-base font-black text-slate-800 mt-0.5">
              {{ laboratorioActual ? 'Editar Laboratorio' : 'Registrar Laboratorio' }}
            </h3>
            <p class="text-xs text-slate-500">Fabricante o distribuidor farmacéutico</p>
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

      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Nombre del Laboratorio *</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              formControlName="nombre"
              placeholder="Ej. Pfizer, Novartis, Menarini..."
            />
            @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
              <mat-error class="text-2xs">El nombre es obligatorio</mat-error>
            }
            @if ((form.get('nombre')?.hasError('soloNumeros') || form.get('nombre')?.hasError('requiereLetras')) && form.get('nombre')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese nombre válido.</mat-error>
            }
          </mat-form-field>
        </div>

        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Teléfono de Contacto</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              type="text"
              formControlName="telefono"
              appOnlyNumbers
              maxDigits="8"
              maxlength="8"
              placeholder="Ej. 24201000"
            />
            @if (form.get('telefono')?.hasError('telefonoInvalido') && form.get('telefono')?.touched) {
              
            }
          </mat-form-field>
        </div>

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
            <span>{{ guardando() ? 'Guardando...' : (laboratorioActual ? 'Actualizar Laboratorio' : 'Guardar Laboratorio') }}</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class LaboratorioFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LaboratorioFormModalComponent>);
  private readonly clientesService = inject(ClientesService);
  private readonly notification = inject(NotificationService);
  data = inject(MAT_DIALOG_DATA, { optional: true });

  readonly guardando = signal<boolean>(false);
  laboratorioActual: LaboratorioItem | null = null;

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), CustomValidators.textoConLetras()]],
    telefono: ['', [CustomValidators.telefonoGuatemala()]],
  });

  ngOnInit(): void {
    if (this.data) {
      this.laboratorioActual = this.data.laboratorio || (this.data.laboratorioId ? this.data : null);
      if (this.laboratorioActual) {
        this.form.patchValue({
          nombre: this.laboratorioActual.nombre,
          telefono: this.laboratorioActual.telefono && this.laboratorioActual.telefono !== 'Sin teléfono' ? this.laboratorioActual.telefono : '',
        });
      }
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
      telefono: val.telefono?.trim() || undefined,
    };

    const req$ = this.laboratorioActual
      ? this.clientesService.actualizarLaboratorio(this.laboratorioActual.laboratorioId, payload)
      : this.clientesService.crearLaboratorio(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.notification.success(
          this.laboratorioActual ? 'Laboratorio Actualizado' : 'Laboratorio Registrado',
          `"${val.nombre}" ha sido guardado exitosamente.`
        );
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notification.error('Error al guardar', err?.error?.message || 'No se pudo procesar el laboratorio.');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

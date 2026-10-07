import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SucursalesService } from '../../../core/services/sucursales.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SucursalItem } from '../../../core/models/sucursal.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-sucursal-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    OnlyNumbersDirective,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-xl w-full bg-white text-slate-800 rounded-2xl">
      
      <!-- Encabezado Estandarizado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">{{ isEditing ? 'edit_location' : 'add_business' }}</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Red Farmacéutica
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal o Punto de Distribución' }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ isEditing ? 'Actualiza los datos del establecimiento' : 'Configuración de establecimientos del sistema' }}
            </p>
          </div>
        </div>

        <button mat-icon-button (click)="cerrar()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Formulario con CSS Grid -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        
        <!-- Nombre de la Sucursal -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Nombre de la Sucursal *</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              formControlName="nombre"
              placeholder="Ej. Farmacia Zona 14 La Villa"
            />
            @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
              <mat-error class="text-2xs">El nombre de la sucursal es obligatorio</mat-error>
            }
            @if ((form.get('nombre')?.hasError('soloNumeros') || form.get('nombre')?.hasError('requiereLetras')) && form.get('nombre')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese un nombre descriptivo.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Tipo de Sucursal y Estado en Grid 2 Columnas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Tipo de Sucursal *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="tipoSucursal">
                <mat-option value="FARMACIA">Farmacia (Punto de Venta)</mat-option>
                <mat-option value="STAND">Stand / Kiosco</mat-option>
                <mat-option value="BODEGA_CENTRAL">Bodega Central (Centro Logístico)</mat-option>
              </mat-select>
              @if (form.get('tipoSucursal')?.hasError('required') && form.get('tipoSucursal')?.touched) {
                <mat-error class="text-2xs">Seleccione el tipo de establecimiento</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Estado Operativo *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="estado">
                <mat-option value="ACTIVA">ACTIVA</mat-option>
                <mat-option value="INACTIVA">INACTIVA</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Dirección Física -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Dirección Física *</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              formControlName="direccion"
              placeholder="Ej. 10ma Calle 4-20 Zona 14"
            />
            @if (form.get('direccion')?.hasError('required') && form.get('direccion')?.touched) {
              <mat-error class="text-2xs">La dirección es obligatoria</mat-error>
            }
            @if ((form.get('direccion')?.hasError('soloNumeros') || form.get('direccion')?.hasError('requiereLetras')) && form.get('direccion')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese una dirección válida.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Teléfono y Coordenadas GPS en Grid 3 Columnas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Teléfono</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="text"
                formControlName="telefono"
                appOnlyNumbers
                maxDigits="8"
                maxlength="8"
                placeholder="Ej. 23334455"
              />
              @if (form.get('telefono')?.hasError('telefonoInvalido') && form.get('telefono')?.touched) {
                
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Latitud GPS</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="number"
                step="any"
                formControlName="latitud"
                placeholder="14.5987"
              />
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Longitud GPS</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="number"
                step="any"
                formControlName="longitud"
                placeholder="-90.5123"
              />
            </mat-form-field>
          </div>
        </div>

        <!-- Botones de Acción Estandarizados -->
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
            [disabled]="form.invalid || guardando"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Sucursal' }}</span>
          </button>
        </div>

      </form>

    </div>
  `,
})
export class SucursalFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SucursalFormModalComponent>);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly notification = inject(NotificationService);

  readonly isEditing: boolean;
  guardando = false;

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150), CustomValidators.textoConLetras()]],
    tipoSucursal: ['FARMACIA', [Validators.required]],
    direccion: ['', [Validators.required, Validators.maxLength(300), CustomValidators.textoConLetras()]],
    telefono: ['', [CustomValidators.telefonoGuatemala()]],
    latitud: [null as number | null],
    longitud: [null as number | null],
    estado: ['ACTIVA'],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data?: SucursalItem) {
    this.isEditing = !!data;
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        nombre: this.data.nombre,
        tipoSucursal: this.data.tipoSucursal,
        direccion: this.data.direccion,
        telefono: this.data.telefono || '',
        latitud: this.data.latitud,
        longitud: this.data.longitud,
        estado: this.data.estado,
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.guardando = true;
    const val = this.form.value;

    const payload: any = {
      nombre: val.nombre!.trim(),
      tipoSucursal: val.tipoSucursal!,
      direccion: val.direccion!.trim(),
      telefono: val.telefono?.trim() || undefined,
      latitud: val.latitud !== null && val.latitud !== undefined ? Number(val.latitud) : undefined,
      longitud: val.longitud !== null && val.longitud !== undefined ? Number(val.longitud) : undefined,
      estado: val.estado || 'ACTIVA',
    };

    const req$ = this.isEditing && this.data
      ? this.sucursalesService.actualizarSucursal(this.data.sucursalId, payload)
      : this.sucursalesService.crearSucursal(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando = false;
        this.notification.success(this.isEditing ? 'Sucursal actualizada exitosamente.' : 'Sucursal registrada exitosamente.');
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.guardando = false;
        this.notification.error(err?.error?.message || 'Error al guardar sucursal');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

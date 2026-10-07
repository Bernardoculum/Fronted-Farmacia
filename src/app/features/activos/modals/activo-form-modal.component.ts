import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivosService } from '../../../core/services/activos.service';
import { SucursalesService } from '../../../core/services/sucursales.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ActivoFijo, CategoriaActivo } from '../../../core/models/activos.models';
import { SucursalOption } from '../../../core/models/sucursal.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-activo-form-modal',
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
    <div class="p-4 sm:p-6 max-w-2xl w-full bg-white text-slate-800 rounded-2xl">
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs shrink-0">
            <mat-icon class="text-2xl">{{ data?.activo ? 'edit' : 'add_box' }}</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Control Patrimonial
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {{ data?.activo ? 'Editar Activo Fijo' : 'Nuevo Activo Fijo' }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ data?.activo ? 'Actualización de especificaciones y custodia' : 'Registro de equipo, maquinaria o mobiliario patrimonial' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          mat-icon-button
          (click)="dialogRef.close()"
          class="text-slate-400 hover:text-slate-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Nombre / Denominación *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="nombre"
                placeholder="Ej. Refrigeradora Clínica Especializada"
              />
              @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
                <mat-error class="text-2xs">El nombre es obligatorio</mat-error>
              }
              @if ((form.get('nombre')?.hasError('soloNumeros') || form.get('nombre')?.hasError('requiereLetras')) && form.get('nombre')?.touched) {
                <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese nombre descriptivo.</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Categoría Patrimonial *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="categoriaActivoId" placeholder="Seleccionar Categoría...">
                @for (cat of categorias(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.nombre }} ({{ cat.porcentajeDepreciacionAnual }}% an.)</mat-option>
                }
              </mat-select>
              @if (form.get('categoriaActivoId')?.hasError('required') && form.get('categoriaActivoId')?.touched) {
                <mat-error class="text-2xs">Seleccione una categoría</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Código Patrimonial</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="codigoActivo"
                placeholder="Auto-generado si se deja en blanco"
              />
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Sucursal Asignada *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="sucursalId" placeholder="Seleccionar Sucursal...">
                @for (suc of sucursales(); track suc.sucursalId) {
                  <mat-option [value]="suc.sucursalId">{{ suc.nombre }}</mat-option>
                }
              </mat-select>
              @if (form.get('sucursalId')?.hasError('required') && form.get('sucursalId')?.touched) {
                <mat-error class="text-2xs">Seleccione una sucursal</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Marca</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="marca"
                placeholder="Ej. Thermo Fisher / HP"
              />
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Modelo</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="modelo"
                placeholder="Ej. TSX-2300"
              />
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Número de Serie</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="numeroSerie"
                placeholder="Ej. SN-8823901"
              />
            </mat-form-field>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Fecha de Adquisición *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="date"
                formControlName="fechaAdquisicion"
              />
              @if (form.get('fechaAdquisicion')?.hasError('required') && form.get('fechaAdquisicion')?.touched) {
                <mat-error class="text-2xs">Fecha obligatoria</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Costo Adquisición (Q) *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                type="text"
                formControlName="costoAdquisicion"
                appOnlyNumbers
                [allowDecimals]="true"
                placeholder="0.00"
              />
              @if (form.get('costoAdquisicion')?.hasError('required') && form.get('costoAdquisicion')?.touched) {
                <mat-error class="text-2xs">El costo es obligatorio</mat-error>
              }
              @if ((form.get('costoAdquisicion')?.hasError('min') || form.get('costoAdquisicion')?.hasError('montoInvalido')) && form.get('costoAdquisicion')?.touched) {
                <mat-error class="text-2xs">El costo debe ser mayor a Q 0.00</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Responsable / Custodio</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="responsableAsignado"
                placeholder="Ej. Ing. Carlos Méndez"
              />
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Observaciones</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="observaciones"
                placeholder="Ej. Equipo con garantía extendida"
              />
            </mat-form-field>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            mat-button
            (click)="dialogRef.close()"
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
            <span>{{ guardando() ? 'Guardando...' : (data?.activo ? 'Actualizar Activo' : 'Guardar Activo') }}</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class ActivoFormModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ActivoFormModalComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true }) as { activo?: ActivoFijo } | null;
  private fb = inject(FormBuilder);
  private activosService = inject(ActivosService);
  private sucursalesService = inject(SucursalesService);
  private notification = inject(NotificationService);

  categorias = signal<CategoriaActivo[]>([]);
  sucursales = signal<SucursalOption[]>([]);
  guardando = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, CustomValidators.textoConLetras()]],
    codigoActivo: [''],
    categoriaActivoId: [null, [Validators.required]],
    sucursalId: [null, [Validators.required]],
    marca: ['', [CustomValidators.textoConLetras()]],
    modelo: [''],
    numeroSerie: [''],
    fechaAdquisicion: ['', [Validators.required]],
    costoAdquisicion: [null, [Validators.required, CustomValidators.montoPositivo()]],
    responsableAsignado: ['', [CustomValidators.textoConLetras()]],
    observaciones: ['', [CustomValidators.textoConLetras()]],
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    if (this.data?.activo) {
      const a = this.data.activo;
      this.form.patchValue({
        nombre: a.nombre,
        codigoActivo: a.codigoActivo,
        categoriaActivoId: a.categoriaActivoId || a.categoriaActivo?.id,
        sucursalId: a.sucursalId || a.sucursal?.id,
        marca: a.marca || '',
        modelo: a.modelo || '',
        numeroSerie: a.numeroSerie || '',
        fechaAdquisicion: a.fechaAdquisicion ? a.fechaAdquisicion.substring(0, 10) : '',
        costoAdquisicion: a.costoAdquisicion,
        responsableAsignado: a.responsableAsignado || '',
        observaciones: a.observaciones || '',
      });
    }
  }

  private cargarCatalogos(): void {
    this.activosService.getCategorias().subscribe((cats) => this.categorias.set(cats));
    this.sucursalesService.cargarSucursales().subscribe((res) => {
      const lista = Array.isArray(res) ? res : (res?.data || []);
      this.sucursales.set(lista);
    });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = this.form.value;

    const dto = {
      nombre: val.nombre.trim(),
      codigoActivo: val.codigoActivo?.trim() || undefined,
      categoriaActivoId: Number(val.categoriaActivoId),
      sucursalId: Number(val.sucursalId),
      marca: val.marca?.trim() || undefined,
      modelo: val.modelo?.trim() || undefined,
      numeroSerie: val.numeroSerie?.trim() || undefined,
      fechaAdquisicion: val.fechaAdquisicion,
      costoAdquisicion: Number(val.costoAdquisicion),
      responsableAsignado: val.responsableAsignado?.trim() || undefined,
      observaciones: val.observaciones?.trim() || undefined,
    };

    const request$ = this.data?.activo
      ? this.activosService.actualizarActivo(this.data.activo.id, dto)
      : this.activosService.crearActivo(dto);

    request$.subscribe({
      next: (activoGuardado: ActivoFijo) => {
        this.guardando.set(false);
        this.notification.success(
          this.data?.activo ? 'Activo Actualizado' : 'Activo Registrado',
          `"${val.nombre}" ha sido guardado exitosamente.`
        );
        this.dialogRef.close(activoGuardado);
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.notification.error('Error al guardar activo', err?.error?.message || 'Error en el servidor');
      },
    });
  }
}

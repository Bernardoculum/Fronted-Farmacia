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
import { ActivoFijo } from '../../../core/models/activos.models';
import { SucursalOption } from '../../../core/models/sucursal.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-traslado-activo-modal',
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
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-lg w-full bg-white text-slate-800 rounded-2xl">
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs shrink-0">
            <mat-icon class="text-2xl">local_shipping</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Cadena de Custodia
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">Traslado de Activo Fijo</h2>
            <p class="text-xs text-slate-500">Reasignación física inter-sucursal</p>
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

      <div class="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200">
        <div class="text-xs font-bold text-slate-800">{{ activo.nombre }}</div>
        <div class="text-2xs text-slate-500 mt-0.5">
          Código: <span class="font-bold text-slate-700">{{ activo.codigoActivo }}</span> | Ubicación actual:
          <span class="font-bold text-teal-700">{{ activo.sucursal?.nombre || 'Bodega Central' }}</span>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="confirmarTraslado()" class="space-y-3">
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Sucursal Destino *</label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select formControlName="sucursalDestinoId" placeholder="Seleccionar Sucursal de Destino...">
              @for (suc of sucursalesDestino(); track suc.sucursalId) {
                <mat-option [value]="suc.sucursalId">{{ suc.nombre }}</mat-option>
              }
            </mat-select>
            @if (form.get('sucursalDestinoId')?.hasError('required') && form.get('sucursalDestinoId')?.touched) {
              <mat-error class="text-2xs">Seleccione la sucursal de destino</mat-error>
            }
          </mat-form-field>
        </div>

        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Custodio / Responsable del Traslado</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              formControlName="responsableRecepcion"
              placeholder="Ej. Ing. Carlos Méndez (Jefe de Farmacia)"
            />
            @if ((form.get('responsableRecepcion')?.hasError('soloNumeros') || form.get('responsableRecepcion')?.hasError('requiereLetras')) && form.get('responsableRecepcion')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323')</mat-error>
            }
          </mat-form-field>
        </div>

        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Motivo / Justificación *</label>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              matInput
              rows="2"
              formControlName="motivo"
              placeholder="Ej. Reubicación por apertura de nuevo punto de venta..."
            ></textarea>
            @if (form.get('motivo')?.hasError('required') && form.get('motivo')?.touched) {
              <mat-error class="text-2xs">El motivo es obligatorio</mat-error>
            }
            @if ((form.get('motivo')?.hasError('soloNumeros') || form.get('motivo')?.hasError('requiereLetras')) && form.get('motivo')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese justificación descriptiva.</mat-error>
            }
          </mat-form-field>
        </div>

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
            [disabled]="form.invalid || enviando()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            <span>{{ enviando() ? 'Trasladando...' : 'Confirmar Traslado' }}</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class TrasladoActivoModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<TrasladoActivoModalComponent>);
  activo = inject(MAT_DIALOG_DATA) as ActivoFijo;
  private fb = inject(FormBuilder);
  private activosService = inject(ActivosService);
  private sucursalesService = inject(SucursalesService);
  private notification = inject(NotificationService);

  sucursalesDestino = signal<SucursalOption[]>([]);
  enviando = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    sucursalDestinoId: [null, [Validators.required]],
    motivo: ['', [Validators.required, CustomValidators.textoConLetras()]],
    responsableRecepcion: ['', [CustomValidators.textoConLetras()]],
  });

  ngOnInit(): void {
    const origenId = this.activo.sucursalId || this.activo.sucursalId || this.activo.sucursal?.id;
    this.sucursalesService.cargarSucursales().subscribe((res) => {
      const lista = Array.isArray(res) ? res : (res?.data || []);
      const filtradas = lista.filter((s: SucursalOption) => s.sucursalId !== origenId);
      this.sucursalesDestino.set(filtradas);
    });
  }

  confirmarTraslado(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const val = this.form.value;

    const dto = {
      sucursalDestinoId: Number(val.sucursalDestinoId),
      motivo: val.motivo.trim(),
      responsableRecepcion: val.responsableRecepcion?.trim() || undefined,
    };

    this.activosService.trasladarActivo(this.activo.id, dto).subscribe({
      next: (activoActualizado: ActivoFijo) => {
        this.enviando.set(false);
        this.notification.success('Traslado Exitoso', `El activo "${this.activo.nombre}" fue trasladado correctamente.`);
        this.dialogRef.close(activoActualizado);
      },
      error: (err: any) => {
        this.enviando.set(false);
        this.notification.error('Error en el traslado', err?.error?.message || 'No se pudo procesar');
      },
    });
  }
}

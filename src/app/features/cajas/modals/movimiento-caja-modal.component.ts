import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CajasService } from '../../../core/services/cajas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SesionCajaItem } from '../../../core/models/cajas.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-movimiento-caja-modal',
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
      <!-- Cabecera -->
      <div class="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <mat-icon class="text-2xl">payments</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Caja Chica
            </span>
            <h3 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">Movimiento de Efectivo</h3>
            <p class="text-xs text-slate-500">Sesión #{{ data.sesionCajaId }} - {{ data.codigoCaja }}</p>
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

      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        <!-- Tipo de Movimiento -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-2">Tipo de Operación *</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="setTipo('EGRESO')"
              [class.bg-rose-50]="form.get('tipoMovimiento')?.value === 'EGRESO'"
              [class.border-rose-400]="form.get('tipoMovimiento')?.value === 'EGRESO'"
              [class.text-rose-700]="form.get('tipoMovimiento')?.value === 'EGRESO'"
              class="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <mat-icon class="!text-sm !w-4 !h-4">arrow_downward</mat-icon>
              <span>Egreso / Gasto Menor</span>
            </button>
            <button
              type="button"
              (click)="setTipo('INGRESO')"
              [class.bg-emerald-50]="form.get('tipoMovimiento')?.value === 'INGRESO'"
              [class.border-emerald-400]="form.get('tipoMovimiento')?.value === 'INGRESO'"
              [class.text-emerald-700]="form.get('tipoMovimiento')?.value === 'INGRESO'"
              class="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <mat-icon class="!text-sm !w-4 !h-4">arrow_upward</mat-icon>
              <span>Ingreso / Reposición</span>
            </button>
          </div>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Monto en Efectivo (Q) *</label>
          <mat-form-field appearance="outline" class="w-full">
            <span matPrefix class="text-slate-400 font-bold mr-1">Q</span>
            <input
              matInput
              type="text"
              formControlName="monto"
              appOnlyNumbers
              [allowDecimals]="true"
              placeholder="0.00"
            />
            @if (form.get('monto')?.hasError('required') && form.get('monto')?.touched) {
              <mat-error class="text-2xs">El monto es obligatorio</mat-error>
            }
            @if ((form.get('monto')?.hasError('min') || form.get('monto')?.hasError('montoInvalido')) && form.get('monto')?.touched) {
              <mat-error class="text-2xs">Debe ser un valor positivo mayor a 0</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Motivo / Justificación *</label>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              matInput
              rows="2"
              formControlName="descripcion"
              placeholder="Ej. Compra de bolsas, artículos de limpieza, reposición de sencillo..."
            ></textarea>
            @if (form.get('descripcion')?.hasError('required') && form.get('descripcion')?.touched) {
              <mat-error class="text-2xs">El motivo es obligatorio</mat-error>
            }
            @if ((form.get('descripcion')?.hasError('soloNumeros') || form.get('descripcion')?.hasError('requiereLetras')) && form.get('descripcion')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese texto descriptivo.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Acciones -->
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
            <span>{{ guardando() ? 'Guardando...' : 'Registrar Movimiento' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class MovimientoCajaModalComponent {
  readonly data: SesionCajaItem = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MovimientoCajaModalComponent>);
  private readonly cajasService = inject(CajasService);
  private readonly notification = inject(NotificationService);

  readonly guardando = signal<boolean>(false);

  readonly form: FormGroup = this.fb.group({
    tipoMovimiento: ['EGRESO', [Validators.required]],
    monto: [null, [Validators.required, CustomValidators.montoPositivo()]],
    descripcion: ['', [Validators.required, Validators.minLength(3), CustomValidators.textoConLetras()]],
    metodoPagoId: [1],
  });

  setTipo(tipo: 'INGRESO' | 'EGRESO'): void {
    this.form.patchValue({ tipoMovimiento: tipo });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);

    const val = this.form.value;
    this.cajasService
      .registrarMovimiento(this.data.sesionCajaId, {
        tipoMovimiento: val.tipoMovimiento,
        monto: Number(val.monto),
        descripcion: val.descripcion.trim(),
        metodoPagoId: Number(val.metodoPagoId || 1),
        referenciaTipo: val.tipoMovimiento === 'EGRESO' ? 'GASTO_MENOR' : 'REPOSICION_SENCILLO',
      })
      .subscribe({
        next: (res: any) => {
          this.guardando.set(false);
          this.dialogRef.close(true);
          setTimeout(() => {
            this.notification.success(
              'Movimiento Registrado',
              `Se registró ${res.tipoMovimiento} por Q ${Number(res.monto).toFixed(2)} correctamente.`
            );
          }, 80);
        },
        error: (err: any) => {
          this.notification.error('Error al registrar movimiento', err?.error?.message || 'No se pudo guardar');
          this.guardando.set(false);
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

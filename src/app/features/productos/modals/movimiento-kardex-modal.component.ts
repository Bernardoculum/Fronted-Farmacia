import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductosService } from '../../../core/services/productos.service';
import { ProductoListItem, MovimientoKardexDto } from '../../../core/models/producto.models';

@Component({
  selector: 'app-movimiento-kardex-modal',
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
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-xl w-full">
      <!-- Encabezado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">sync_alt</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded">
              Operación Transaccional
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              Nuevo Movimiento de Inventario
            </h2>
            <p class="text-xs text-slate-500 truncate max-w-sm">{{ data.nombre }} ({{ data.codigoProducto }})</p>
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Alerta de Error -->
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs shadow-xs">
          <mat-icon class="text-rose-500 shrink-0 text-lg">error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Formulario Reactivo de Movimiento -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3.5">
        
        <!-- Sucursal y Tipo de Movimiento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Sucursal Destino *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="sucursalId">
                <mat-option [value]="1">Sucursal Zona 10 Centro</mat-option>
                <mat-option [value]="2">Stand Gasolinera Mixco Norte</mat-option>
                <mat-option [value]="3">Sucursal Antigua Calzada</mat-option>
                <mat-option [value]="4">Sucursal Xela Los Altos</mat-option>
              </mat-select>
              @if (form.get('sucursalId')?.hasError('required') && form.get('sucursalId')?.touched) {
                <mat-error>La sucursal es obligatoria</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Tipo de Movimiento *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="tipoMovimiento">
                <mat-option value="ENTRADA">📥 ENTRADA (Ingreso stock)</mat-option>
                <mat-option value="SALIDA">📤 SALIDA (Retiro stock)</mat-option>
                <mat-option value="AJUSTE">⚖️ AJUSTE (Calibración)</mat-option>
              </mat-select>
              @if (form.get('tipoMovimiento')?.hasError('required') && form.get('tipoMovimiento')?.touched) {
                <mat-error>El tipo es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Número de Lote y Fecha de Vencimiento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Número de Lote *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput formControlName="numeroLote" placeholder="Ej. LOT-2026-A1" />
              @if (form.get('numeroLote')?.hasError('required') && form.get('numeroLote')?.touched) {
                <mat-error>El lote es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Fecha de Vencimiento *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="date" formControlName="fechaVencimiento" />
              @if (form.get('fechaVencimiento')?.hasError('required') && form.get('fechaVencimiento')?.touched) {
                <mat-error>La fecha es obligatoria</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Cantidad y Costo Unitario -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Cantidad a Operar *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="number" min="1" formControlName="cantidad" placeholder="0" />
              @if (form.get('cantidad')?.hasError('required') && form.get('cantidad')?.touched) {
                <mat-error>La cantidad es obligatoria</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Costo Unitario (Q)</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="number" min="0" step="0.01" formControlName="costoUnitario" placeholder="0.00" />
            </mat-form-field>
          </div>
        </div>

        <!-- Observación / Motivo -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Observación o Motivo</label>
          <mat-form-field appearance="outline" class="w-full">
            <input matInput formControlName="observacion" placeholder="Ej. Ingreso por compra a distribuidor, reabastecimiento..." />
          </mat-form-field>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" mat-button (click)="dialogRef.close()" class="!rounded-xl">
            Cancelar
          </button>
          
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || saving()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            @if (saving()) {
              <mat-spinner diameter="18" class="text-white mr-2"></mat-spinner>
              <span>Procesando...</span>
            } @else {
              <span>Confirmar Movimiento</span>
            }
          </button>
        </div>

      </form>
    </div>
  `,
})
export class MovimientoKardexModalComponent {
  readonly dialogRef = inject(MatDialogRef<MovimientoKardexModalComponent>);
  readonly data = inject<ProductoListItem>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    sucursalId: [1, [Validators.required]],
    tipoMovimiento: ['ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE', [Validators.required]],
    numeroLote: [this.data.lotes?.[0]?.numeroLote || '', [Validators.required]],
    fechaVencimiento: [this.data.lotes?.[0]?.fechaVencimiento || '2027-12-31', [Validators.required]],
    cantidad: [10, [Validators.required, Validators.min(1)]],
    costoUnitario: [this.data.lotes?.[0]?.costoUnitario || 10.0],
    observacion: [''],
  });

  guardar(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    const dto: MovimientoKardexDto = {
      productoId: this.data.productoId,
      sucursalId: Number(val.sucursalId),
      tipoMovimiento: val.tipoMovimiento!,
      numeroLote: val.numeroLote!.trim(),
      fechaVencimiento: val.fechaVencimiento!,
      cantidad: Number(val.cantidad),
      costoUnitario: Number(val.costoUnitario) || undefined,
      referenciaTipo: 'MANUAL',
      observacion: val.observacion?.trim() || undefined,
    };

    this.productosService.registrarMovimientoKardex(dto).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al procesar el movimiento en el inventario.'
        );
      },
    });
  }
}

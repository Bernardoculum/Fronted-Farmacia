import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MovimientoKardexItem } from '../../core/models/kardex.models';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';

@Component({
  selector: 'app-kardex-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, FormatEnumPipe],
  template: `
    <div class="p-6 bg-white rounded-2xl max-w-xl mx-auto space-y-5">
      <!-- Cabecera del Modal -->
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            [ngClass]="data.tipoMovimiento === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'"
          >
            <mat-icon class="!w-5 !h-5 !text-xl">
              {{ data.tipoMovimiento === 'ENTRADA' ? 'arrow_downward' : 'arrow_upward' }}
            </mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-black text-slate-800 tracking-tight">Detalle de Movimiento</h3>
              <span class="font-mono text-2xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                No. {{ data.movimientoInventarioId }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Registrado el {{ data.fechaMovimiento | date:'dd/MM/yyyy HH:mm:ss' }}
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="dialogRef.close()"
          class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <mat-icon class="!w-5 !h-5 !text-lg">close</mat-icon>
        </button>
      </div>

      <!-- Medicamento & Lote -->
      <div class="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-2">
        <div class="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Medicamento Afectado</div>
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-sm font-black text-slate-800">{{ data.medicamento }}</div>
            <div class="text-2xs font-mono text-slate-400">Código: {{ data.codigoProducto }}</div>
          </div>
          <div class="text-right">
            <span class="text-2xs font-bold text-slate-500">Lote No.</span>
            <div class="font-mono text-xs font-black text-slate-800">{{ data.numeroLote }}</div>
          </div>
        </div>
      </div>

      <!-- Métricas de Inventario (Saldos) -->
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <div class="text-3xs font-bold text-slate-400 uppercase">Saldo Anterior</div>
          <div class="text-base font-black text-slate-700 mt-0.5">{{ data.cantidadAnterior }}</div>
        </div>

        <div
          class="p-3 rounded-xl border"
          [ngClass]="data.tipoMovimiento === 'ENTRADA' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-sky-50/50 border-sky-200 text-sky-700'"
        >
          <div class="text-3xs font-bold uppercase">
            {{ data.tipoMovimiento === 'ENTRADA' ? 'Ingreso (+)' : 'Egreso (-)' }}
          </div>
          <div class="text-base font-black mt-0.5">
            {{ data.tipoMovimiento === 'ENTRADA' ? '+' : '-' }}{{ data.cantidad }}
          </div>
        </div>

        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <div class="text-3xs font-bold text-slate-400 uppercase">Nuevo Saldo</div>
          <div class="text-base font-black text-slate-900 mt-0.5">{{ data.cantidadNueva }}</div>
        </div>
      </div>

      <!-- Trazabilidad Operativa -->
      <div class="space-y-2 text-xs">
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-slate-400 font-semibold text-2xs uppercase">Sucursal</span>
          <span class="font-bold text-slate-800 flex items-center gap-1">
            <mat-icon class="!w-4 !h-4 !text-sm text-emerald-600">storefront</mat-icon>
            {{ data.sucursal }}
          </span>
        </div>

        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-slate-400 font-semibold text-2xs uppercase">Operación / Origen</span>
          <span class="text-2xs font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            {{ (data.referenciaTipo || 'General') | formatEnum }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-slate-400 font-semibold text-3xs uppercase">Costo Unitario</div>
            <div class="font-mono text-xs font-bold text-slate-700 mt-0.5">
              Q {{ data.costoUnitario | number:'1.2-2' }}
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-slate-400 font-semibold text-3xs uppercase">Total Valorizado</div>
            <div class="font-mono text-xs font-black text-slate-900 mt-0.5">
              Q {{ data.totalValorizado | number:'1.2-2' }}
            </div>
          </div>
        </div>

        @if (data.observacion) {
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-slate-400 font-semibold text-3xs uppercase mb-1">Observaciones / Justificación</div>
            <div class="text-slate-700 italic text-2xs leading-relaxed">
              {{ data.observacion }}
            </div>
          </div>
        }
      </div>

      <!-- Pie del Modal: Botón Cancelar/Cerrar en Rojo -->
      <div class="pt-3 border-t border-slate-100 flex justify-end">
        <button
          type="button"
          (click)="dialogRef.close()"
          class="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <mat-icon class="!w-4 !h-4 !text-sm">close</mat-icon>
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  `,
})
export class KardexDetalleModalComponent {
  readonly dialogRef = inject(MatDialogRef<KardexDetalleModalComponent>);
  readonly data: MovimientoKardexItem = inject(MAT_DIALOG_DATA);
}

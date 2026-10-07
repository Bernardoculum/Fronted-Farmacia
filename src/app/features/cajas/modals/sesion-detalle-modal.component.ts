import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CajasService } from '../../../core/services/cajas.service';
import { SesionCajaItem, SesionDetalleResponse } from '../../../core/models/cajas.models';
import { FormatEnumPipe } from '../../../shared/pipes/format-enum.pipe';

@Component({
  selector: 'app-sesion-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, FormatEnumPipe],
  template: `
    <div class="p-6 bg-white rounded-2xl max-w-2xl w-full">
      <!-- Cabecera -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <mat-icon class="!text-xl !w-5 !h-5">receipt_long</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-800">Auditoría de Turno #{{ data.sesionCajaId }}</h3>
            <p class="text-xs text-slate-500">{{ data.codigoCaja }} - {{ data.sucursal }}</p>
          </div>
        </div>
        <button
          type="button"
          (click)="cerrar()"
          class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          <mat-icon class="!text-lg !w-4 !h-4">close</mat-icon>
        </button>
      </div>

      <!-- Spinner de carga -->
      @if (cargando()) {
        <div class="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <mat-icon class="animate-spin !text-2xl !w-6 !h-6 text-emerald-600">sync</mat-icon>
          <span class="text-xs font-semibold">Cargando desglose de movimientos...</span>
        </div>
      } @else if (detalle()) {
        <div class="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <!-- Metadatos de la Sesión -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span class="text-3xs text-slate-400 font-semibold uppercase block">Cajero Apertura</span>
              <span class="font-bold text-slate-800 truncate block">{{ detalle()?.empleadoApertura }}</span>
            </div>
            <div>
              <span class="text-3xs text-slate-400 font-semibold uppercase block">Apertura</span>
              <span class="font-bold text-slate-700 block">{{ detalle()?.fechaApertura | date:'short' }}</span>
            </div>
            <div>
              <span class="text-3xs text-slate-400 font-semibold uppercase block">Cajero Cierre</span>
              <span class="font-bold text-slate-800 truncate block">{{ detalle()?.empleadoCierre || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-3xs text-slate-400 font-semibold uppercase block">Estado</span>
              <span
                class="text-2xs font-extrabold px-2 py-0.5 rounded-full border inline-block"
                [ngClass]="detalle()?.estado === 'ABIERTA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'"
              >
                {{ detalle()?.estado | formatEnum }}
              </span>
            </div>
          </div>

          <!-- Métricas Financieras y Balance -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span class="text-3xs text-slate-400 font-semibold uppercase block">Fondo Inicial</span>
              <span class="text-base font-black text-slate-800">Q {{ (detalle()?.saldoInicial || 0).toFixed(2) }}</span>
            </div>
            <div class="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span class="text-3xs text-emerald-700 font-semibold uppercase block">Total Ingresos</span>
              <span class="text-base font-black text-emerald-800">Q {{ (detalle()?.totalIngresos || 0).toFixed(2) }}</span>
            </div>
            <div class="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
              <span class="text-3xs text-rose-700 font-semibold uppercase block">Total Egresos</span>
              <span class="text-base font-black text-rose-800">Q {{ (detalle()?.totalEgresos || 0).toFixed(2) }}</span>
            </div>
            <div class="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <span class="text-3xs text-amber-800 font-semibold uppercase block">Diferencia / Arqueo</span>
              <span class="text-base font-black" [ngClass]="(detalle()?.diferencia || 0) < 0 ? 'text-rose-700' : 'text-slate-800'">
                {{ (detalle()?.diferencia !== null) ? ((detalle()?.diferencia || 0) >= 0 ? '+' : '') + 'Q ' + (detalle()?.diferencia || 0).toFixed(2) : 'Turno Activo' }}
              </span>
            </div>
          </div>

          <!-- Desglose por Método de Pago -->
          @if (detalle()?.resumenMetodosPago) {
            <div class="p-3 rounded-xl bg-sky-50/40 border border-sky-100">
              <div class="text-2xs font-bold text-sky-900 uppercase tracking-wider mb-2">Ingresos por Método de Cobro</div>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span class="text-3xs text-slate-500 block">Efectivo:</span>
                  <span class="font-black text-slate-800">Q {{ (detalle()?.resumenMetodosPago?.efectivo || 0).toFixed(2) }}</span>
                </div>
                <div>
                  <span class="text-3xs text-slate-500 block">Tarjeta POS:</span>
                  <span class="font-black text-slate-800">Q {{ (detalle()?.resumenMetodosPago?.tarjeta || 0).toFixed(2) }}</span>
                </div>
                <div>
                  <span class="text-3xs text-slate-500 block">Transferencia / Depósito:</span>
                  <span class="font-black text-slate-800">Q {{ (detalle()?.resumenMetodosPago?.transferencia || 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Tabla de Movimientos -->
          <div>
            <div class="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>Libro de Movimientos de la Sesión</span>
              <span class="text-3xs font-semibold text-slate-400">Total: {{ (detalle()?.movimientos || []).length }}</span>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">Hora</th>
                    <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">Tipo</th>
                    <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">Descripción</th>
                    <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">Método</th>
                    <th class="py-2.5 px-3 text-right text-3xs font-semibold uppercase text-slate-500">Monto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (m of detalle()?.movimientos || []; track m.movimientoCajaId) {
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {{ m.fechaMovimiento | date:'shortTime' }}
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span
                          class="text-3xs font-extrabold px-2 py-0.5 rounded-full border"
                          [ngClass]="m.tipoMovimiento === 'INGRESO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                        >
                          {{ m.tipoMovimiento }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-slate-800 font-medium max-w-[200px] truncate">
                        {{ m.descripcion }}
                      </td>
                      <td class="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {{ m.metodoPago }}
                      </td>
                      <td
                        class="py-2.5 px-3 text-right font-black whitespace-nowrap"
                        [ngClass]="m.tipoMovimiento === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'"
                      >
                        {{ m.tipoMovimiento === 'INGRESO' ? '+' : '-' }}Q {{ m.monto.toFixed(2) }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="py-6 text-center text-slate-400 text-xs">
                        No hay movimientos registrados en este turno todavía.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Pie del modal -->
      <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span class="text-3xs text-slate-400">ID Técnico Sesión: #{{ data.sesionCajaId }}</span>
        <button
          type="button"
          (click)="cerrar()"
          class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  `,
})
export class SesionDetalleModalComponent implements OnInit {
  readonly data: SesionCajaItem = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SesionDetalleModalComponent>);
  private readonly cajasService = inject(CajasService);

  readonly cargando = signal<boolean>(true);
  readonly detalle = signal<SesionDetalleResponse | null>(null);

  ngOnInit(): void {
    this.cajasService.obtenerDetalleSesion(this.data.sesionCajaId).subscribe({
      next: (res) => {
        this.detalle.set(res);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

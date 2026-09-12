import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProductosService } from '../../../core/services/productos.service';
import { KardexResponse, ProductoListItem } from '../../../core/models/producto.models';

@Component({
  selector: 'app-kardex-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl w-full">
      <!-- Cabecera del Kardex -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">auto_stories</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {{ data.codigoProducto }}
              </span>
              <span class="text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                Kardex Oficial
              </span>
            </div>
            <h2 class="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              Bitácora de Kardex: {{ data.nombre }}
            </h2>
            <p class="text-xs text-slate-500">Historial inmutable de movimientos de inventario</p>
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600 self-end sm:self-auto">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Filtro y Resumen -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-600">Total de movimientos:</span>
          <span class="text-xs font-extrabold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800">
            {{ kardex()?.totalMovimientos || 0 }} registros
          </span>
        </div>

        <!-- Selector de Sucursal -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Filtrar por Sucursal:</label>
          <select
            (change)="onSucursalChange($event)"
            class="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las Sucursales</option>
            <option value="1">Sucursal Zona 10 Centro</option>
            <option value="2">Stand Gasolinera Mixco Norte</option>
            <option value="3">Sucursal Antigua Calzada</option>
            <option value="4">Sucursal Xela Los Altos</option>
          </select>
        </div>
      </div>

      <!-- Estado de Carga -->
      @if (loading()) {
        <div class="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
          <mat-spinner diameter="32" class="text-indigo-600 mb-2"></mat-spinner>
          <span>Consultando bitácora de Kardex...</span>
        </div>
      } @else if (!kardex() || kardex()!.historial.length === 0) {
        <div class="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
          <mat-icon class="text-4xl text-slate-300 mb-2">history_toggle_off</mat-icon>
          <p class="font-semibold text-slate-600">No hay movimientos registrados para este medicamento.</p>
          <p class="text-2xs text-slate-400 mt-1">Registra una entrada de inventario para inicializar el Kardex.</p>
        </div>
      } @else {
        <!-- Tabla Cronológica de Kardex -->
        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs max-h-96">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 text-2xs">
              <tr>
                <th class="py-2.5 px-3">Fecha y Hora</th>
                <th class="py-2.5 px-3">Tipo</th>
                <th class="py-2.5 px-3">Lote</th>
                <th class="py-2.5 px-3">Sucursal</th>
                <th class="py-2.5 px-3 text-right">Cant. Operada</th>
                <th class="py-2.5 px-3 text-right">Saldo Anterior</th>
                <th class="py-2.5 px-3 text-right">Saldo Nuevo</th>
                <th class="py-2.5 px-3">Motivo / Ref.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (item of kardex()!.historial; track item.movimientoId) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <!-- Fecha -->
                  <td class="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {{ item.fecha | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <!-- Tipo de Movimiento con Badge -->
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    @if (item.tipoMovimiento === 'ENTRADA') {
                      <span class="px-2 py-0.5 text-2xs font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ENTRADA
                      </span>
                    } @else if (item.tipoMovimiento === 'SALIDA') {
                      <span class="px-2 py-0.5 text-2xs font-extrabold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        SALIDA
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 text-2xs font-extrabold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        AJUSTE
                      </span>
                    }
                  </td>
                  <!-- Lote -->
                  <td class="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                    {{ item.lote }}
                  </td>
                  <!-- Sucursal -->
                  <td class="py-2.5 px-3 text-slate-700 max-w-[140px] truncate" [title]="item.sucursal">
                    {{ item.sucursal }}
                  </td>
                  <!-- Cantidad Operada -->
                  <td class="py-2.5 px-3 text-right font-black whitespace-nowrap"
                    [ngClass]="{
                      'text-emerald-600': item.tipoMovimiento === 'ENTRADA',
                      'text-rose-600': item.tipoMovimiento === 'SALIDA',
                      'text-blue-600': item.tipoMovimiento === 'AJUSTE'
                    }">
                    {{ item.tipoMovimiento === 'ENTRADA' ? '+' : (item.tipoMovimiento === 'SALIDA' ? '-' : '') }}{{ item.cantidadOperada }}
                  </td>
                  <!-- Saldo Anterior -->
                  <td class="py-2.5 px-3 text-right text-slate-400 font-medium whitespace-nowrap">
                    {{ item.saldoAnterior }}
                  </td>
                  <!-- Saldo Nuevo -->
                  <td class="py-2.5 px-3 text-right font-extrabold text-slate-800 whitespace-nowrap">
                    {{ item.saldoNuevo }}
                  </td>
                  <!-- Observación / Referencia -->
                  <td class="py-2.5 px-3 text-slate-500 text-2xs max-w-[180px] truncate" [title]="item.observacion || item.referenciaTipo || 'Sin notas'">
                    <span class="font-bold text-slate-600">{{ item.referenciaTipo || 'MANUAL' }}:</span>
                    {{ item.observacion || 'Sin observaciones' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Pie del Modal -->
      <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end">
        <button mat-flat-button (click)="dialogRef.close()" class="!rounded-xl !px-5">
          Cerrar
        </button>
      </div>
    </div>
  `,
})
export class KardexModalComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<KardexModalComponent>);
  readonly data = inject<ProductoListItem>(MAT_DIALOG_DATA);
  private readonly productosService = inject(ProductosService);

  readonly kardex = signal<KardexResponse | null>(null);
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.cargarKardex();
  }

  cargarKardex(sucursalId?: number): void {
    this.loading.set(true);
    this.productosService.getKardexByProducto(this.data.productoId, sucursalId).subscribe({
      next: (res) => {
        this.kardex.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSucursalChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const sucursalId = val ? Number(val) : undefined;
    this.cargarKardex(sucursalId);
  }
}

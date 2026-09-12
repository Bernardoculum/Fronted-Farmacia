import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProductoListItem } from '../../../core/models/producto.models';

@Component({
  selector: 'app-producto-detail-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-2xl w-full">
      <!-- Encabezado del Modal -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">medication</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {{ data.codigoProducto }}
              </span>
              @if (data.requiereReceta === 'S') {
                <span class="text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  Receta Obligatoria
                </span>
              } @else {
                <span class="text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Venta Libre
                </span>
              }
            </div>
            <h2 class="text-lg sm:text-xl font-extrabold text-slate-800 mt-1">{{ data.nombre }}</h2>
            @if (data.presentacion || data.concentracion) {
      <p class="text-xs text-slate-500 font-medium">{{ data.presentacion }} {{ data.concentracion ? '• ' + data.concentracion : '' }}</p>
    }
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Ficha Técnica Resumida -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-5 text-xs">
        <div>
          <span class="text-slate-400 block font-semibold">Presentación</span>
          <strong class="text-slate-700">{{ data.presentacion || 'N/A' }}</strong>
        </div>
        <div>
          <span class="text-slate-400 block font-semibold">Gramaje</span>
          <strong class="text-slate-700">{{ data.concentracion || 'N/A' }}</strong>
        </div>
        <div>
          <span class="text-slate-400 block font-semibold">Laboratorio</span>
          <strong class="text-slate-700">{{ data.laboratorio || 'N/A' }}</strong>
        </div>
        <div>
          <span class="text-slate-400 block font-semibold">Precio Venta</span>
          <strong class="text-teal-700 text-sm">Q {{ data.precioVenta | number:'1.2-2' }}</strong>
        </div>
      </div>

      <!-- Sección de Lotes e Inventario por Sucursal -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <mat-icon class="text-base text-teal-600">warehouse</mat-icon>
            <span>Existencias por Lote y Sucursal</span>
          </h3>
          <span class="text-xs font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
            Stock Total: {{ data.stockTotal }} unidades
          </span>
        </div>

        @if (!data.lotes || data.lotes.length === 0) {
          <div class="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
            <mat-icon class="text-3xl text-slate-300 mb-1">inventory</mat-icon>
            <p>No hay lotes registrados para este producto.</p>
          </div>
        } @else {
          <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
            @for (lote of data.lotes; track lote.loteId) {
              <div class="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs hover:border-teal-300 transition-colors">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-base text-slate-400">qr_code</mat-icon>
                    <span class="font-mono text-xs font-bold text-slate-800">Lote: {{ lote.numeroLote }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-2xs">
                    <span class="text-slate-400">Vence:</span>
                    <strong class="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{{ lote.fechaVencimiento }}</strong>
                    <span class="text-slate-400 ml-2">Costo:</span>
                    <strong class="text-slate-700">Q {{ lote.costoUnitario | number:'1.2-2' }}</strong>
                  </div>
                </div>

                <!-- Desglose por Sucursales del Lote -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  @for (inv of lote.inventarios; track inv.sucursalId) {
                    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <span class="font-medium text-slate-600 truncate max-w-[150px]">{{ inv.sucursal }}</span>
                      <div class="text-right">
                        <span class="font-bold text-teal-700">{{ inv.disponible }} disp.</span>
                        @if (inv.reservado && inv.reservado > 0) {
                          <span class="text-2xs text-amber-600 block">({{ inv.reservado }} res.)</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Pie del Modal -->
      <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end">
        <button mat-flat-button (click)="dialogRef.close()" class="!rounded-xl !px-5">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProductoDetailModalComponent {
  readonly dialogRef = inject(MatDialogRef<ProductoDetailModalComponent>);
  readonly data = inject<ProductoListItem>(MAT_DIALOG_DATA);
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivosService } from '../../../core/services/activos.service';
import { ActivoFijo } from '../../../core/models/activos.models';
import { FormatEnumPipe } from '../../../shared/pipes/format-enum.pipe';

@Component({
  selector: 'app-activo-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, FormatEnumPipe],
  template: `
    <div class="p-6 bg-white rounded-2xl max-w-2xl w-full">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <mat-icon class="!text-xl !w-5 !h-5">visibility</mat-icon>
          </div>
          <div>
            <h2 class="text-lg font-black text-slate-800 tracking-tight">Ficha Patrimonial de Activo</h2>
            <p class="text-xs text-slate-500">Detalle patrimonial, cálculo de depreciación y trazabilidad</p>
          </div>
        </div>
        <button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
          <mat-icon class="!text-xl !w-5 !h-5">close</mat-icon>
        </button>
      </div>

      @if (cargando()) {
        <div class="py-12 flex justify-center text-slate-400">
          <mat-icon class="animate-spin">sync</mat-icon>
        </div>
      } @else if (activo()) {
        <div class="space-y-5">
          <!-- Banner cabecera -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Denominación</span>
              <h3 class="text-base font-black text-slate-800">{{ activo()?.nombre }}</h3>
              <div class="text-xs text-slate-500 mt-0.5">
                Código: <span class="font-bold text-slate-700">{{ activo()?.codigoActivo }}</span> |
                Categoría: <span class="font-bold text-emerald-700">{{ activo()?.categoriaActivo?.nombre }}</span>
              </div>
            </div>
            <div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
                [ngClass]="{
                  'bg-emerald-50 text-emerald-700 border-emerald-200': activo()?.estado === 'OPERATIVO',
                  'bg-amber-50 text-amber-700 border-amber-200': activo()?.estado === 'EN_MANTENIMIENTO',
                  'bg-sky-50 text-sky-700 border-sky-200': activo()?.estado === 'EN_TRANSITO',
                  'bg-rose-50 text-rose-700 border-rose-200': activo()?.estado === 'DADO_DE_BAJA'
                }">
                {{ activo()?.estado | formatEnum }}
              </span>
            </div>
          </div>

          <!-- Métricas Financieras y Depreciación -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-2xs font-extrabold text-slate-400 uppercase">Costo Adquisición</span>
              <div class="text-lg font-black text-slate-800">Q {{ (activo()?.costoAdquisicion || 0) | number:'1.2-2' }}</div>
              <div class="text-2xs text-slate-500 mt-0.5">Fecha: {{ activo()?.fechaAdquisicion | date:'dd/MM/yyyy' }}</div>
            </div>

            <div class="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
              <span class="text-2xs font-extrabold text-rose-500 uppercase">Deprec. Acumulada</span>
              <div class="text-lg font-black text-rose-700">Q {{ (activo()?.depreciacionAcumulada || 0) | number:'1.2-2' }}</div>
              <div class="text-2xs text-rose-500 mt-0.5">Tasa anual: {{ activo()?.categoriaActivo?.porcentajeDepreciacionAnual }}%</div>
            </div>

            <div class="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span class="text-2xs font-extrabold text-emerald-600 uppercase">Valor en Libros Actual</span>
              <div class="text-lg font-black text-emerald-700">Q {{ (activo()?.valorLibros || 0) | number:'1.2-2' }}</div>
              <div class="text-2xs text-emerald-600 mt-0.5">Valor residual neto</div>
            </div>
          </div>

          <!-- Datos Técnicos -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-100 text-xs">
            <div>
              <span class="text-slate-400 block text-2xs uppercase">Marca</span>
              <span class="font-bold text-slate-700">{{ activo()?.marca || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-2xs uppercase">Modelo</span>
              <span class="font-bold text-slate-700">{{ activo()?.modelo || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-2xs uppercase">No. Serie</span>
              <span class="font-bold text-slate-700">{{ activo()?.numeroSerie || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-2xs uppercase">Custodio Asignado</span>
              <span class="font-bold text-slate-700">{{ activo()?.responsableAsignado || 'Sin asignar' }}</span>
            </div>
          </div>

          <!-- Trazabilidad e Historial de Movimientos -->
          <div>
            <h4 class="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <mat-icon class="!text-sm !w-4 !h-4 text-slate-500">history</mat-icon>
              <span>Historial de Custodia y Traslados</span>
            </h4>

            <div class="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              @if (!activo()?.historial || activo()?.historial?.length === 0) {
                <div class="p-4 text-center text-xs text-slate-400">Sin movimientos registrados.</div>
              } @else {
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th class="py-2 px-3">Fecha</th>
                      <th class="py-2 px-3">Tipo</th>
                      <th class="py-2 px-3">Destino</th>
                      <th class="py-2 px-3">Responsable</th>
                      <th class="py-2 px-3">Motivo</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (h of activo()?.historial; track h.id) {
                      <tr class="hover:bg-slate-50/60">
                        <td class="py-2 px-3 text-slate-500">{{ h.creadoEn | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td class="py-2 px-3 font-semibold text-slate-700">{{ h.tipoMovimiento | formatEnum }}</td>
                        <td class="py-2 px-3 text-emerald-700 font-semibold">{{ h.sucursalDestino?.nombre || 'N/A' }}</td>
                        <td class="py-2 px-3 text-slate-600">{{ h.responsable || 'N/A' }}</td>
                        <td class="py-2 px-3 text-slate-500 italic">{{ h.motivo || 'N/A' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        </div>
      }

      <div class="flex justify-end pt-4 border-t border-slate-100 mt-5">
        <button
          type="button"
          (click)="dialogRef.close()"
          class="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  `
})
export class ActivoDetalleModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ActivoDetalleModalComponent>);
  data = inject(MAT_DIALOG_DATA) as { activoId: number };
  private activosService = inject(ActivosService);

  activo = signal<ActivoFijo | null>(null);
  cargando = signal<boolean>(true);

  ngOnInit(): void {
    this.activosService.getActivoById(this.data.activoId).subscribe({
      next: (res) => {
        this.activo.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }
}

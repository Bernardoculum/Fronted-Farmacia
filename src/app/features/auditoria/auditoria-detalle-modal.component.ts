import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuditoriaItem } from '../../core/models/auditoria.models';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';

@Component({
  selector: 'app-auditoria-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, FormatEnumPipe],
  template: `
    <div class="p-6 bg-white rounded-2xl max-w-xl mx-auto space-y-5">
      <!-- Cabecera del Modal -->
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <mat-icon class="!w-5 !h-5 !text-xl">security</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-black text-slate-800 tracking-tight">Evento Forense de Auditoría</h3>
              <span class="font-mono text-2xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                No. {{ data.auditoriaId }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Registrado el {{ data.fechaEvento | date:'dd/MM/yyyy HH:mm:ss' }}
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

      <!-- Datos Principales de la Operación -->
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div class="text-3xs font-bold text-slate-400 uppercase">Operación</div>
          <div class="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
            <span class="text-2xs font-extrabold px-2 py-0.5 rounded-full border bg-white shadow-2xs">
              {{ data.operacion | formatEnum }}
            </span>
          </div>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div class="text-3xs font-bold text-slate-400 uppercase">Operador Responsable</div>
          <div class="font-bold text-slate-800 mt-0.5">
            @{{ data.usuarioBd || 'SYSTEM' }}
          </div>
        </div>
      </div>

      <!-- Trazabilidad de Red y Origen -->
      <div class="space-y-2 text-xs">
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-slate-400 font-semibold text-2xs uppercase">Tabla Afectada</span>
          <span class="font-mono font-bold text-slate-800">{{ data.tablaAfectada }}</span>
        </div>

        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-slate-400 font-semibold text-2xs uppercase">Módulo</span>
          <span class="font-bold text-slate-700">{{ data.modulo || 'Sistema Central' }}</span>
        </div>

        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-slate-400 font-semibold text-2xs uppercase">ID Registro Afectado</span>
          <span class="font-mono font-bold text-slate-800">{{ data.registroId || 'N/A' }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-slate-400 font-semibold text-3xs uppercase">IP Origen</div>
            <div class="font-mono text-xs font-bold text-slate-700 mt-0.5">
              {{ data.ipCliente || '127.0.0.1' }}
            </div>
          </div>

          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-slate-400 font-semibold text-3xs uppercase">Host / Servidor</div>
            <div class="font-mono text-xs font-bold text-slate-700 mt-0.5 truncate">
              {{ data.host || 'localhost' }}
            </div>
          </div>
        </div>

        @if (data.descripcion) {
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-slate-400 font-semibold text-3xs uppercase mb-1">Payload / Descripción del Cambio</div>
            <div class="text-slate-700 text-2xs font-mono leading-relaxed bg-white p-2 rounded-lg border border-slate-200 break-words whitespace-pre-wrap">
              {{ data.descripcion }}
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
export class AuditoriaDetalleModalComponent {
  readonly dialogRef = inject(MatDialogRef<AuditoriaDetalleModalComponent>);
  readonly data: AuditoriaItem = inject(MAT_DIALOG_DATA);
}

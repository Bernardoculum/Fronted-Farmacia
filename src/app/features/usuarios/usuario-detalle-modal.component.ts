import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { UserItem } from '../../core/models/users.models';

@Component({
  selector: 'app-usuario-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule, FormatEnumPipe],
  styles: [`
    :host {
      display: block;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
    }
  `],
  template: `
    <div class="p-0 bg-white w-full text-slate-800">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <mat-icon class="!w-5 !h-5 !text-lg">person</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800 tracking-tight">Ficha del Colaborador</h3>
            <p class="text-xs text-slate-500">Detalle de usuario y credenciales de acceso</p>
          </div>
        </div>
        <button
          type="button"
          (click)="dialogRef.close()"
          class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
        >
          <mat-icon class="!w-4 !h-4 !text-base">close</mat-icon>
        </button>
      </div>

      <!-- Perfil Destacado -->
      <div class="px-6 py-5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
            {{ getInitials(data.nombre, data.apellido) }}
          </div>
          <div>
            <div class="text-base font-black text-slate-800">{{ data.nombreCompleto }}</div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="font-mono font-bold text-xs bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                @{{ data.username }}
              </span>
              @if (data.puestoNombre) {
                <span class="text-xs text-slate-500 font-medium">{{ data.puestoNombre }}</span>
              }
            </div>
          </div>
        </div>

        <div>
          @if (data.estado === 'ACTIVO') {
            <span class="text-2xs font-extrabold rounded-full px-3 py-1 border bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Activo</span>
            </span>
          } @else {
            <span class="text-2xs font-extrabold rounded-full px-3 py-1 border bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Inactivo</span>
            </span>
          }
        </div>
      </div>

      <!-- Datos en Grid -->
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <!-- DPI -->
          <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <span class="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Documento (DPI)</span>
            <div class="text-xs font-bold text-slate-800 font-mono">
              {{ data.dpi || 'No registrado' }}
            </div>
          </div>

          <!-- Teléfono -->
          <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <span class="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Teléfono de Contacto</span>
            <div class="text-xs font-bold text-slate-800 font-mono">
              {{ data.telefono || 'No registrado' }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Rol Asignado -->
          <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <span class="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rol Asignado</span>
            <div>
              <span
                class="text-2xs font-extrabold rounded-full px-2.5 py-0.5 border inline-flex items-center gap-1"
                [ngClass]="{
                  'bg-purple-50 text-purple-700 border-purple-200': data.rolNombre === 'SUPER_ADMIN',
                  'bg-sky-50 text-sky-700 border-sky-200': data.rolNombre === 'GERENTE_SUCURSAL',
                  'bg-emerald-50 text-emerald-700 border-emerald-200': data.rolNombre === 'CAJERO',
                  'bg-amber-50 text-amber-700 border-amber-200': data.rolNombre === 'CALL_CENTER',
                  'bg-slate-100 text-slate-700 border-slate-300': data.rolNombre === 'AUDITOR'
                }"
              >
                <mat-icon class="!text-xs !w-3 !h-3">security</mat-icon>
                <span>{{ data.rolNombre | formatEnum }}</span>
              </span>
            </div>
          </div>

          <!-- Sucursal Vinculada -->
          <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <span class="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1">Sucursal Vinculada</span>
            <div class="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <mat-icon class="!w-4 !h-4 !text-sm text-emerald-600">storefront</mat-icon>
              <span>{{ data.sucursalNombre }}</span>
            </div>
          </div>
        </div>

        <!-- Registro de Auditoría: Último Acceso -->
        <div class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <span class="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Registro de Auditoría (Último Acceso)</span>
            <div class="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-mono">
              <mat-icon class="!w-4 !h-4 !text-sm text-slate-400">schedule</mat-icon>
              <span>
                {{ data.ultimoLogin ? (data.ultimoLogin | date:'dd/MM/yyyy HH:mm') : 'Sin registros de acceso previo' }}
              </span>
            </div>
          </div>
          @if (data.ultimoLogin) {
            <span class="text-3xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
              Registrado
            </span>
          }
        </div>
      </div>

      <!-- Footer: Botón neutro Cerrar en la esquina inferior derecha -->
      <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
        <button
          type="button"
          (click)="dialogRef.close()"
          class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
        >
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  `
})
export class UsuarioDetalleModalComponent {
  readonly dialogRef = inject(MatDialogRef<UsuarioDetalleModalComponent>);
  readonly data: UserItem = inject(MAT_DIALOG_DATA);

  getInitials(nombre?: string, apellido?: string): string {
    const n = (nombre || '').trim().charAt(0);
    const a = (apellido || '').trim().charAt(0);
    return (n + a).toUpperCase() || 'U';
  }
}

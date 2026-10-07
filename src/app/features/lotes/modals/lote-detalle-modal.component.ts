import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoteItem } from '../../../core/models/lote.models';
import { FormatEnumPipe, getBadgeColorClass } from '../../../shared/pipes/format-enum.pipe';
import { NotificationService } from '../../../core/services/notification.service';
import { LotesService } from '../../../core/services/lotes.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-lote-detalle-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, FormatEnumPipe],
  template: `
    <div class="p-5 sm:p-6 w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Encabezado Limpio -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <mat-icon class="text-xl leading-none">verified</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-black text-slate-800 leading-tight">
                Lote {{ data.numeroLote }}
              </h2>
              <span class="px-2.5 py-0.5 rounded-full text-2xs font-extrabold border" [ngClass]="badgeClass(data.estadoVencimiento)">
                {{ data.estadoVencimiento | formatEnum }}
              </span>
            </div>
            <p class="text-xs text-slate-500">Auditoría sanitaria, procedencia y rotación FEFO</p>
          </div>
        </div>

        <button mat-icon-button (click)="cerrar()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Ficha del Medicamento -->
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs">
            <mat-icon class="text-xl">medication</mat-icon>
          </div>
          <div>
            <span class="text-3xs uppercase font-bold text-slate-400 block tracking-wider">Medicamento</span>
            <span class="font-bold text-slate-800 text-sm block">{{ data.producto?.nombre }}</span>
            <span class="text-3xs text-slate-500 font-medium block">
              {{ data.producto?.codigoProducto }} • {{ data.producto?.presentacion || 'Caja' }} • {{ data.producto?.concentracion || 'Estándar' }}
            </span>
          </div>
        </div>

        <div class="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 w-full sm:w-auto">
          <span class="text-3xs uppercase font-bold text-slate-400 block">Precio al Público</span>
          <span class="text-sm font-black text-slate-800 font-mono">Q {{ (data.producto?.precioVenta || 0) | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Métricas de Auditoría: Calidad y Finanzas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        
        <!-- Tarjeta 1: Fechas FEFO -->
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div class="flex items-center gap-2 mb-1 text-slate-500">
            <mat-icon class="!text-sm !w-4 !h-4 text-amber-600">event</mat-icon>
            <span class="text-3xs font-bold uppercase tracking-wider">Caducidad FEFO</span>
          </div>
          <div class="font-mono font-black text-slate-800 text-sm">{{ data.fechaVencimiento }}</div>
          <div class="text-2xs font-semibold mt-0.5" [ngClass]="data.diasParaVencer < 0 ? 'text-rose-600' : (data.diasParaVencer <= 90 ? 'text-amber-600' : 'text-emerald-600')">
            {{ data.diasParaVencer < 0 ? 'Caducado hace ' + (-data.diasParaVencer) + ' días' : 'Vence en ' + data.diasParaVencer + ' días' }}
          </div>
          <div class="text-3xs text-slate-400 mt-1">
            Fabricación: {{ data.fechaFabricacion || 'No registrada' }}
          </div>
        </div>

        <!-- Tarjeta 2: Costo de Compra -->
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div class="flex items-center gap-2 mb-1 text-slate-500">
            <mat-icon class="!text-sm !w-4 !h-4 text-sky-600">payments</mat-icon>
            <span class="text-3xs font-bold uppercase tracking-wider">Costo de Adquisición</span>
          </div>
          <div class="font-mono font-black text-slate-800 text-sm">Q {{ data.costoUnitario | number:'1.2-2' }}</div>
          <div class="text-2xs text-slate-500 font-medium mt-0.5">Costo Unitario por Caja</div>
          <div class="text-3xs text-slate-400 mt-1">
            Inversión: Q {{ (stockDisponible * data.costoUnitario) | number:'1.2-2' }}
          </div>
        </div>

        <!-- Tarjeta 3: Stock Físico -->
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div class="flex items-center gap-2 mb-1 text-slate-500">
            <mat-icon class="!text-sm !w-4 !h-4 text-emerald-600">inventory_2</mat-icon>
            <span class="text-3xs font-bold uppercase tracking-wider">Existencias {{ authService.hasGlobalBranchAccess() ? 'Totales' : 'en Sede' }}</span>
          </div>
          <div class="font-black text-slate-800 text-sm">{{ stockDisponible }} cajas</div>
          <div class="text-2xs text-slate-500 font-medium mt-0.5">
            {{ authService.hasGlobalBranchAccess() ? 'Distribuidas en la red' : (authService.currentUser()?.sucursal || 'Mi Sucursal') }}
          </div>
          <div class="text-3xs text-slate-400 mt-1">
            {{ authService.hasGlobalBranchAccess() ? 'En ' + (data.inventarios || []).length + ' sucursal(es)' : 'Custodia local exclusiva' }}
          </div>
        </div>

      </div>

      <!-- Custodia Física por Sucursal -->
      <div class="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-2xs">
        <div class="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <span class="font-bold text-slate-700 uppercase tracking-wider text-2xs">
            {{ authService.hasGlobalBranchAccess() ? 'Distribución y Custodia Física en Sucursales' : 'Custodia en Mi Sucursal' }}
          </span>
          <span class="text-3xs text-slate-500 font-semibold">
            Saldo en tiempo real
          </span>
        </div>

        <div class="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          @for (inv of inventariosVisibles; track inv.sucursalId) {
            <div class="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <mat-icon class="!text-sm !w-4 !h-4">storefront</mat-icon>
                </div>
                <span class="font-bold text-slate-800 text-xs">{{ inv.sucursal }}</span>
              </div>
              <span class="font-mono font-black text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {{ inv.disponible }} cajas
              </span>
            </div>
          }
          @if (!inventariosVisibles || inventariosVisibles.length === 0) {
            <div class="col-span-2 text-center py-4 text-slate-400 text-xs italic">
              Este lote no tiene existencias activas asignadas.
            </div>
          }
        </div>
      </div>

      <!-- Pie de Modal con Botón Cerrar Estándar -->
      <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
        <span class="text-3xs text-slate-400">
          ID Técnico del Registro: #{{ data.loteId }}
        </span>
        <div class="flex items-center gap-2">
          @if (data.estadoVencimiento === 'VENCIDO' && stockDisponible > 0) {
            <button
              type="button"
              (click)="darDeBajaDesdeModal()"
              class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <mat-icon class="!text-sm !w-4 !h-4">delete_sweep</mat-icon>
              <span>Dar de Baja / Merma</span>
            </button>
          }
          <button
            type="button"
            (click)="cerrar()"
            class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition-colors shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>

    </div>
  `,
})
export class LoteDetalleModalComponent {
  private readonly notification = inject(NotificationService);
  private readonly lotesService = inject(LotesService);
  readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<LoteDetalleModalComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: LoteItem) {}

  badgeClass(estado: string): string {
    return getBadgeColorClass(estado);
  }

  get inventariosVisibles() {
    if (this.authService.hasGlobalBranchAccess()) {
      return this.data.inventarios || [];
    }
    const userSucId = this.authService.userSucursalId();
    return (this.data.inventarios || []).filter((i) => i.sucursalId === userSucId);
  }

  get stockDisponible(): number {
    if (this.authService.hasGlobalBranchAccess()) {
      return this.data.stockTotalLote;
    }
    const userSucId = this.authService.userSucursalId();
    const inv = (this.data.inventarios || []).find((i) => i.sucursalId === userSucId);
    return inv ? inv.disponible : 0;
  }

  async darDeBajaDesdeModal(): Promise<void> {
    const unidades = this.stockDisponible;
    if (unidades <= 0) {
      this.notification.warning('Sin Existencias', 'No hay existencias de este lote en tu sucursal para dar de baja.');
      return;
    }

    const ok = await this.notification.confirm({
      title: '¿Confirmar Baja Sanitaria?',
      text: `Se retirarán ${unidades} cajas de este lote en tu sede hacia merma sanitaria con asiento en Kardex.`,
      confirmText: 'Sí, Dar de Baja',
      type: 'danger',
    });
    if (!ok) return;

    this.lotesService.darDeBajaLote(this.data.loteId).subscribe({
      next: (res: any) => {
        this.notification.success('Baja Exitosa', `Lote ${this.data.numeroLote} retirado del inventario activo (${res.totalUnidadesRetiradas} cajas).`);
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.notification.error('Error al dar de baja', err?.error?.message || 'No se pudo retirar el lote');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

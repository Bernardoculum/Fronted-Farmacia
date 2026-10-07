import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidosStateService } from '../../services/pedidos-state.service';
import { PedidosService } from '../../../../core/services/pedidos.service';

@Component({
  selector: 'app-ordenes-web-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        
        <!-- Header del Modal -->
        <div class="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shadow-inner">
              <mat-icon class="text-xl">language</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-bold text-white">Bandeja de Órdenes Web & Portal</h3>
                @if (state.ordenesWebPendientes().length > 0) {
                  <span class="px-2 py-0.5 bg-blue-500 text-white rounded-full text-2xs font-extrabold animate-pulse">
                    {{ state.ordenesWebPendientes().length }} PENDIENTE(S)
                  </span>
                }
              </div>
              <p class="text-xs text-blue-200/80">
                Atención rápida de pedidos recibidos por autoservicio en línea sin salir de la venta actual.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="state.simularPedidoWeb()"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <mat-icon class="text-sm">add_shopping_cart</mat-icon>
              <span class="hidden sm:inline">+ Simular Orden Web</span>
            </button>

            <button
              type="button"
              (click)="cerrarModal.emit()"
              class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer">
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Cuerpo con Tabla de Órdenes Web -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          <div class="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-2xs border-b border-slate-200">
                <tr>
                  <th class="py-3 px-3.5">Nº Orden</th>
                  <th class="py-3 px-3.5">Fecha y Hora</th>
                  <th class="py-3 px-3.5">Canal</th>
                  <th class="py-3 px-3.5">Paciente</th>
                  <th class="py-3 px-3.5">Dirección de Entrega</th>
                  <th class="py-3 px-3.5 text-right">Total</th>
                  <th class="py-3 px-3.5 text-center">Estado</th>
                  <th class="py-3 px-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (ord of state.ordenesWebPendientes(); track ord.pedidoId) {
                  <tr class="hover:bg-blue-50/40 transition-colors">
                    <td class="py-3 px-3.5 font-mono font-bold text-slate-800">#{{ ord.pedidoId }}</td>
                    <td class="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      {{ ord.fechaPedido | date:'dd/MM/yy HH:mm' }}
                    </td>
                    <td class="py-3 px-3.5">
                      <span class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-full text-2xs whitespace-nowrap">
                        PORTAL WEB
                      </span>
                    </td>
                    <td class="py-3 px-3.5 font-bold text-slate-800">
                      {{ ord.cliente?.nombre }}
                    </td>
                    <td class="py-3 px-3.5 text-slate-600 max-w-[200px] truncate" [title]="ord.cliente?.direccion || 'A domicilio'">
                      {{ ord.cliente?.direccion || 'A domicilio' }}
                    </td>
                    <td class="py-3 px-3.5 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                      Q{{ ord.total | number:'1.2-2' }}
                    </td>
                    <td class="py-3 px-3.5 text-center whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {{ ord.estado }}
                      </span>
                    </td>
                    <td class="py-3 px-3.5 text-center whitespace-nowrap">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          (click)="state.verTicket(ord)"
                          class="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-2xs font-bold border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                          matTooltip="Ver Detalle / Ticket">
                          <mat-icon class="text-xs">visibility</mat-icon>
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          (click)="state.cambiarEstadoEntrega(ord.pedidoId, 'CONFIRMADO')"
                          class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-2xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                          matTooltip="Confirmar Pedido y Despachar a Ruta">
                          <mat-icon class="text-xs">delivery_dining</mat-icon>
                          <span>Despachar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="py-12 text-center text-slate-400">
                      <mat-icon class="text-4xl text-slate-300 mx-auto block mb-1">mark_email_read</mat-icon>
                      <p class="text-sm font-bold text-slate-600">No hay órdenes web pendientes</p>
                      <p class="text-xs text-slate-400 mt-1">Todas las órdenes recibidas han sido atendidas o confirmadas.</p>
                      <button
                        type="button"
                        (click)="state.simularPedidoWeb()"
                        class="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all">
                        <mat-icon class="text-sm">add_shopping_cart</mat-icon>
                        <span>Simular una orden de prueba</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        </div>

        <!-- Footer del Modal -->
        <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span class="flex items-center gap-1.5">
            <mat-icon class="text-sm text-blue-600">info</mat-icon>
            <span>Al presionar <strong>Despachar</strong>, la orden se confirma y pasa a la ruta de entrega de farmacia.</span>
          </span>

          <button
            type="button"
            (click)="cerrarModal.emit()"
            class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer">
            Cerrar Bandeja
          </button>
        </div>

      </div>
    </div>
  `,
})
export class OrdenesWebModalComponent {
  readonly state = inject(PedidosStateService);
  readonly pedidosService = inject(PedidosService);
  readonly cerrarModal = output<void>();
}

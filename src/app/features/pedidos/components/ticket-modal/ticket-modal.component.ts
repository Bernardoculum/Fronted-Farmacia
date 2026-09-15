import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoItem } from '../../../../core/models/pedido.models';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in print:p-0 print:bg-white">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        <!-- Header modal (no imprimible) -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </span>
            <div>
              <h3 class="text-base font-bold text-slate-800">Comprobante de Pedido</h3>
              <p class="text-xs text-slate-500">Ticket térmico y detalle transaccional</p>
            </div>
          </div>
          <button (click)="cerrarModal.emit()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Contenido imprimible del Ticket estilo POS Farmacéutico -->
        <div class="p-6 overflow-y-auto font-mono text-sm space-y-4 print:p-0 print:text-xs">
          
          <!-- Encabezado Ticket -->
          <div class="text-center border-b border-dashed border-slate-300 pb-3">
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 text-white font-black text-xl mb-1">
              +
            </div>
            <h2 class="text-base font-black tracking-wider text-slate-800 uppercase">FARMACIA INTEGRAL</h2>
            <p class="text-xs text-slate-600">Resolución SAT: 2026-FARM-004918</p>
            <p class="text-xs text-slate-600 font-sans mt-0.5">NIT: 8492041-9 &bull; PBX: (502) 2333-0000</p>
            <p class="text-xs font-medium text-slate-700 font-sans mt-1">
              {{ pedido().sucursal?.nombre || 'Sucursal Central' }}
            </p>
            <p class="text-[11px] text-slate-500 font-sans">
              {{ pedido().sucursal?.direccion || 'Ciudad de Guatemala' }}
            </p>
          </div>

          <!-- Metadata del Pedido -->
          <div class="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
            <div class="flex justify-between">
              <span class="text-slate-500">Nº PEDIDO / TICKET:</span>
              <span class="font-bold text-slate-800">#{{ pedido().pedidoId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">CANAL DE VENTA:</span>
              <span class="font-bold px-1.5 py-0.5 rounded text-[10px]" 
                [ngClass]="pedido().origen === 'CALL_CENTER' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'">
                {{ pedido().origen === 'CALL_CENTER' ? 'CALL CENTER (A DOMICILIO)' : 'MOSTRADOR POS' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">FECHA Y HORA:</span>
              <span class="text-slate-700">{{ pedido().fechaPedido | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">MÉTODO DE PAGO:</span>
              <span class="font-semibold text-slate-700">{{ pedido().metodoPago }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">ESTADO:</span>
              <span class="font-bold text-slate-800 uppercase">{{ pedido().estado }}</span>
            </div>
          </div>

          <!-- Datos del Cliente -->
          <div class="text-xs border-b border-dashed border-slate-300 pb-3 space-y-1">
            <p class="font-bold text-slate-700 uppercase">CLIENTE:</p>
            <p class="text-slate-800 font-semibold">{{ pedido().cliente?.nombre || 'Consumidor Final' }}</p>
            @if (pedido().cliente?.telefono) {
              <p class="text-slate-600">Tel: {{ pedido().cliente?.telefono }}</p>
            }
            @if (pedido().origen === 'CALL_CENTER' && pedido().cliente?.direccion) {
              <div class="mt-1 p-2 bg-slate-50 rounded border border-slate-200">
                <span class="font-bold text-slate-700 block">Dirección de Entrega:</span>
                <p class="text-slate-600">{{ pedido().cliente?.direccion }}</p>
              </div>
            }
          </div>

          <!-- Detalle de Productos y Lotes Asignados -->
          <div class="border-b border-dashed border-slate-300 pb-3">
            <div class="flex justify-between text-xs font-bold text-slate-600 border-b border-slate-200 pb-1 mb-2">
              <span class="w-1/2">PRODUCTO / LOTE</span>
              <span class="w-1/6 text-right">CANT</span>
              <span class="w-1/6 text-right">P.U.</span>
              <span class="w-1/6 text-right">TOTAL</span>
            </div>

            <div class="space-y-2 text-xs">
              @for (item of pedido().detalles; track item.detalleId) {
                <div>
                  <div class="flex justify-between items-start">
                    <span class="w-1/2 font-semibold text-slate-800 leading-tight">
                      {{ item.nombre }}
                      @if (item.presentacion) {
                        <span class="text-[10px] text-slate-500 block font-normal">{{ item.presentacion }}</span>
                      }
                      @if (item.numeroLote) {
                        <span class="text-[10px] text-teal-600 block font-normal">
                          Lote: {{ item.numeroLote }} 
                          @if (item.fechaVencimiento) {
                            (Vence: {{ item.fechaVencimiento | date:'MM/yy' }})
                          }
                        </span>
                      }
                    </span>
                    <span class="w-1/6 text-right font-medium text-slate-700">{{ item.cantidad }}</span>
                    <span class="w-1/6 text-right text-slate-600">Q{{ item.precioUnitario | number:'1.2-2' }}</span>
                    <span class="w-1/6 text-right font-bold text-slate-800">Q{{ item.subtotal | number:'1.2-2' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Totales e Impuestos -->
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Subtotal Sin IVA:</span>
              <span>Q{{ (pedido().subtotalSinIva || (pedido().total / 1.12)) | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>IVA (12%):</span>
              <span>Q{{ (pedido().iva || (pedido().total - (pedido().total / 1.12))) | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-base font-black text-slate-900 border-t border-slate-400 pt-2">
              <span>TOTAL A PAGAR:</span>
              <span class="text-teal-700 font-mono">Q{{ pedido().total | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Despacho a Domicilio (si aplica) -->
          @if (pedido().origen === 'CALL_CENTER' && pedido().entrega) {
            <div class="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs space-y-1 mt-3">
              <div class="flex items-center gap-1.5 font-bold text-purple-800">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>DESPACHO MOTORIZADO</span>
              </div>
              <p class="text-purple-700">Estado Entrega: <strong class="uppercase">{{ pedido().entrega?.estado }}</strong></p>
              @if (pedido().entrega?.personaRecibe) {
                <p class="text-purple-600">Recibe: {{ pedido().entrega?.personaRecibe }}</p>
              }
              @if (pedido().entrega?.observacion) {
                <p class="text-purple-600 italic">Notas: "{{ pedido().entrega?.observacion }}"</p>
              }
            </div>
          }

          <!-- Pie de ticket -->
          <div class="text-center border-t border-dashed border-slate-300 pt-3 text-[11px] text-slate-500 space-y-1">
            <p class="font-bold text-slate-700">¡GRACIAS POR SU COMPRA!</p>
            <p>Verifique su medicamento antes de retirarse.</p>
            <p>Conserve este ticket como garantía de lote y calidad.</p>
          </div>
        </div>

        <!-- Acciones Footer (no imprimible) -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            type="button"
            (click)="imprimirTicket()"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            <span>Imprimir Ticket</span>
          </button>

          <button
            type="button"
            (click)="cerrarModal.emit()"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            Listo / Continuar
          </button>
        </div>

      </div>
    </div>
  `
})
export class TicketModalComponent {
  readonly pedido = input.required<PedidoItem>();
  readonly cerrarModal = output<void>();

  imprimirTicket(): void {
    window.print();
  }
}

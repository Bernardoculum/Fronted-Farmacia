import { Component, inject, signal, computed, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TransferenciasService } from '../../../core/services/transferencias.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SucursalesService } from '../../../core/services/sucursales.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CreateTransferenciaDetalleItemDto,
  LoteDisponibleTransferencia,
} from '../../../core/models/transferencia.models';

export interface TransferenciaModalData {
  modo?: 'DESPACHO' | 'SOLICITUD';
}

@Component({
  selector: 'app-transferencia-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl w-full bg-white text-slate-800 rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col">
      
      <!-- ===================================================== -->
      <!-- ENCABEZADO CON DIFERENCIACIÓN VISUAL FUERTE (MODAL)    -->
      <!-- ===================================================== -->
      <div 
        class="px-6 py-4 border-b flex items-center justify-between rounded-xl transition-all shadow-xs"
        [ngClass]="isModoSolicitud() ? 'bg-sky-50 border-sky-200' : 'bg-emerald-50 border-emerald-200'">
        
        <div class="flex items-center gap-3.5">
          <div 
            class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm transition-transform"
            [ngClass]="isModoSolicitud() ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'">
            <mat-icon class="text-2xl">{{ isModoSolicitud() ? 'assignment_returned' : 'local_shipping' }}</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {{ isModoSolicitud() ? 'SOLICITUD DE REABASTECIMIENTO' : 'NUEVA TRANSFERENCIA / DESPACHO' }}
              </h3>
              <span 
                class="text-3xs font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-2xs"
                [ngClass]="isModoSolicitud() ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'">
                {{ isModoSolicitud() ? 'Operación de Entrada (Petición)' : 'Operación de Salida (Despacho Directo)' }}
              </span>
            </div>
            <p class="text-xs text-slate-600 mt-0.5">
              {{ isModoSolicitud() 
                ? 'Requerimiento formal de medicamentos dirigido a Bodega Central para surtir tu farmacia' 
                : 'Salida y distribución inmediata de stock desde Bodega Central hacia una sucursal de la red' }}
            </p>
          </div>
        </div>

        <button mat-icon-button (click)="cerrar()" class="text-slate-400 hover:text-slate-600 cursor-pointer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ===================================================== -->
      <!-- CUERPO PRINCIPAL                                      -->
      <!-- ===================================================== -->
      <div class="py-5 space-y-5 flex-1 text-xs">
        
        <!-- TARJETA DE TRAZABILIDAD: QUIÉN HACE LA OPERACIÓN -->
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
              <mat-icon class="!text-base !w-4 !h-4">account_circle</mat-icon>
            </div>
            <div>
              <span class="text-3xs uppercase font-bold text-slate-400 block tracking-wider">
                {{ isModoSolicitud() ? 'Usuario Solicitante' : 'Operador Responsable' }}
              </span>
              <div class="flex items-center gap-2">
                <strong class="text-xs text-slate-800 font-extrabold">{{ getUserDisplayName() }}</strong>
                <span class="px-2 py-0.2 rounded-md text-3xs font-bold bg-slate-200/80 text-slate-700">
                  {{ getFriendlyRoleName() }}
                </span>
              </div>
            </div>
          </div>

          <div class="text-right text-2xs text-slate-500">
            <span class="text-3xs text-slate-400 block uppercase font-bold">Fecha de Emisión</span>
            <span class="font-semibold text-slate-700">{{ fechaActual | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>

        <!-- SECCIÓN: RUTA DE TRASLADO -->
        <div class="p-4 rounded-2xl border transition-all space-y-4 shadow-2xs"
          [ngClass]="isModoSolicitud() ? 'bg-sky-50/40 border-sky-200/80' : 'bg-slate-50 border-slate-200/80'">
          
          <div class="flex items-center justify-between">
            <div class="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              [ngClass]="isModoSolicitud() ? 'text-sky-900' : 'text-slate-800'">
              <mat-icon class="text-base" [ngClass]="isModoSolicitud() ? 'text-sky-600' : 'text-emerald-600'">
                {{ isModoSolicitud() ? 'call_made' : 'alt_route' }}
              </mat-icon>
              <span>{{ isModoSolicitud() ? 'Ruta de Abastecimiento Solicitada' : 'Ruta de Traslado / Despacho' }}</span>
            </div>

            @if (isModoSolicitud()) {
              <span class="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                Destino: Tu Sucursal
              </span>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Sucursal Origen -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                <span>Sucursal Origen (Emisora / De donde sale el stock)</span>
                @if (isModoSolicitud()) {
                  <span class="text-3xs text-emerald-700 font-black">Fijo: Bodega Central</span>
                }
              </label>
              
              @if (isModoSolicitud()) {
                <!-- En Modo Solicitud: Origen SIEMPRE es Bodega Central -->
                <div class="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-emerald-600 text-sm !w-4 !h-4 flex items-center justify-center">warehouse</mat-icon>
                    <span>Sucursal Central (Atanasio Tzul Z.12)</span>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    🔒 Bodega Central (Proveedor Oficial)
                  </span>
                </div>
              } @else {
                <!-- En Modo Despacho (Admin): Selector libre con Bodega Central por defecto -->
                <select
                  [(ngModel)]="sucursalOrigenId"
                  (change)="onOrigenChange()"
                  class="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
                >
                  @for (suc of sucursales(); track suc.sucursalId) {
                    <option [ngValue]="suc.sucursalId">{{ suc.nombre }}</option>
                  }
                </select>

                <!-- Badge Informativo de Origen -->
                <div class="mt-1.5 flex items-center justify-between">
                  @if (isBodegaCentralOrigen()) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🟢 Bodega Central (Recepción y Despacho Oficial)
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ⚠️ Excepción: Origen es Sucursal Satélite
                    </span>
                    <button
                      type="button"
                      (click)="resetToBodegaCentral()"
                      class="text-3xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    >
                      ↩ Volver a Bodega Central
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Sucursal Destino -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1.5">
                Sucursal Destino (Receptora / Hacia donde viaja el stock)
              </label>

              @if (isModoSolicitud() && !authService.isSuperAdmin()) {
                <!-- Para Gerente de Sucursal: Destino fijo su propia sucursal -->
                <div class="w-full px-3 py-2.5 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs">
                  <div class="flex items-center gap-2">
                    <mat-icon class="text-sky-600 text-sm !w-4 !h-4 flex items-center justify-center">storefront</mat-icon>
                    <span>{{ getUserBranchName() }}</span>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                    📍 Tu Sucursal Asignada
                  </span>
                </div>
              } @else {
                <!-- Para Admin o Despacho: Selector de sucursal destino -->
                <select
                  [(ngModel)]="sucursalDestinoId"
                  class="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
                >
                  @for (suc of sucursales(); track suc.sucursalId) {
                    @if (Number(suc.sucursalId) !== Number(sucursalOrigenId)) {
                      <option [ngValue]="suc.sucursalId">{{ suc.nombre }}</option>
                    }
                  }
                </select>
                <div class="mt-1.5">
                  <span class="text-3xs text-slate-500">
                    La sucursal receptora recibirá notificación y confirmará la recepción física.
                  </span>
                </div>
              }
            </div>

          </div>

          <!-- Observación / Motivo del Traslado -->
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Observación / Motivo del Traslado (Opcional)
            </label>
            <input
              type="text"
              [(ngModel)]="observacion"
              maxlength="300"
              [placeholder]="isModoSolicitud() ? 'Ej: Pedido urgente por agotamiento de amoxicilina e ibuprofeno en mostrador...' : 'Ej: Reabastecimiento semanal programado...'"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
            />
          </div>
        </div>

        <!-- SECCIÓN: AGREGAR MEDICAMENTOS Y CONTROL ESTRICTO DE STOCK -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div class="flex items-center justify-between flex-wrap gap-1">
            <div class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <mat-icon class="text-base text-teal-600">playlist_add</mat-icon>
              <span>Agregar Medicamentos al Envío</span>
            </div>
            <span class="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
              Existencias disponibles en sucursal emisora
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            
            <!-- Selector de Lote / Medicamento -->
            <div class="sm:col-span-8">
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
                Seleccionar Lote & Medicamento Disponible
              </label>
              <select
                [ngModel]="selectedLoteId()"
                (ngModelChange)="onLoteChange($event)"
                [disabled]="cargandoLotes()"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium cursor-pointer shadow-2xs"
              >
                <option [ngValue]="null">-- Seleccione medicamento y lote disponible en origen --</option>
                @for (lote of lotesDisponibles(); track lote.loteId) {
                  <option [ngValue]="lote.loteId">
                    {{ lote.productoNombre }} • Lote: {{ lote.numeroLote }} • Disp: {{ lote.stockDisponible }} cajas (Vence: {{ lote.fechaVencimiento | date:'dd/MM/yyyy' }})
                  </option>
                }
              </select>

              @if (cargandoLotes()) {
                <div class="mt-1.5 text-3xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <mat-icon class="!w-3.5 !h-3.5 !text-xs animate-spin text-teal-600">refresh</mat-icon>
                  <span>Consultando inventario en la sucursal emisora...</span>
                </div>
              } @else if (lotesDisponibles().length === 0) {
                <div class="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-3xs text-amber-800 flex items-center gap-1.5 font-medium">
                  <mat-icon class="!w-4 !h-4 !text-sm text-amber-600">info</mat-icon>
                  <span>No hay lotes con existencias disponibles en la sucursal de origen seleccionada.</span>
                </div>
              }
            </div>

            <!-- Cantidad a Transferir con Límite de Inventario -->
            <div class="sm:col-span-2">
              <div class="flex items-center justify-between mb-1">
                <label class="text-2xs font-bold text-slate-600 uppercase">Cantidad</label>
                @if (selectedLote()) {
                  <button
                    type="button"
                    (click)="usarStockMaximo()"
                    class="text-3xs font-extrabold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                    matTooltip="Asignar todo el stock disponible">
                    Máx: {{ stockMaximoLote() }}
                  </button>
                }
              </div>
              <input
                type="number"
                min="1"
                [max]="stockMaximoLote()"
                [ngModel]="cantidadInput()"
                (ngModelChange)="onCantidadChange($event)"
                [disabled]="!selectedLote() || cargandoLotes()"
                placeholder="1"
                class="w-full px-3 py-2 bg-white border rounded-xl text-xs font-black text-center focus:ring-2 focus:outline-none shadow-2xs"
                [ngClass]="isCantidadExcedida() ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-500' : 'border-slate-300 text-slate-800 focus:ring-teal-500'"
              />
            </div>

            <!-- Botón Añadir -->
            <div class="sm:col-span-2">
              <button
                type="button"
                (click)="agregarItem()"
                [disabled]="!selectedLote() || !isCantidadValida() || cargandoLotes()"
                class="w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                [ngClass]="isCantidadValida() && selectedLote() ? 'bg-teal-600 hover:bg-teal-700 text-white active:scale-98' : 'bg-slate-200 text-slate-400 cursor-not-allowed'"
              >
                <mat-icon class="text-base">add</mat-icon>
                <span>Añadir</span>
              </button>
            </div>

          </div>

          <!-- Alerta reactiva si la cantidad excede el stock disponible -->
          @if (isCantidadExcedida()) {
            <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-2xs text-rose-700 font-semibold animate-pulse">
              <mat-icon class="!w-4 !h-4 !text-sm text-rose-600">error_outline</mat-icon>
              <span>
                Cantidad excedida: intentas transferir <strong>{{ cantidadInput() }}</strong> cajas pero solo hay <strong>{{ stockMaximoLote() }}</strong> cajas disponibles en el lote.
              </span>
            </div>
          }

          <!-- Información del lote seleccionado -->
          @if (selectedLote() && !isCantidadExcedida()) {
            <div class="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200 flex items-center justify-between text-2xs flex-wrap gap-2">
              <span class="text-teal-950 font-semibold">
                <strong>{{ selectedLote()?.productoNombre }}</strong> • Lote: {{ selectedLote()?.numeroLote }} • Vencimiento: {{ selectedLote()?.fechaVencimiento | date:'dd/MM/yyyy' }}
              </span>
              <span class="font-black text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                Stock disponible en origen: {{ selectedLote()?.stockDisponible }} cajas
              </span>
            </div>
          }
        </div>

        <!-- SECCIÓN: TABLA DE ÍTEMS A TRANSFERIR -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <mat-icon class="!w-4 !h-4 !text-sm text-slate-500">format_list_bulleted</mat-icon>
              <span class="font-bold text-slate-800 text-xs">Lista de Ítems a Transferir</span>
            </div>
            <span class="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {{ items().length }} {{ items().length === 1 ? 'ítem' : 'ítems' }}
            </span>
          </div>

          @if (items().length === 0) {
            <div class="py-10 text-center text-slate-400">
              <mat-icon class="text-4xl text-slate-300">playlist_add</mat-icon>
              <p class="mt-1 text-xs font-semibold text-slate-500">Aún no has añadido medicamentos a la lista</p>
              <p class="text-3xs text-slate-400 mt-0.5">Selecciona un lote con existencias arriba y haz clic en "Añadir"</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 text-slate-400 text-3xs uppercase font-extrabold bg-slate-50/50">
                    <th class="py-2.5 px-3">Medicamento</th>
                    <th class="py-2.5 px-3 text-center">No. Lote</th>
                    <th class="py-2.5 px-3 text-center">Stock Origen</th>
                    <th class="py-2.5 px-3 text-center text-teal-700">Cant. Solicitada</th>
                    <th class="py-2.5 px-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                  @for (it of items(); track it.loteId; let idx = $index) {
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-2 px-3 font-bold text-slate-800">{{ it.medicamento }}</td>
                      <td class="py-2 px-3 text-center text-slate-600 font-mono text-2xs">{{ it.numeroLote }}</td>
                      <td class="py-2 px-3 text-center text-slate-500">{{ it.stockDisponible }} cajas</td>
                      <td class="py-2 px-3 text-center font-black text-teal-700">
                        <span class="px-2.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200">
                          {{ it.cantidadSolicitada }} cajas
                        </span>
                      </td>
                      <td class="py-2 px-3 text-center">
                        <button
                          type="button"
                          (click)="removerItem(idx)"
                          class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          matTooltip="Eliminar ítem"
                        >
                          <mat-icon class="!w-4 !h-4 !text-base">delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>

      <!-- ===================================================== -->
      <!-- PIE DE MODAL (Totales y Guardado)                     -->
      <!-- ===================================================== -->
      <div class="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span class="text-3xs uppercase font-extrabold text-slate-400 block tracking-wider">Total Unidades Solicitadas</span>
          <span class="text-base font-black text-slate-800">
            {{ totalUnidades() }} <span class="text-xs font-semibold text-slate-500">cajas en total</span>
          </span>
        </div>

        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            (click)="cerrar()"
            class="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            (click)="guardarTransferencia()"
            [disabled]="items().length === 0 || guardando()"
            class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            [ngClass]="isModoSolicitud() ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'"
          >
            @if (guardando()) {
              <span>Guardando...</span>
            } @else {
              <div class="flex items-center gap-1.5">
                <mat-icon class="text-lg">{{ isModoSolicitud() ? 'send' : 'local_shipping' }}</mat-icon>
                <span>{{ isModoSolicitud() ? 'Enviar Solicitud a Bodega Central' : 'Crear Transferencia / Despacho' }}</span>
              </div>
            }
          </button>
        </div>
      </div>

    </div>
  `,
})
export class TransferenciaFormModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TransferenciaFormModalComponent>);
  private readonly transferenciasService = inject(TransferenciasService);
  private readonly notification = inject(NotificationService);
  private readonly sucursalesService = inject(SucursalesService);
  readonly authService = inject(AuthService);
  @Optional() private readonly data: TransferenciaModalData | null = inject(MAT_DIALOG_DATA, { optional: true });

  readonly sucursales = this.sucursalesService.sucursalesList;
  readonly lotesDisponibles = signal<LoteDisponibleTransferencia[]>([]);
  readonly cargandoLotes = signal<boolean>(false);
  readonly fechaActual = new Date();
  readonly Number = Number;

  sucursalOrigenId = 1; // Default Bodega Central
  sucursalDestinoId = 2; // Default sucursal destino
  observacion = '';

  // Signals reactivos para el lote y la cantidad
  readonly selectedLoteId = signal<number | null>(null);
  readonly cantidadInput = signal<number>(1);
  readonly guardando = signal<boolean>(false);

  readonly items = signal<CreateTransferenciaDetalleItemDto[]>([]);

  readonly isModoSolicitud = computed(() => {
    if (this.data?.modo === 'SOLICITUD') return true;
    if (this.data?.modo === 'DESPACHO') return false;
    return !this.authService.hasGlobalBranchAccess();
  });

  readonly totalUnidades = computed(() =>
    this.items().reduce((acc, it) => acc + it.cantidadSolicitada, 0)
  );

  readonly isBodegaCentralOrigen = computed(() => Number(this.sucursalOrigenId) === 1);

  readonly selectedLote = computed(() => {
    const id = this.selectedLoteId();
    if (id == null) return null;
    return this.lotesDisponibles().find((l) => Number(l.loteId) === Number(id)) || null;
  });

  readonly stockMaximoLote = computed(() => {
    const lote = this.selectedLote();
    return lote ? Number(lote.stockDisponible) || 0 : 0;
  });

  readonly isCantidadExcedida = computed(() => {
    const cant = this.cantidadInput();
    const max = this.stockMaximoLote();
    if (!this.selectedLote()) return false;
    return cant > max;
  });

  readonly isCantidadValida = computed(() => {
    const cant = this.cantidadInput();
    const max = this.stockMaximoLote();
    return !isNaN(cant) && cant > 0 && cant <= max;
  });

  ngOnInit(): void {
    if (this.isModoSolicitud()) {
      this.sucursalOrigenId = 1; // Fijo Bodega Central
      this.sucursalDestinoId = this.authService.userSucursalId() || 2;
    } else {
      // Modo Despacho (Admin): Preseleccionar Bodega Central por defecto
      this.sucursalOrigenId = 1;
      this.sucursalesService.cargarListaCombo().subscribe((list) => {
        if (list && list.length > 1) {
          const destino = list.find((s) => Number(s.sucursalId) !== Number(this.sucursalOrigenId));
          if (destino) this.sucursalDestinoId = Number(destino.sucursalId);
        }
      });
    }

    // Cargar inmediatamente los lotes disponibles en el origen
    this.cargarLotesOrigen(this.sucursalOrigenId);
  }

  cargarLotesOrigen(sucursalId: number): void {
    this.cargandoLotes.set(true);
    this.selectedLoteId.set(null);
    this.transferenciasService.getLotesDisponibles(sucursalId).subscribe({
      next: (list) => {
        this.lotesDisponibles.set(list || []);
        this.cargandoLotes.set(false);
      },
      error: () => {
        this.lotesDisponibles.set([]);
        this.cargandoLotes.set(false);
      },
    });
  }

  onOrigenChange(): void {
    this.sucursalOrigenId = Number(this.sucursalOrigenId);
    this.sucursalDestinoId = Number(this.sucursalDestinoId);
    if (Number(this.sucursalDestinoId) === Number(this.sucursalOrigenId)) {
      const alt = this.sucursales().find((s) => Number(s.sucursalId) !== Number(this.sucursalOrigenId));
      if (alt) this.sucursalDestinoId = Number(alt.sucursalId);
    }
    this.selectedLoteId.set(null);
    this.items.set([]);
    this.cargarLotesOrigen(this.sucursalOrigenId);
  }

  resetToBodegaCentral(): void {
    this.sucursalOrigenId = 1;
    this.onOrigenChange();
  }

  onLoteChange(val: any): void {
    const num = val !== null && val !== undefined && val !== '' ? Number(val) : null;
    this.selectedLoteId.set(num);
    this.cantidadInput.set(1);
  }

  onCantidadChange(val: any): void {
    const num = Number(val);
    this.cantidadInput.set(isNaN(num) ? 0 : num);
  }

  usarStockMaximo(): void {
    const max = this.stockMaximoLote();
    if (max > 0) {
      this.cantidadInput.set(max);
    }
  }

  agregarItem(): void {
    const lote = this.selectedLote();
    const cant = Number(this.cantidadInput());
    if (!lote || isNaN(cant) || cant <= 0) {
      this.notification.warning('Cantidad Inválida', 'Ingresa una cantidad válida mayor a 0.');
      return;
    }

    const max = this.stockMaximoLote();
    if (cant > max) {
      this.notification.warning('Cantidad Excedida', `Solo hay ${max} unidades disponibles en inventario de origen.`);
      return;
    }

    const current = this.items();
    const existingIndex = current.findIndex((it) => Number(it.loteId) === Number(lote.loteId));

    if (existingIndex >= 0) {
      const nuevaCant = current[existingIndex].cantidadSolicitada + cant;
      if (nuevaCant > max) {
        this.notification.warning(
          'Cantidad Excedida',
          `El total acumulado (${nuevaCant} cajas) excede las ${max} cajas disponibles en este lote.`
        );
        return;
      }
      current[existingIndex].cantidadSolicitada = nuevaCant;
      this.items.set([...current]);
    } else {
      this.items.set([
        ...current,
        {
          loteId: Number(lote.loteId),
          numeroLote: lote.numeroLote,
          medicamento: lote.productoNombre,
          stockDisponible: max,
          cantidadSolicitada: cant,
        },
      ]);
    }

    // Resetear selección para el siguiente ítem
    this.selectedLoteId.set(null);
    this.cantidadInput.set(1);
  }

  removerItem(idx: number): void {
    const list = this.items();
    list.splice(idx, 1);
    this.items.set([...list]);
  }

  guardarTransferencia(): void {
    if (this.items().length === 0 || this.sucursalOrigenId === this.sucursalDestinoId) return;

    this.guardando.set(true);

    // Formato formal de trazabilidad: solicitante, rol, sede y fecha
    const u = this.authService.currentUser();
    const nombreOp = u?.nombre || u?.username || 'Usuario';
    const rolOp = this.getFriendlyRoleName();
    const sedeOp = this.getUserBranchName();
    const userObs = this.observacion.trim();

    let obsFinal = '';
    if (this.isModoSolicitud()) {
      obsFinal = `[SOLICITUD DE REABASTECIMIENTO - Solicitado por: ${nombreOp} (${rolOp}) - Sede: ${sedeOp}]: ${userObs || 'Reabastecimiento de existencias'}`;
    } else {
      obsFinal = `[DESPACHO DIRECTO - Despachado por: ${nombreOp} (${rolOp})]: ${userObs || 'Despacho de existencias'}`;
    }

    this.transferenciasService
      .crearTransferencia({
        sucursalOrigenId: Number(this.sucursalOrigenId),
        sucursalDestinoId: Number(this.sucursalDestinoId),
        observacion: obsFinal.slice(0, 490), // Respetar longitud máxima de varchar2(500)
        detalles: this.items().map((it) => ({
          loteId: Number(it.loteId),
          cantidadSolicitada: Number(it.cantidadSolicitada),
        })),
      })
      .subscribe({
        next: (res) => {
          this.guardando.set(false);
          this.dialogRef.close(res);
          this.notification.success(
            this.isModoSolicitud() ? '¡Solicitud Registrada con Éxito!' : '¡Transferencia Creada con Éxito!',
            `Orden #${res?.transferenciaId || ''} guardada. Se notificó a la sucursal de destino.`
          );
        },
        error: (err) => {
          this.guardando.set(false);
          this.notification.error('Error al guardar transferencia', err?.error?.message || 'No se pudo registrar la transferencia');
        },
      });
  }

  getUserDisplayName(): string {
    const u = this.authService.currentUser();
    return u?.nombre || u?.username || 'Usuario';
  }

  getFriendlyRoleName(): string {
    const rol = this.authService.userRole();
    switch (rol) {
      case 'SUPER_ADMIN':
        return 'Administrador';
      case 'GERENTE_SUCURSAL':
        return 'Gerente de Sucursal';
      default:
        return rol || 'Operador';
    }
  }

  getUserBranchName(): string {
    const u = this.authService.currentUser();
    if (typeof u?.sucursal === 'string' && u.sucursal.trim()) return u.sucursal;
    return 'Mi Sucursal';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

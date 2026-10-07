import { Component, inject, Inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TransferenciasService } from '../../../core/services/transferencias.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TransferenciaItem, TransferenciaDetalleItem } from '../../../core/models/transferencia.models';
import { FormatEnumPipe, getBadgeColorClass } from '../../../shared/pipes/format-enum.pipe';

@Component({
  selector: 'app-transferencia-detalle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, FormatEnumPipe],
  template: `
    <div class="p-5 sm:p-6 w-full max-h-[90vh] overflow-y-auto">
      
      <!-- Encabezado Limpio -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <mat-icon class="text-xl leading-none">sync_alt</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-black text-slate-800 leading-tight">
                Transferencia #{{ data.transferenciaId }}
              </h2>
              <span class="px-2.5 py-0.5 rounded-full text-2xs font-extrabold border" [ngClass]="badgeClass(data.estado)">
                {{ data.estado | formatEnum }}
              </span>
            </div>
            <p class="text-xs text-slate-500">Control logístico y traslado de medicamentos</p>
          </div>
        </div>

        <button mat-icon-button (click)="cerrar()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Ruta de Sucursales Enfrentadas con Conector de Camión -->
      <div class="flex flex-col sm:flex-row items-center gap-2 mb-3.5">
        <!-- Tarjeta Origen -->
        <div class="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <mat-icon class="!text-lg !w-5 !h-5 text-slate-600">warehouse</mat-icon>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-3xs uppercase font-bold text-slate-400 block tracking-wider">Sucursal Origen</span>
            <span class="font-bold text-slate-800 text-xs sm:text-sm truncate block">{{ data.sucursalOrigen?.nombre }}</span>
            <span class="text-3xs text-slate-500 block">{{ data.sucursalOrigen?.tipoSucursal | formatEnum }}</span>
          </div>
        </div>

        <!-- Conector Central con Icono de Camión -->
        <div class="w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 flex items-center justify-center shrink-0 shadow-2xs my-1 sm:my-0">
          <mat-icon class="!text-base !w-4 !h-4 text-slate-600">local_shipping</mat-icon>
        </div>

        <!-- Tarjeta Destino -->
        <div class="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <mat-icon class="!text-lg !w-5 !h-5 text-slate-600">storefront</mat-icon>
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-3xs uppercase font-bold text-slate-400 block tracking-wider">Sucursal Destino</span>
            <span class="font-bold text-slate-800 text-xs sm:text-sm truncate block">{{ data.sucursalDestino?.nombre }}</span>
            <span class="text-3xs text-slate-500 block">{{ data.sucursalDestino?.tipoSucursal | formatEnum }}</span>
          </div>
        </div>
      </div>

      <!-- Línea de Tiempo Horizontal (Stepper / Progress Tracker) -->
      <div class="bg-white border border-slate-200 rounded-xl p-3.5 mb-3.5 shadow-2xs">
        <div class="flex items-center justify-between max-w-lg mx-auto relative px-2">
          
          <!-- Etapa 1: Solicitud -->
          <div class="flex flex-col items-center text-center z-10 w-28">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs transition-colors bg-sky-100 text-sky-700 border border-sky-300">
              <mat-icon class="!text-sm !w-4 !h-4">description</mat-icon>
            </div>
            <span class="text-2xs font-bold text-slate-800 mt-1">Solicitada</span>
            <span class="text-3xs text-slate-500">{{ data.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>

          <!-- Conector 1-2 -->
          <div class="flex-1 h-0.5 -mt-5 transition-colors"
               [ngClass]="data.fechaEnvio || data.estado === 'EN_TRANSITO' || data.estado === 'RECIBIDA' ? 'bg-amber-400' : 'bg-slate-200'"></div>

          <!-- Etapa 2: En Tránsito (Despacho) -->
          <div class="flex flex-col items-center text-center z-10 w-28">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs transition-colors"
                 [ngClass]="data.fechaEnvio || data.estado === 'EN_TRANSITO' || data.estado === 'RECIBIDA' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-400 border border-slate-200'">
              <mat-icon class="!text-sm !w-4 !h-4">local_shipping</mat-icon>
            </div>
            <span class="text-2xs font-bold text-slate-800 mt-1">En Tránsito</span>
            <span class="text-3xs text-slate-500">
              {{ data.fechaEnvio ? (data.fechaEnvio | date:'dd/MM/yyyy HH:mm') : 'Pendiente' }}
            </span>
          </div>

          <!-- Conector 2-3 -->
          <div class="flex-1 h-0.5 -mt-5 transition-colors"
               [ngClass]="data.fechaRecepcion || data.estado === 'RECIBIDA' ? 'bg-emerald-500' : 'bg-slate-200'"></div>

          <!-- Etapa 3: Recepción o Cancelación -->
          @if (data.estado === 'CANCELADA') {
            <div class="flex flex-col items-center text-center z-10 w-28">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs bg-rose-100 text-rose-700 border border-rose-300">
                <mat-icon class="!text-sm !w-4 !h-4">cancel</mat-icon>
              </div>
              <span class="text-2xs font-bold text-rose-700 mt-1">Cancelada</span>
              <span class="text-3xs text-rose-500">Anulada</span>
            </div>
          } @else {
            <div class="flex flex-col items-center text-center z-10 w-28">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs transition-colors"
                   [ngClass]="data.fechaRecepcion || data.estado === 'RECIBIDA' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 border border-slate-200'">
                <mat-icon class="!text-sm !w-4 !h-4">check_circle</mat-icon>
              </div>
              <span class="text-2xs font-bold text-slate-800 mt-1">Recibida</span>
              <span class="text-3xs text-slate-500">
                {{ data.fechaRecepcion ? (data.fechaRecepcion | date:'dd/MM/yyyy HH:mm') : 'Pendiente' }}
              </span>
            </div>
          }

        </div>

        @if (data.observacion) {
          <div class="mt-3 p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs flex items-start gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200 shadow-2xs">
              <mat-icon class="!text-sm !w-4 !h-4">assignment_ind</mat-icon>
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-3xs uppercase font-extrabold text-slate-400 block tracking-wider">Trazabilidad de la Solicitud / Envío</span>
              <p class="text-xs font-semibold text-slate-800 mt-0.5 leading-relaxed">
                {{ data.observacion }}
              </p>
            </div>
          </div>
        }
      </div>

      <!-- Tabla de Medicamentos Directa -->
      <div class="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-2xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-2xs border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3.5">Medicamento</th>
                <th class="py-2.5 px-3.5">Lote</th>
                <th class="py-2.5 px-3.5 text-center">Solicitada</th>
                <th class="py-2.5 px-3.5 text-center">
                  {{ canDespachar() ? 'A Enviar' : 'Enviada' }}
                </th>
                <th class="py-2.5 px-3.5 text-center">
                  {{ canRecibir() ? 'A Recibir' : 'Recibida' }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (det of data.detalles; track det.transferenciaDetalleId) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-2.5 px-3.5">
                    <div class="font-bold text-slate-800 text-xs sm:text-sm">{{ det.medicamento }}</div>
                    <div class="text-3xs text-slate-500 font-medium">{{ det.codigoProducto }} • {{ det.presentacion || 'Unidad' }}</div>
                  </td>

                  <td class="py-2.5 px-3.5 whitespace-nowrap">
                    <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {{ det.numeroLote }}
                    </span>
                  </td>

                  <td class="py-2.5 px-3.5 text-center whitespace-nowrap font-bold text-slate-800 text-sm">
                    {{ det.cantidadSolicitada }} u.
                  </td>

                  <!-- Casilla de Cantidad a Enviar -->
                  <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                    @if (canDespachar()) {
                      <div class="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          [max]="det.cantidadSolicitada"
                          [value]="cantidadesEnvio()[det.transferenciaDetalleId] ?? det.cantidadSolicitada"
                          (input)="setCantidadEnvio(det.transferenciaDetalleId, $any($event.target).value)"
                          class="w-18 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-1 px-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span class="text-2xs text-slate-400">u.</span>
                      </div>
                    } @else {
                      <span class="font-bold text-sm" [ngClass]="det.cantidadEnviada > 0 ? 'text-amber-700' : 'text-slate-400'">
                        {{ det.cantidadEnviada }} u.
                      </span>
                    }
                  </td>

                  <!-- Casilla de Cantidad Recibida -->
                  <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                    @if (canRecibir()) {
                      <div class="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          [max]="det.cantidadEnviada"
                          [value]="cantidadesRecepcion()[det.transferenciaDetalleId] ?? det.cantidadEnviada"
                          (input)="setCantidadRecepcion(det.transferenciaDetalleId, $any($event.target).value)"
                          class="w-18 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-1 px-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <span class="text-2xs text-slate-400">u.</span>
                      </div>
                    } @else {
                      <span class="font-bold text-sm" [ngClass]="det.cantidadRecibida > 0 ? 'text-emerald-700' : 'text-slate-400'">
                        {{ det.cantidadRecibida }} u.
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sección de Anulación Integrada -->
      @if (mostrarAnulacion()) {
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-3.5 space-y-2 shadow-2xs">
          <div class="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span class="inline-flex items-center gap-1">
              <mat-icon class="text-sm">warning</mat-icon>
              <span>Motivo de Anulación de la Transferencia *</span>
            </span>
            <button
              type="button"
              (click)="mostrarAnulacion.set(false)"
              class="text-3xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Cancelar
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="text"
              [value]="motivoTexto()"
              (input)="motivoTexto.set($any($event.target).value)"
              placeholder="Escribe el motivo (ej. Error en cantidades o sucursal destino incorrecta)..."
              class="flex-1 bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <button
              type="button"
              (click)="confirmarAnulacionDirecta()"
              [disabled]="!motivoTexto().trim() || procesando()"
              class="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {{ procesando() ? 'Anulando...' : 'Confirmar Anulación' }}
            </button>
          </div>
        </div>
      }

      <!-- Banner de Error Visible Directamente Dentro del Modal -->
      @if (errorMensaje()) {
        <div class="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 shadow-xs animate-in fade-in duration-200">
          <mat-icon class="text-rose-600 !text-xl !w-5 !h-5 shrink-0 mt-0.5">error</mat-icon>
          <div class="flex-1">
            <strong class="block font-black text-rose-900">Error al procesar la operación</strong>
            <span class="text-2xs text-rose-700 leading-snug block mt-0.5">{{ errorMensaje() }}</span>
          </div>
          <button
            type="button"
            (click)="errorMensaje.set(null)"
            class="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
          >
            <mat-icon class="!w-4 !h-4 !text-base">close</mat-icon>
          </button>
        </div>
      }

      <!-- Barra de Confirmación Inline de Despacho (Cero Modales Encimados) -->
      @if (confirmandoDespacho()) {
        <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div class="flex items-center gap-2 text-xs text-emerald-950 font-bold">
            <mat-icon class="text-emerald-700">help_outline</mat-icon>
            <span>¿Confirmas el despacho inmediato de estos medicamentos hacia <strong>{{ data.sucursalDestino?.nombre }}</strong>?</span>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              (click)="confirmandoDespacho.set(false)"
              class="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              (click)="confirmarDespachoDirecto()"
              [disabled]="procesando()"
              class="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <mat-icon class="!text-base !w-4 !h-4">local_shipping</mat-icon>
              <span>{{ procesando() ? 'Despachando...' : '✓ Sí, Despachar Ahora' }}</span>
            </button>
          </div>
        </div>
      }

      <!-- Barra de Confirmación Inline de Recepción (Cero Modales Encimados) -->
      @if (confirmandoRecepcion()) {
        <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div class="flex items-center gap-2 text-xs text-emerald-950 font-bold">
            <mat-icon class="text-emerald-700">check_circle</mat-icon>
            <span>¿Confirmas la recepción física del pedido e ingreso a <strong>{{ data.sucursalDestino?.nombre }}</strong>?</span>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              (click)="confirmandoRecepcion.set(false)"
              class="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              (click)="confirmarRecepcionDirecta()"
              [disabled]="procesando()"
              class="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <mat-icon class="!text-base !w-4 !h-4">done_all</mat-icon>
              <span>{{ procesando() ? 'Ingresando...' : '✓ Sí, Confirmar Recepción' }}</span>
            </button>
          </div>
        </div>
      }

      <!-- Pie de Acciones con Botón Estándar de Cerrar -->
      <div class="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
        <button
          type="button"
          (click)="cerrar()"
          class="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition-colors shadow-2xs"
        >
          Cerrar
        </button>

        <div class="flex items-center gap-2">
          <!-- Botón Anular -->
          @if (canCancelar() && !mostrarAnulacion() && !confirmandoDespacho() && !confirmandoRecepcion()) {
            <button
              type="button"
              (click)="mostrarAnulacion.set(true)"
              [disabled]="procesando()"
              class="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <mat-icon class="text-base text-rose-600">cancel</mat-icon>
              <span>Anular</span>
            </button>
          }

          <!-- Botón Despachar -->
          @if (canDespachar() && !mostrarAnulacion() && !confirmandoDespacho() && !confirmandoRecepcion()) {
            <button
              type="button"
              (click)="iniciarDespacho()"
              [disabled]="procesando()"
              class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-bold !px-5 !h-10 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <mat-icon class="text-base">local_shipping</mat-icon>
              <span>Despachar Mercancía</span>
            </button>
          }

          <!-- Botón Recibir -->
          @if (canRecibir() && !mostrarAnulacion() && !confirmandoDespacho() && !confirmandoRecepcion()) {
            <button
              type="button"
              (click)="iniciarRecepcion()"
              [disabled]="procesando()"
              class="!rounded-xl !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-bold !px-5 !h-10 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <mat-icon class="text-base">check_circle</mat-icon>
              <span>Confirmar Recepción</span>
            </button>
          }
        </div>
      </div>

    </div>
  `,
})
export class TransferenciaDetalleModalComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TransferenciaDetalleModalComponent>);
  private readonly transferenciasService = inject(TransferenciasService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly user = this.authService.currentUser;
  readonly procesando = signal(false);
  readonly mostrarAnulacion = signal(false);
  readonly motivoTexto = signal('');
  readonly confirmandoDespacho = signal(false);
  readonly confirmandoRecepcion = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  // Mapas reactivos de cantidades
  readonly cantidadesEnvio = signal<{ [detalleId: number]: number }>({});
  readonly cantidadesRecepcion = signal<{ [detalleId: number]: number }>({});

  constructor(@Inject(MAT_DIALOG_DATA) public data: TransferenciaItem) {}

  ngOnInit(): void {
    const env: { [key: number]: number } = {};
    const rec: { [key: number]: number } = {};

    (this.data.detalles || []).forEach((det: TransferenciaDetalleItem) => {
      env[det.transferenciaDetalleId] = det.cantidadEnviada > 0 ? det.cantidadEnviada : det.cantidadSolicitada;
      rec[det.transferenciaDetalleId] = det.cantidadRecibida > 0 ? det.cantidadRecibida : (det.cantidadEnviada > 0 ? det.cantidadEnviada : det.cantidadSolicitada);
    });

    this.cantidadesEnvio.set(env);
    this.cantidadesRecepcion.set(rec);
  }

  readonly canManage = computed(() => {
    const rol = this.user()?.rol;
    return rol === 'SUPER_ADMIN' || rol === 'GERENTE_SUCURSAL';
  });

  readonly canDespachar = computed(() => {
    if (this.data.estado !== 'SOLICITADA' && this.data.estado !== 'AUTORIZADA') return false;
    if (this.authService.isSuperAdmin()) return true;
    const userSuc = this.authService.userSucursalId();
    const origenSuc = this.data.sucursalOrigen?.sucursalId;
    return userSuc != null && origenSuc != null && Number(userSuc) === Number(origenSuc);
  });

  readonly canRecibir = computed(() => {
    if (this.data.estado !== 'EN_TRANSITO') return false;
    if (this.authService.isSuperAdmin()) return true;
    const userSuc = this.authService.userSucursalId();
    const destinoSuc = this.data.sucursalDestino?.sucursalId;
    return userSuc != null && destinoSuc != null && Number(userSuc) === Number(destinoSuc);
  });

  readonly canCancelar = computed(() => {
    return (this.data.estado === 'SOLICITADA' || this.data.estado === 'AUTORIZADA') && this.canManage();
  });

  setCantidadEnvio(id: number, val: any): void {
    const num = Math.max(1, Number(val) || 1);
    this.cantidadesEnvio.update((map) => ({ ...map, [id]: num }));
  }

  setCantidadRecepcion(id: number, val: any): void {
    const num = Math.max(0, Number(val) || 0);
    this.cantidadesRecepcion.update((map) => ({ ...map, [id]: num }));
  }

  badgeClass(estado: string): string {
    return getBadgeColorClass(estado);
  }

  iniciarDespacho(): void {
    this.errorMensaje.set(null);
    this.confirmandoRecepcion.set(false);
    this.mostrarAnulacion.set(false);
    this.confirmandoDespacho.set(true);
  }

  iniciarRecepcion(): void {
    this.errorMensaje.set(null);
    this.confirmandoDespacho.set(false);
    this.mostrarAnulacion.set(false);
    this.confirmandoRecepcion.set(true);
  }

  confirmarDespachoDirecto(): void {
    const items = (this.data.detalles || []).map((det: TransferenciaDetalleItem) => ({
      transferenciaDetalleId: det.transferenciaDetalleId,
      cantidadEnviada: Number(this.cantidadesEnvio()?.[det.transferenciaDetalleId] ?? det.cantidadSolicitada),
    }));

    this.procesando.set(true);
    this.transferenciasService.despacharTransferencia(this.data.transferenciaId, { items }).subscribe({
      next: () => {
        this.procesando.set(false);
        this.dialogRef.close(true);
        this.notification.success('¡Despacho Exitoso!', `Transferencia #${this.data.transferenciaId} en tránsito a destino.`);
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.message || 'No se pudo despachar el traslado';
        this.errorMensaje.set(msg);
      },
    });
  }

  confirmarRecepcionDirecta(): void {
    const items = (this.data.detalles || []).map((det: TransferenciaDetalleItem) => ({
      transferenciaDetalleId: det.transferenciaDetalleId,
      cantidadRecibida: Number(this.cantidadesRecepcion()?.[det.transferenciaDetalleId] ?? det.cantidadEnviada ?? det.cantidadSolicitada),
    }));

    this.procesando.set(true);
    this.transferenciasService.recibirTransferencia(this.data.transferenciaId, { items }).subscribe({
      next: () => {
        this.procesando.set(false);
        this.dialogRef.close(true);
        this.notification.success('¡Recepción Exitosa!', `Stock ingresado a ${this.data.sucursalDestino?.nombre}.`);
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.message || 'No se pudo confirmar la recepción';
        this.errorMensaje.set(msg);
      },
    });
  }

  confirmarAnulacionDirecta(): void {
    const motivo = this.motivoTexto().trim();
    if (!motivo) return;

    this.procesando.set(true);
    this.transferenciasService.cancelarTransferencia(this.data.transferenciaId, motivo).subscribe({
      next: () => {
        this.procesando.set(false);
        this.dialogRef.close(true);
        this.notification.warning('Transferencia Cancelada', `La orden #${this.data.transferenciaId} ha sido anulada con éxito.`);
      },
      error: (err) => {
        this.procesando.set(false);
        this.notification.error('Error al cancelar', err?.error?.message || 'No se pudo cancelar la orden');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PlanillasService } from '../../core/services/planillas.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PlanillaItem, PlanillaDetalleResponse, PlanillaDetalleItem, DesembolsarPlanillaPayload } from '../../core/models/planillas.models';
import { FormatEnumPipe } from '../../shared/pipes/format-enum.pipe';
import { BoletaPagoModalComponent } from './modals/boleta-pago-modal.component';

@Component({
  selector: 'app-planilla-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormatEnumPipe,
  ],
  template: `
    <div class="p-6 bg-white rounded-2xl max-w-5xl w-full print:p-2 print:max-w-none text-slate-800">
      
      <!-- Encabezado Modal Estandarizado -->
      <div class="flex items-start justify-between pb-4 border-b border-slate-100 print:border-b-2">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shadow-2xs print:hidden shrink-0">
            <mat-icon class="!text-xl !w-5 !h-5">receipt_long</mat-icon>
          </div>
          <div>
            <div class="hidden print:block text-xs font-black text-slate-400 uppercase tracking-widest">
              FARMACIA PLUS, S.A.
            </div>
            
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base sm:text-lg font-black text-slate-800">
                @if (data.sucursalId) {
                  Consolidado de Planilla - {{ data.sucursalNombre || ('Sucursal #' + data.sucursalId) }}
                } @else {
                  Consolidado General de Planilla (Todas las Sedes)
                }
              </h3>
              
              <span
                class="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full border"
                [ngClass]="data.sucursalId ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-purple-50 text-purple-700 border-purple-200'"
              >
                {{ data.sucursalId ? (data.sucursalNombre || 'Sede Local') : '🏢 Corporativo' }}
              </span>
            </div>

            <p class="text-xs text-slate-500 mt-0.5">
              Planilla No. <strong>#{{ data.planillaId }}</strong> | Período: <strong>{{ data.fechaInicio | date:'dd/MM/yyyy' }} al {{ data.fechaFin | date:'dd/MM/yyyy' }}</strong>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 print:hidden">
          <button
            type="button"
            (click)="imprimirConsolidado()"
            class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <mat-icon class="!text-sm !w-4 !h-4">print</mat-icon>
            <span>Imprimir</span>
          </button>
          
          <button
            type="button"
            (click)="cerrar()"
            class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <mat-icon class="!text-lg !w-4 !h-4">close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Resumen Financiero Consolidado -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <div>
          <span class="text-3xs text-slate-400 font-semibold uppercase block">Total Bruto Devengado</span>
          <span class="text-base font-black text-slate-900">Q {{ data.totalBruto | number:'1.2-2' }}</span>
        </div>
        <div>
          <span class="text-3xs text-rose-600 font-semibold uppercase block">(-) Retención IGSS (4.83%)</span>
          <span class="text-base font-black text-rose-700">Q {{ data.totalDescuentos | number:'1.2-2' }}</span>
        </div>
        <div>
          <span class="text-3xs text-emerald-600 font-semibold uppercase block">(=) Líquido Total a Pagar</span>
          <span class="text-base font-black text-emerald-700">Q {{ data.totalNeto | number:'1.2-2' }}</span>
        </div>
        <div>
          <span class="text-3xs text-slate-400 font-semibold uppercase block">Estado de Liquidación</span>
          <span
            class="text-2xs font-extrabold px-2.5 py-0.5 rounded-full border inline-block mt-0.5"
            [ngClass]="data.estado === 'PAGADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
          >
            {{ data.estado | formatEnum }}
          </span>
        </div>
      </div>

      <!-- Evidencia de Pago / Desembolso si ya está pagada -->
      @if (data.estado === 'PAGADA') {
        <div class="mb-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2 print:border-emerald-300">
          <div class="flex items-center gap-2">
            <mat-icon class="text-emerald-600 !w-4 !h-4 !text-sm">verified</mat-icon>
            <span class="font-bold text-emerald-900">
              Desembolso registrado el {{ data.fechaPago | date:'dd/MM/yyyy HH:mm' }}
            </span>
          </div>
          <div class="flex items-center gap-3 text-2xs text-emerald-800">
            <span><strong>Origen:</strong> {{ data.origenFondos === 'BANCO' ? ('Banco: ' + (data.bancoOrigen || 'Corporativo')) : 'Caja de Tienda' }}</span>
            @if (data.referenciaPago) {
              <span><strong>Ref / Aut:</strong> {{ data.referenciaPago }}</span>
            }
          </div>
        </div>
      }

      <!-- Formulario Inline de Desembolso / Liquidación -->
      @if (mostrandoFormularioPago()) {
        <div class="mb-4 p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 space-y-3">
          <div class="flex items-center justify-between border-b border-emerald-200/60 pb-2">
            <div class="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wide">
              <mat-icon class="text-emerald-600 !w-4 !h-4 !text-sm">account_balance_wallet</mat-icon>
              <span>Confirmación de Desembolso y Salida de Fondos</span>
            </div>
            <button
              type="button"
              (click)="cancelarFormularioPago()"
              class="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <!-- Origen de Fondos -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Origen del Dinero *</label>
              <select
                [(ngModel)]="pagoPayload.origenFondos"
                class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
              >
                <option value="BANCO">Cuenta Bancaria Corporativa</option>
                <option value="CAJA">Caja de Tienda (Gaveta / Efectivo)</option>
              </select>
            </div>

            <!-- Banco de Origen (si es BANCO) -->
            @if (pagoPayload.origenFondos === 'BANCO') {
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Banco Emisor *</label>
                <select
                  [(ngModel)]="pagoPayload.bancoOrigen"
                  class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
                >
                  <option value="Banco Industrial">Banco Industrial</option>
                  <option value="Banrural">Banrural</option>
                  <option value="G&T Continental">G&T Continental</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                  <option value="BAM">BAM</option>
                  <option value="Interbanco">Interbanco</option>
                </select>
              </div>
            } @else {
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Afectación en Tienda</label>
                <div class="bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-2.5 py-1.5 text-2xs font-semibold">
                  Se registrará egreso formal de nómina en la caja de la sede.
                </div>
              </div>
            }

            <!-- Referencia de Pago -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">No. Comprobante / Ref *</label>
              <input
                type="text"
                [(ngModel)]="pagoPayload.referenciaPago"
                placeholder="Ej. TRF-8921 o CHK-0012"
                class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>

          <!-- Observaciones opcionales -->
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Notas u Observaciones</label>
            <input
              type="text"
              [(ngModel)]="pagoPayload.observacionesPago"
              placeholder="Ej. Desembolso quincena autorizada por Gerencia"
              class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              (click)="cancelarFormularioPago()"
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              [disabled]="guardandoPago() || !pagoPayload.referenciaPago.trim()"
              (click)="ejecutarDesembolso()"
              class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <mat-icon class="!text-sm !w-4 !h-4">check</mat-icon>
              <span>{{ guardandoPago() ? 'Procesando...' : 'Confirmar y Desembolsar' }}</span>
            </button>
          </div>
        </div>
      }

      @if (cargando()) {
        <div class="py-12 text-center text-slate-400">
          <mat-icon class="animate-spin text-emerald-600">sync</mat-icon>
          <p class="text-xs font-semibold mt-1">Cargando boletas de colaboradores...</p>
        </div>
      } @else if (detalle()) {
        <div class="overflow-x-auto max-h-[48vh] border border-slate-200 rounded-xl print:max-h-none print:border-none">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">COLABORADOR</th>
                <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">DPI</th>
                <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">PUESTO</th>
                
                <!-- Columna Condicional: Solo visible si es Consolidada General (Todas las Sedes) -->
                @if (!data.sucursalId) {
                  <th class="py-2.5 px-3 text-3xs font-semibold uppercase text-slate-500">SUCURSAL</th>
                }

                <th class="py-2.5 px-3 text-right text-3xs font-semibold uppercase text-slate-500">SUELDO BASE</th>
                <th class="py-2.5 px-3 text-right text-3xs font-semibold uppercase text-slate-500">BONIF. LEY</th>
                <th class="py-2.5 px-3 text-right text-3xs font-semibold uppercase text-slate-500">IGSS (4.83%)</th>
                <th class="py-2.5 px-3 text-right text-3xs font-semibold uppercase text-slate-500">LÍQUIDO</th>
                <th class="py-2.5 px-3 text-center text-3xs font-semibold uppercase text-slate-500 print:hidden">BOLETA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (d of detalle()?.detalles || []; track d.planillaDetalleId) {
                <tr class="hover:bg-slate-50/60 transition-colors">
                  <td class="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{{ d.colaborador }}</td>
                  <td class="py-2.5 px-3 text-slate-500 font-mono text-2xs whitespace-nowrap">{{ d.dpi }}</td>
                  <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">{{ d.puesto }}</td>
                  
                  <!-- Celda Condicional de Sucursal -->
                  @if (!data.sucursalId) {
                    <td class="py-2.5 px-3 text-slate-500 whitespace-nowrap">{{ d.sucursal }}</td>
                  }

                  <td class="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">Q {{ d.salarioBase | number:'1.2-2' }}</td>
                  <td class="py-2.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">+Q {{ d.bonificaciones | number:'1.2-2' }}</td>
                  <td class="py-2.5 px-3 text-right font-semibold text-rose-700 whitespace-nowrap">-Q {{ d.descuentoIgss || d.descuentos | number:'1.2-2' }}</td>
                  <td class="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">Q {{ d.totalPagar | number:'1.2-2' }}</td>
                  <td class="py-2.5 px-3 text-center print:hidden">
                    <button
                      type="button"
                      (click)="abrirBoleta(d)"
                      title="Ver e Imprimir Boleta de Pago"
                      class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <mat-icon class="!text-xs !w-3 !h-3 text-emerald-600">receipt_long</mat-icon>
                      <span>Boleta</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Firmas para Impresión de Planilla Consolidada -->
        <div class="hidden print:grid grid-cols-3 gap-6 pt-12 text-center text-2xs text-slate-500">
          <div class="border-t border-slate-400 pt-1">
            <strong>Elaborado por</strong>
            <div>Recursos Humanos / Administración</div>
          </div>
          <div class="border-t border-slate-400 pt-1">
            <strong>Revisado por</strong>
            <div>Auditoría Interna</div>
          </div>
          <div class="border-t border-slate-400 pt-1">
            <strong>Autorizado por</strong>
            <div>Gerencia General</div>
          </div>
        </div>
      }

      <!-- Acciones de Pie del Modal -->
      <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between print:hidden">
        <div>
          @if (data.estado === 'ABIERTA') {
            @if (puedeDesembolsar()) {
              <button
                type="button"
                [disabled]="mostrandoFormularioPago()"
                (click)="iniciarFormularioPago()"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <mat-icon class="!text-sm !w-4 !h-4">attach_money</mat-icon>
                <span>Desembolsar / Marcar como Pagada</span>
              </button>
            } @else {
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-2xs font-semibold border border-slate-200">
                <mat-icon class="!text-xs !w-3.5 !h-3.5 text-slate-400">lock</mat-icon>
                <span>Desembolso reservado a Administración Central o Gerente de esta Sede</span>
              </div>
            }
          }
        </div>

        <button
          type="button"
          (click)="cerrar()"
          class="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-colors"
        >
          Cerrar
        </button>
      </div>

    </div>
  `
})
export class PlanillaDetalleModalComponent implements OnInit {
  readonly data: PlanillaItem = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlanillaDetalleModalComponent>);
  private readonly planillasService = inject(PlanillasService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly cargando = signal<boolean>(true);
  readonly detalle = signal<PlanillaDetalleResponse | null>(null);
  readonly mostrandoFormularioPago = signal<boolean>(false);
  readonly guardandoPago = signal<boolean>(false);

  readonly pagoPayload: DesembolsarPlanillaPayload = {
    origenFondos: 'BANCO',
    bancoOrigen: 'Banco Industrial',
    referenciaPago: '',
    observacionesPago: '',
  };

  /**
   * Regla de Seguridad y Alcance:
   * - SUPER_ADMIN: Puede liquidar cualquier planilla (global o de sucursal).
   * - GERENTE_SUCURSAL: Solo puede liquidar la planilla si pertenece estrictamente a su sucursal.
   *   Un gerente de sucursal NUNCA puede liquidar una planilla consolidada general (data.sucursalId == null)
   *   ni de otra sede distinta a la suya.
   */
  readonly puedeDesembolsar = computed(() => {
    if (this.authService.isSuperAdmin()) return true;

    if (this.authService.isGerente()) {
      const userSuc = this.authService.currentUser()?.sucursalId;
      if (!this.data.sucursalId) return false; // Bloqueado para nómina general
      return Number(this.data.sucursalId) === Number(userSuc);
    }

    return false;
  });

  ngOnInit(): void {
    this.planillasService.obtenerDetallePlanilla(this.data.planillaId).subscribe({
      next: (res) => {
        this.detalle.set(res);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirBoleta(item: PlanillaDetalleItem): void {
    this.dialog.open(BoletaPagoModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { item, planilla: this.data },
    });
  }

  imprimirConsolidado(): void {
    window.print();
  }

  iniciarFormularioPago(): void {
    this.mostrandoFormularioPago.set(true);
  }

  cancelarFormularioPago(): void {
    this.mostrandoFormularioPago.set(false);
  }

  ejecutarDesembolso(): void {
    if (!this.pagoPayload.referenciaPago.trim()) {
      this.notification.warning('Referencia Requerida', 'Ingresa el número de referencia, comprobante o autorización.');
      return;
    }

    this.guardandoPago.set(true);
    this.planillasService.pagarPlanilla(this.data.planillaId, this.pagoPayload).subscribe({
      next: (res: any) => {
        this.guardandoPago.set(false);
        this.notification.success('Desembolso Procesado', res?.mensaje || 'Planilla liquidada.');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.guardandoPago.set(false);
        this.notification.error('Error al desembolsar', err?.error?.message || 'Fallo en la operación.');
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

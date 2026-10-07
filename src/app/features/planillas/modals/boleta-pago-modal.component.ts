import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PlanillaDetalleItem, PlanillaItem } from '../../../core/models/planillas.models';

@Component({
  selector: 'app-boleta-pago-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6 sm:p-8 bg-white rounded-2xl max-w-xl w-full print:p-0 print:max-w-none print:shadow-none">
      <!-- Barra Superior de Acciones (Oculta en Impresión) -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 print:hidden">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <mat-icon class="!text-lg !w-4.5 !h-4.5">receipt_long</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-800">Boleta de Pago & Liquidación</h3>
            <p class="text-2xs text-slate-400">Comprobante oficial de pago de nómina</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="imprimir()"
            class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <mat-icon class="!text-sm !w-4 !h-4">print</mat-icon>
            <span>Imprimir Boleta</span>
          </button>
          <button
            type="button"
            (click)="dialogRef.close()"
            class="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <mat-icon class="!text-lg !w-4.5 !h-4.5">close</mat-icon>
          </button>
        </div>
      </div>

      <!-- FORMATO OFICIAL DE LA BOLETA (Diseño Corporativo & Imprimible) -->
      <div class="border border-slate-200 rounded-2xl p-5 space-y-4 print:border-none print:p-0">
        <!-- Membrete -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h1 class="text-base font-black text-slate-900 tracking-tight">FARMACIA PLUS, S.A.</h1>
            <p class="text-2xs text-slate-500">Sistema Integral de Nóminas y Seguridad Social</p>
            <p class="text-2xs text-slate-400">NIT: 1029384-5 • Guatemala, C.A.</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-2.5 py-0.5 rounded-full text-2xs font-black border bg-emerald-50 text-emerald-700 border-emerald-200">
              BOLETA OFICIAL DE PAGO
            </span>
            <div class="text-2xs font-bold text-slate-700 mt-1">Nómina No. #{{ planilla.planillaId }}</div>
          </div>
        </div>

        <!-- Datos del Colaborador -->
        <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-3xs text-slate-400 uppercase font-extrabold block">Colaborador</span>
            <span class="font-black text-slate-800">{{ item.colaborador }}</span>
          </div>
          <div>
            <span class="text-3xs text-slate-400 uppercase font-extrabold block">DPI / Identificación</span>
            <span class="font-mono font-bold text-slate-800">{{ item.dpi }}</span>
          </div>
          <div>
            <span class="text-3xs text-slate-400 uppercase font-extrabold block">Puesto / Cargo</span>
            <span class="font-bold text-slate-700">{{ item.puesto }}</span>
          </div>
          <div>
            <span class="text-3xs text-slate-400 uppercase font-extrabold block">Sucursal</span>
            <span class="font-bold text-slate-700">{{ item.sucursal }}</span>
          </div>
          <div class="col-span-2 pt-1 border-t border-slate-200/60 flex justify-between text-2xs text-slate-500">
            <span>Período: <strong>{{ planilla.fechaInicio | date:'dd/MM/yyyy' }} al {{ planilla.fechaFin | date:'dd/MM/yyyy' }}</strong></span>
            <span>Fecha de Desembolso: <strong>{{ (planilla.fechaPago | date:'dd/MM/yyyy') || 'Pendiente' }}</strong></span>
          </div>
        </div>

        <!-- Tabla de Percepciones y Deducciones -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <!-- Percepciones -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-emerald-50/75 px-3 py-1.5 font-bold text-2xs uppercase text-emerald-800 border-b border-slate-200">
              (+) PERCEPCIONES (INGRESOS)
            </div>
            <div class="p-3 space-y-1.5">
              <div class="flex justify-between">
                <span class="text-slate-600">Sueldo Base Proporcional</span>
                <span class="font-mono font-bold text-slate-800">Q {{ item.salarioBase | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Bonif. Ley (Dto. 37-2001)</span>
                <span class="font-mono font-bold text-emerald-700">+Q {{ item.bonificaciones | number:'1.2-2' }}</span>
              </div>
              @if (item.horasExtra > 0) {
                <div class="flex justify-between">
                  <span class="text-slate-600">Horas Extraordinarias</span>
                  <span class="font-mono font-bold text-slate-800">+Q {{ item.horasExtra | number:'1.2-2' }}</span>
                </div>
              }
              <div class="pt-2 border-t border-slate-100 flex justify-between font-black text-slate-900">
                <span>Total Devengado</span>
                <span class="font-mono">Q {{ (item.salarioBase + item.bonificaciones + item.horasExtra) | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Deducciones -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-rose-50/75 px-3 py-1.5 font-bold text-2xs uppercase text-rose-800 border-b border-slate-200">
              (-) DEDUCCIONES DE LEY
            </div>
            <div class="p-3 space-y-1.5">
              <div class="flex justify-between">
                <span class="text-slate-600">Cuota Laboral IGSS (4.83%)</span>
                <span class="font-mono font-bold text-rose-700">-Q {{ item.descuentos | number:'1.2-2' }}</span>
              </div>
              <div class="pt-8 border-t border-slate-100 flex justify-between font-black text-rose-800">
                <span>Total Descuentos</span>
                <span class="font-mono">-Q {{ item.descuentos | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Líquido Neto a Recibir -->
        <div class="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
          <div>
            <span class="text-3xs uppercase tracking-widest text-slate-400 font-black block">LÍQUIDO A RECIBIR</span>
            <span class="text-2xs text-slate-300">Neto acreditado a cuenta salarial</span>
          </div>
          <div class="text-xl font-black font-mono text-emerald-400">
            Q {{ item.totalPagar | number:'1.2-2' }}
          </div>
        </div>

        <!-- Firmas de Conformidad -->
        <div class="pt-8 grid grid-cols-2 gap-8 text-center text-2xs text-slate-500">
          <div>
            <div class="border-t border-slate-300 pt-1.5 font-bold text-slate-700">Firma del Colaborador</div>
            <span>DPI: {{ item.dpi }}</span>
          </div>
          <div>
            <div class="border-t border-slate-300 pt-1.5 font-bold text-slate-700">Recursos Humanos / Nóminas</div>
            <span>Farmacia Plus, S.A.</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BoletaPagoModalComponent {
  dialogRef = inject(MatDialogRef<BoletaPagoModalComponent>);
  data = inject(MAT_DIALOG_DATA) as { item: PlanillaDetalleItem; planilla: PlanillaItem };

  item = this.data.item;
  planilla = this.data.planilla;

  imprimir(): void {
    window.print();
  }
}

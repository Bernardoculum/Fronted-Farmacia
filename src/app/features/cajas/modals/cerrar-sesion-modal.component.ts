import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CajasService } from '../../../core/services/cajas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SesionCajaItem, SesionDetalleResponse } from '../../../core/models/cajas.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-cerrar-sesion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule, OnlyNumbersDirective],
  template: `
    <div class="p-6 bg-white rounded-2xl max-w-xl w-full">
      <!-- Cabecera -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <mat-icon class="!text-xl !w-5 !h-5">balance</mat-icon>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-800">Arqueo y Cierre de Caja</h3>
            <p class="text-xs text-slate-500">Sesión #{{ data.sesionCajaId }} - {{ data.codigoCaja }} ({{ data.sucursal }})</p>
          </div>
        </div>
        <button
          type="button"
          (click)="cerrar()"
          class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          <mat-icon class="!text-lg !w-4 !h-4">close</mat-icon>
        </button>
      </div>

      <!-- Resumen Financiero del Sistema -->
      <div class="mt-4 grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <span class="text-3xs font-semibold text-slate-400 uppercase block">Fondo Inicial</span>
          <span class="text-sm font-black text-slate-700">Q {{ (data.saldoInicial || 0).toFixed(2) }}</span>
        </div>
        <div>
          <span class="text-3xs font-semibold text-emerald-600 uppercase block">(+) Ingresos</span>
          <span class="text-sm font-black text-emerald-700">Q {{ (data.totalIngresos || 0).toFixed(2) }}</span>
        </div>
        <div>
          <span class="text-3xs font-semibold text-rose-600 uppercase block">(-) Egresos</span>
          <span class="text-sm font-black text-rose-700">Q {{ (data.totalEgresos || 0).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Caja de Arqueo Físico -->
      <form [formGroup]="form" (ngSubmit)="confirmarCierre()" class="mt-5 space-y-4">
        <!-- Efectivo Contado Físicamente -->
        <div class="p-4 rounded-xl border-2 border-slate-200 bg-slate-50/40 space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-black text-slate-800 uppercase tracking-wider">
              Efectivo Contado en Caja (Q) *
            </label>
            <span class="text-xs font-semibold text-slate-500">
              Esperado: <strong class="text-slate-800">Q {{ efectivoEsperado().toFixed(2) }}</strong>
            </span>
          </div>

          <div class="relative">
            <span class="absolute left-4 top-3 text-base font-black text-slate-400">Q</span>
            <input
              type="text"
              formControlName="efectivoContado"
              appOnlyNumbers
              [allowDecimals]="true"
              placeholder="Ingresa el monto contado..."
              class="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
            />
          </div>

          <!-- Indicador dinámico en vivo del arqueo -->
          @if (form.get('efectivoContado')?.value !== null && form.get('efectivoContado')?.value !== '') {
            <div
              class="p-3 rounded-xl border flex items-center justify-between"
              [ngClass]="{
                'bg-emerald-50 border-emerald-200 text-emerald-800': diferencia() === 0,
                'bg-sky-50 border-sky-200 text-sky-800': diferencia() > 0,
                'bg-rose-50 border-rose-200 text-rose-800': diferencia() < 0
              }"
            >
              <div class="flex items-center gap-2 font-bold text-xs">
                @if (diferencia() === 0) {
                  <mat-icon class="!text-base !w-4 !h-4 text-emerald-600">check_circle</mat-icon>
                  <span>Cuadre Exacto sin Diferencia</span>
                } @else if (diferencia() > 0) {
                  <mat-icon class="!text-base !w-4 !h-4 text-sky-600">arrow_upward</mat-icon>
                  <span>Sobrante en Caja</span>
                } @else {
                  <mat-icon class="!text-base !w-4 !h-4 text-rose-600">warning</mat-icon>
                  <span>Faltante en Caja</span>
                }
              </div>
              <span class="text-sm font-black">
                {{ diferencia() >= 0 ? '+' : '' }}Q {{ diferencia().toFixed(2) }}
              </span>
            </div>
          }
        </div>

        <!-- Observaciones de Cierre -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1.5">Observación / Justificación del Cuadre</label>
          <textarea
            rows="2"
            formControlName="observacionCierre"
            placeholder="Comentarios sobre el turno o arqueo..."
            class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          ></textarea>
        </div>

        <!-- Acciones -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            (click)="cerrar()"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            [disabled]="form.invalid || guardando()"
            class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <mat-icon class="!text-sm !w-4 !h-4">lock</mat-icon>
            <span>{{ guardando() ? 'Cerrando...' : 'Confirmar Cierre de Turno' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CerrarSesionModalComponent implements OnInit {
  readonly data: SesionCajaItem = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CerrarSesionModalComponent>);
  private readonly cajasService = inject(CajasService);
  private readonly notification = inject(NotificationService);

  readonly guardando = signal<boolean>(false);
  readonly efectivoEsperado = signal<number>(0);

  readonly form: FormGroup = this.fb.group({
    efectivoContado: [null, [Validators.required, Validators.min(0)]],
    observacionCierre: [''],
  });

  readonly contado = signal<number>(0);

  readonly diferencia = computed(() => {
    return Number(this.contado() || 0) - this.efectivoEsperado();
  });

  ngOnInit(): void {
    const saldo = Number(this.data.saldoInicial || 0);
    const ing = Number(this.data.totalIngresos || 0);
    const eg = Number(this.data.totalEgresos || 0);
    const esperado = saldo + ing - eg;
    this.efectivoEsperado.set(esperado);

    // Precargar con el esperado para agilizar si el cuadre es exacto
    this.form.patchValue({ efectivoContado: esperado });
    this.contado.set(esperado);

    this.form.get('efectivoContado')?.valueChanges.subscribe((val) => {
      this.contado.set(val !== null ? Number(val) : 0);
    });
  }

  async confirmarCierre(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;

    const diff = this.diferencia();
    let msg = `El arqueo registra un cuadre exacto (Q ${this.efectivoEsperado().toFixed(2)}).`;
    if (diff > 0) msg = `Se registrará un SOBRANTE de Q ${diff.toFixed(2)}.`;
    if (diff < 0) msg = `Se registrará un FALTANTE de Q ${Math.abs(diff).toFixed(2)}.`;

    const ok = await this.notification.confirm({
      title: '¿Confirmar Cierre de Caja?',
      text: `${msg} Una vez cerrada la sesión, no se podrán registrar más cobros ni movimientos en este turno.`,
      confirmText: 'Sí, Cerrar Turno',
      type: diff < 0 ? 'danger' : 'info',
    });
    if (!ok) return;

    this.guardando.set(true);
    const val = this.form.value;

    this.cajasService
      .cerrarSesion(this.data.sesionCajaId, {
        efectivoContado: Number(val.efectivoContado),
        observacionCierre: val.observacionCierre,
      })
      .subscribe({
        next: (res: any) => {
          this.notification.success(
            'Turno Cerrado Exitosamente',
            `Sesión #${this.data.sesionCajaId} finalizada. Diferencia: Q ${Number(res.diferencia || 0).toFixed(2)} (${res.estadoArqueo}).`
          );
          this.guardando.set(false);
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.notification.error('Error al cerrar turno', err?.error?.message || 'No se pudo cerrar la sesión');
          this.guardando.set(false);
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CajasService } from '../../../core/services/cajas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CajaItem } from '../../../core/models/cajas.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-abrir-sesion-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    OnlyNumbersDirective,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-lg w-full bg-white text-slate-800 rounded-2xl">
      <!-- Cabecera Estandarizada -->
      <div class="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <mat-icon class="text-2xl">point_of_sale</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Control de Turnos
            </span>
            <h3 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">Apertura de Turno de Caja</h3>
            <p class="text-xs text-slate-500">Asigna la terminal física (caja registradora) y el fondo inicial</p>
          </div>
        </div>
        <button
          type="button"
          mat-icon-button
          (click)="cerrar()"
          class="text-slate-400 hover:text-slate-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Banner de Error Inline (Sin modales de SweetAlert superpuestos) -->
      @if (errorMessage()) {
        <div class="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-fadeIn">
          <div class="flex items-center gap-2">
            <mat-icon class="!text-base !w-4 !h-4 text-rose-500">error_outline</mat-icon>
            <span class="font-medium">{{ errorMessage() }}</span>
          </div>
          <button type="button" (click)="errorMessage.set(null)" class="text-rose-400 hover:text-rose-600">
            <mat-icon class="!text-sm !w-3.5 !h-3.5">close</mat-icon>
          </button>
        </div>
      }

      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        <!-- Terminal de Caja -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
            Terminal / Caja Física *
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select formControlName="cajaId" placeholder="Selecciona una terminal de caja...">
              @for (c of cajasDisponibles(); track c.cajaId) {
                <mat-option [value]="c.cajaId">
                  {{ c.codigoCaja }} - {{ c.sucursal }} ({{ c.descripcion || 'General' }})
                </mat-option>
              }
            </mat-select>
            @if (form.get('cajaId')?.hasError('required') && form.get('cajaId')?.touched) {
              <mat-error class="text-2xs">Debe seleccionar una caja</mat-error>
            }
          </mat-form-field>

          <!-- Estados informativos si no hay cajas -->
          @if (!cargandoCajas()) {
            @if (totalCajasRegistradas() === 0) {
              <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 -mt-2 mb-2 text-xs text-amber-800 flex items-start gap-2">
                <mat-icon class="!text-sm !w-4 !h-4 text-amber-600 shrink-0 mt-0.5">warning</mat-icon>
                <span>No hay terminales de cobro registradas para esta sucursal. Contacta a un administrador.</span>
              </div>
            } @else if (cajasDisponibles().length === 0) {
              <div class="p-2.5 rounded-lg bg-sky-50 border border-sky-200 -mt-2 mb-2 text-xs text-sky-800 flex items-start gap-2">
                <mat-icon class="!text-sm !w-4 !h-4 text-sky-600 shrink-0 mt-0.5">info</mat-icon>
                <span>Todas las terminales activas de esta sucursal tienen turnos abiertos actualmente.</span>
              </div>
            }
          }
        </div>

        <!-- Saldo Inicial -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-2xs font-bold text-slate-600 uppercase">Fondo Inicial en Efectivo (Q) *</label>
            <div class="flex items-center gap-1">
              <span class="text-3xs text-slate-400 font-semibold uppercase">Sugerido:</span>
              <button
                type="button"
                (click)="setSaldo(300)"
                class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-3xs font-semibold cursor-pointer"
              >
                Q 300
              </button>
              <button
                type="button"
                (click)="setSaldo(500)"
                class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-3xs font-semibold cursor-pointer"
              >
                Q 500
              </button>
              <button
                type="button"
                (click)="setSaldo(1000)"
                class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-3xs font-semibold cursor-pointer"
              >
                Q 1,000
              </button>
            </div>
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <span matPrefix class="text-slate-400 font-bold mr-1">Q</span>
            <input
              matInput
              type="text"
              formControlName="saldoInicial"
              appOnlyNumbers
              [allowDecimals]="true"
              placeholder="0.00"
            />
            @if (form.get('saldoInicial')?.hasError('required') && form.get('saldoInicial')?.touched) {
              <mat-error class="text-2xs">El fondo inicial es obligatorio</mat-error>
            }
            @if ((form.get('saldoInicial')?.hasError('min') || form.get('saldoInicial')?.hasError('montoInvalido')) && form.get('saldoInicial')?.touched) {
              <mat-error class="text-2xs">Debe ser un valor positivo mayor a 0</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Acciones -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            mat-button
            (click)="cerrar()"
            class="!rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || guardando() || cajasDisponibles().length === 0"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            <mat-icon class="!text-sm !w-4 !h-4 mr-1">lock_open</mat-icon>
            <span>{{ guardando() ? 'Abriendo...' : 'Abrir Turno' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AbrirSesionModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AbrirSesionModalComponent>);
  private readonly cajasService = inject(CajasService);
  private readonly notification = inject(NotificationService);

  readonly cargandoCajas = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly totalCajasRegistradas = signal<number>(0);
  readonly cajasDisponibles = signal<CajaItem[]>([]);

  readonly form: FormGroup = this.fb.group({
    cajaId: [null, [Validators.required]],
    saldoInicial: [500, [Validators.required, CustomValidators.montoPositivo()]],
  });

  ngOnInit(): void {
    this.cajasService.cargarCajas().subscribe({
      next: (cajas) => {
        const todas = cajas || [];
        this.totalCajasRegistradas.set(todas.length);

        const disponibles = todas.filter((c) => c.estado === 'ACTIVA' && !c.estaEnUso);
        this.cajasDisponibles.set(disponibles);
        if (disponibles.length > 0) {
          this.form.patchValue({ cajaId: disponibles[0].cajaId });
        }
        this.cargandoCajas.set(false);
      },
      error: () => this.cargandoCajas.set(false),
    });
  }

  setSaldo(monto: number): void {
    this.form.patchValue({ saldoInicial: monto });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    this.cajasService.abrirSesion({ cajaId: val.cajaId, saldoInicial: Number(val.saldoInicial) }).subscribe({
      next: (res: any) => {
        this.guardando.set(false);
        this.dialogRef.close(true);
        setTimeout(() => {
          this.notification.success(
            'Turno de Caja Abierto',
            `Sesión iniciada con éxito en ${res.caja} con fondo de Q ${Number(res.saldoInicial).toFixed(2)}.`
          );
        }, 80);
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'No se pudo abrir el turno de caja');
        this.guardando.set(false);
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
